// Ingest: pull every source in the registry, normalize into one schema, dedupe,
// and write public/data/meetings.json.
//
//   node scripts/ingest.mjs          # live fetch every source
//   node scripts/ingest.mjs --local  # use bundled snapshots (skips live-only sources)
import { readFile, writeFile } from "node:fs/promises";
import { SOURCES } from "./lib/registry.mjs";
import { normalizeSource, dedupe } from "./lib/normalize.mjs";
import { loadGTFS, enrichMetro } from "./lib/gtfs.mjs";
import { geocodeMissing } from "./lib/geocode.mjs";

const LOCAL = process.argv.includes("--local");
const GTFS_DIR = process.env.GTFS_DIR;          // enrich rail colors/nearest stop
const GEOCODE = process.env.GEOCODE === "1";    // fill missing coords (US Census)
const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ");

async function getJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Fellow/ingest" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function loadSource(s) {
  if (LOCAL) {
    if (!s.localSnapshot) { console.log(`· skip ${s.id} (no local snapshot)`); return []; }
    return JSON.parse(await readFile(new URL(`./lib/${s.localSnapshot}`, import.meta.url)));
  }
  try {
    // National BMLT (aggregator): iterate US states so responses stay reasonable.
    if (s.national && s.system === "bmlt") {
      const all = [];
      for (const st of US_STATES) {
        try {
          const rows = await getJSON(`${s.url}&meeting_key=location_province&meeting_key_value=${st}`);
          if (Array.isArray(rows)) all.push(...rows);
        } catch { /* skip a state that errors */ }
      }
      return all;
    }
    return await getJSON(s.url);
  } catch (e) {
    console.warn(`! ${s.id} failed (${e.message}) — skipping`);
    return [];
  }
}

const all = [];
for (const s of SOURCES) {
  const raw = await loadSource(s);
  const mapped = normalizeSource(raw, { system: s.system, fellowship: s.fellowship });
  console.log(`+ ${s.id} [${s.fellowship}] ${mapped.length} meetings`);
  all.push(...mapped);
}

if (GTFS_DIR) {
  try {
    const idx = await loadGTFS(GTFS_DIR);
    all.forEach((m) => enrichMetro(m, idx));
    console.log(`+ GTFS enrichment applied from ${GTFS_DIR}`);
  } catch (e) {
    console.warn(`! GTFS enrichment skipped (${e.message})`);
  }
}

if (GEOCODE) {
  const { attempted, filled } = await geocodeMissing(all);
  console.log(`+ geocoded ${filled}/${attempted} meetings missing coordinates`);
}

// Drop records without a usable day + time (some national feeds have malformed rows),
// then sort defensively so one bad value can't crash the run.
const usable = dedupe(all).filter(
  (m) => Number.isInteger(m.day) && m.day >= 0 && m.day <= 6 && typeof m.time === "string" && /^\d{1,2}:\d{2}/.test(m.time)
);
const dropped = all.length - usable.length;
if (dropped > 0) console.log(`· dropped ${dropped} records missing a valid day/time`);
const meetings = usable
  .sort((a, b) => (a.day - b.day) || String(a.time).localeCompare(String(b.time)))
  .map((m, i) => ({ ...m, id: String(i + 1) }));

await writeFile(new URL("../public/data/meetings.json", import.meta.url), JSON.stringify(meetings, null, 2));
const byFel = meetings.reduce((o, m) => ((o[m.fellowship] = (o[m.fellowship] || 0) + 1), o), {});
console.log(`\nWrote ${meetings.length} meetings:`, byFel);
