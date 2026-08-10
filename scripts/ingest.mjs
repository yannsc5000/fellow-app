// Ingest: pull every source in the registry, normalize into one schema, dedupe,
// and write public/data/meetings.json.
//
//   node scripts/ingest.mjs          # live fetch every source
//   node scripts/ingest.mjs --local  # use bundled snapshots (skips live-only sources)
import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { SOURCES } from "./lib/registry.mjs";
import { normalizeSource, dedupe } from "./lib/normalize.mjs";
import { loadGTFS, enrichMetro } from "./lib/gtfs.mjs";
import { geocodeMissing } from "./lib/geocode.mjs";

const LOCAL = process.argv.includes("--local");
const GTFS_DIR = process.env.GTFS_DIR;          // enrich rail colors/nearest stop
const GEOCODE = process.env.GEOCODE === "1";    // fill missing coords (US Census)
const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ");

// Browser-like headers get past many intergroup WAFs / bot challenges that
// otherwise return an HTML page or 401/403 to a plain fetch.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};
async function getJSON(url) {
  // Some WAFs wave through a request that looks like the site's own in-page AJAX call:
  // a same-site Referer + the XHR header. Cheap to add and recovers feeds without a browser.
  let referer;
  try { referer = new URL(url).origin + "/"; } catch {}
  const h = { ...HEADERS, "X-Requested-With": "XMLHttpRequest", ...(referer ? { Referer: referer } : {}) };
  const r = await fetch(url, { headers: h, redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Optional headless-browser fallback for feeds behind a Cloudflare/JS bot-challenge
// (these fail every plain fetch regardless of IP; only a real browser gets through).
// Opt in with USE_BROWSER=1 after: npm install playwright && npx playwright install chromium
const USE_BROWSER = process.env.USE_BROWSER === "1";
let _browser = null, _browserTried = false;
async function getBrowser() {
  if (!USE_BROWSER || _browserTried) return _browser;
  _browserTried = true;
  try {
    const { chromium } = await import("playwright");
    _browser = await chromium.launch();
    console.log("+ browser fallback enabled (Playwright/Chromium)");
  } catch (e) {
    console.warn(`! USE_BROWSER=1 but Playwright isn't ready (${e.message}). Run: npm install playwright && npx playwright install chromium`);
  }
  return _browser;
}
async function getJSONviaBrowser(url) {
  const b = await getBrowser();
  if (!b) return null;
  const ctx = await b.newContext({ userAgent: HEADERS["User-Agent"], locale: "en-US" });
  const pg = await ctx.newPage();
  try {
    // Establish a real session FIRST. A direct hit to admin-ajax.php looks like a bot to
    // most WAFs (→ 401/403) even from a browser. Loading a normal page on the same origin
    // clears any Cloudflare challenge and sets session cookies; an in-page, same-origin
    // fetch afterwards carries the cookies + referer the WAF expects — exactly how the
    // TSML plugin itself loads its data. This recovers far more feeds than a direct hit.
    const origin = new URL(url).origin;
    let landed = false;
    for (const path of ["/meetings/", "/meeting-search/", "/"]) {
      try {
        const resp = await pg.goto(origin + path, { waitUntil: "domcontentloaded", timeout: 60000 });
        if (resp && resp.ok()) { landed = true; break; }
      } catch {}
    }
    if (landed) {
      await pg.waitForTimeout(3500); // let any JS challenge finish
      const data = await pg.evaluate(async (u) => {
        try {
          const r = await fetch(u, { headers: { Accept: "application/json, text/plain, */*" }, credentials: "include" });
          if (!r.ok) return null;
          return await r.json();
        } catch { return null; }
      }, url);
      if (Array.isArray(data) && data.length) return data;
    }
    // Last resort: navigate straight to the endpoint (works when it renders JSON as a page).
    await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await pg.waitForTimeout(4000);
    const txt = await pg.evaluate(() => (document.body ? document.body.innerText : ""));
    return JSON.parse(txt);
  } catch {
    return null;
  } finally {
    try { await ctx.close(); } catch {}
  }
}

async function loadSource(s) {
  if (LOCAL) {
    if (!s.localSnapshot) { console.log(`· skip ${s.id} (no local snapshot)`); return []; }
    return JSON.parse(await readFile(new URL(`./lib/${s.localSnapshot}`, import.meta.url)));
  }
  try {
    // National BMLT (aggregator, e.g. tomato.na-bmlt.org): the unfiltered global pull is
    // huge and non-US-heavy, so we instead sweep US regions asking for the nearest ~1000
    // meetings around each point (geo_width negative = auto-expand until N found). dedupe()
    // later removes overlaps. Broad point set → solid national US coverage.
    if (s.national && s.system === "bmlt") {
      const REGIONS = [
        [38.90,-77.04],[40.71,-74.01],[42.36,-71.06],[39.95,-75.17],[33.75,-84.39],[25.76,-80.19],
        [28.54,-81.38],[35.23,-80.84],[36.16,-86.78],[41.88,-87.63],[42.33,-83.05],[44.98,-93.27],
        [39.10,-94.58],[29.76,-95.37],[32.78,-96.80],[30.27,-97.74],[39.74,-104.99],[40.76,-111.89],
        [33.45,-112.07],[34.05,-118.24],[37.77,-122.42],[47.61,-122.33],[45.52,-122.68],[38.58,-121.49],
        [29.95,-90.07],[36.17,-115.14],[21.31,-157.86],[61.22,-149.90],
      ];
      const out = [];
      for (const [lat, lng] of REGIONS) {
        try { const r = await getJSON(`${s.url}&lat_val=${lat}&long_val=${lng}&geo_width=-1000`); if (Array.isArray(r)) out.push(...r); } catch {}
      }
      return out;
    }
    return await getJSON(s.url);
  } catch (e) {
    // Plain fetch failed — try the browser fallback (Cloudflare/JS-challenged feeds).
    const viaB = await getJSONviaBrowser(s.url);
    if (Array.isArray(viaB) && viaB.length) { console.log(`  ↳ ${s.id} recovered via browser`); return viaB; }
    console.warn(`! ${s.id} failed (${e.message}) — skipping`);
    return [];
  }
}

const all = [];
const report = [];
for (const s of SOURCES) {
  const raw = await loadSource(s);
  const mapped = normalizeSource(raw, { system: s.system, fellowship: s.fellowship });
  console.log(`+ ${s.id} [${s.fellowship}] ${mapped.length} meetings`);
  report.push({ id: s.id, fellowship: s.fellowship, area: s.area, n: mapped.length });
  all.push(...mapped);
}

// Surface sources that returned nothing. On a cloud CI runner this is almost always
// the site's WAF blocking the runner's datacenter IP (not a bad URL). If the feed
// opens fine in a browser, run this ingest from your own computer to include it.
const empty = report.filter((r) => r.n === 0);
if (empty.length) {
  console.log(`\n⚠ ${empty.length}/${report.length} source(s) returned 0 meetings — likely IP-blocked from this runner:`);
  for (const r of empty) console.log(`   - ${r.id} [${r.fellowship}] — ${r.area}`);
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

// Drop records we can't show honestly: bad/missing day, missing name, or a missing/
// placeholder time. Feeds commonly emit "00:00" when a meeting has no scheduled time,
// which would surface as a misleading "12:00 AM" — so we treat 00:00 as unknown and drop
// it. Then sort defensively so one bad value can't crash the run.
const deduped = dedupe(all);
const validDay = (m) => Number.isInteger(m.day) && m.day >= 0 && m.day <= 6;
const validTime = (m) => typeof m.time === "string" && /^\d{1,2}:\d{2}/.test(m.time) && m.time.slice(0, 5) !== "00:00";
const validName = (m) => !!(m.name && String(m.name).trim());
const usable = deduped.filter((m) => validDay(m) && validTime(m) && validName(m));
const midnight = deduped.filter((m) => typeof m.time === "string" && m.time.slice(0, 5) === "00:00").length;
const noName = deduped.filter((m) => !validName(m)).length;
const dropped = deduped.length - usable.length;
if (dropped > 0) console.log(`· dropped ${dropped} records — ${midnight} placeholder 00:00 time, ${noName} missing name, rest missing a valid day/time`);
const meetings = usable
  .sort((a, b) => (a.day - b.day) || String(a.time).localeCompare(String(b.time)))
  .map((m, i) => ({ ...m, id: String(i + 1) }));

// Write a compact raw file (for local use — gitignored) plus a gzipped copy that IS
// committed and read by the Vercel build. Gzip keeps the repo small (~9% of raw) and well
// under GitHub's 100 MB single-file limit.
const json = JSON.stringify(meetings);
await writeFile(new URL("../public/data/meetings.json", import.meta.url), json);
await writeFile(new URL("../public/data/meetings.json.gz", import.meta.url), gzipSync(json, { level: 9 }));
const byFel = meetings.reduce((o, m) => ((o[m.fellowship] = (o[m.fellowship] || 0) + 1), o), {});
console.log(`\nWrote ${meetings.length} meetings (${(json.length / 1048576).toFixed(1)}MB raw → meetings.json.gz committed):`, byFel);
if (_browser) { try { await _browser.close(); } catch {} }
