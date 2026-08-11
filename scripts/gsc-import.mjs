// Import a Google Search Console "Export" into the file the /studio dashboard reads
// (src/lib/search-console.json) — no API, no service account, no keys. You click Export in the
// Search Console Performance report (choose CSV), then point this at the download:
//
//   npm run gsc:import ~/Downloads/fellow.space-Performance-on-Search-2026-08-11.zip
//   npm run gsc:import ~/Downloads/some-export-folder        # if you already unzipped it
//
// The CSV export is a .zip containing Dates.csv, Queries.csv and Pages.csv (plus others we ignore).
// We read totals from Dates.csv, top queries from Queries.csv, and low-ranking high-impression
// "opportunity" pages from Pages.csv. Nothing is invented — if a file is missing we just skip it.
import { readFile, writeFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run gsc:import <path-to-export.zip | export-folder>");
  process.exit(1);
}
if (!existsSync(arg)) { console.error(`✗ Not found: ${arg}`); process.exit(1); }

// Minimal CSV parser: handles quoted fields, embedded commas, and doubled quotes.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", i = 0, q = false;
  text = text.replace(/^﻿/, "");            // strip BOM
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && r.some((x) => x !== ""));
}
const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : 0; };
const pct = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n / 100 : 0; };

// Resolve the argument to a directory of CSVs (unzipping a .zip into a temp dir if needed).
async function csvDir() {
  if (statSync(arg).isDirectory()) return { dir: arg, cleanup: null };
  if (/\.zip$/i.test(arg)) {
    const tmp = await mkdtemp(path.join(tmpdir(), "gsc-"));
    const r = spawnSync("unzip", ["-o", "-j", arg, "-d", tmp], { encoding: "utf8" });
    if (r.status !== 0) { console.error(`✗ Could not unzip (${r.stderr || r.error?.message}). Unzip it yourself and pass the folder.`); process.exit(1); }
    return { dir: tmp, cleanup: tmp };
  }
  console.error("✗ Pass either the exported .zip or a folder of the exported CSVs."); process.exit(1);
}

// Find a CSV by trying several name keywords in order (Search Console's naming varies: the
// time-series file is "Chart.csv" in the UI export but "Dates.csv" elsewhere).
async function findCsv(dir, ...keywords) {
  const files = await readdir(dir);
  for (const keyword of keywords) {
    const hit = files.find((f) => f.toLowerCase().includes(keyword) && f.toLowerCase().endsWith(".csv"));
    if (hit) return path.join(dir, hit);
  }
  return null;
}
async function readRows(file) {
  if (!file) return { header: [], rows: [] };
  const rows = parseCsv(await readFile(file, "utf8"));
  return { header: (rows[0] || []).map((h) => h.toLowerCase()), rows: rows.slice(1) };
}
// Column index by fuzzy header match, with a positional fallback.
const col = (header, ...names) => {
  for (const n of names) { const i = header.findIndex((h) => h.includes(n)); if (i >= 0) return i; }
  return -1;
};

async function main() {
  const { dir, cleanup } = await csvDir();

  // Totals from the time-series file — "Chart.csv" in the UI export, "Dates.csv" elsewhere.
  const datesFile = await findCsv(dir, "chart", "date");
  const dates = await readRows(datesFile);
  let clicks = 0, impressions = 0, posWeighted = 0, dateMin = "", dateMax = "";
  if (dates.rows.length) {
    const H = dates.header;
    const cC = col(H, "click"), cI = col(H, "impress"), cP = col(H, "position"), cD = col(H, "date");
    for (const r of dates.rows) {
      const imp = num(r[cI]); const cl = num(r[cC]); const p = num(r[cP]);
      clicks += cl; impressions += imp; posWeighted += p * imp;
      const d = (r[cD] || "").trim();
      if (d) { if (!dateMin || d < dateMin) dateMin = d; if (!dateMax || d > dateMax) dateMax = d; }
    }
  }
  const position = impressions ? +(posWeighted / impressions).toFixed(1) : 0;

  // Top queries by clicks.
  const q = await readRows(await findCsv(dir, "quer"));
  const topQueries = (() => {
    if (!q.rows.length) return [];
    const H = q.header;
    const cQ = col(H, "quer", "top quer") >= 0 ? col(H, "quer", "top quer") : 0;
    const cC = col(H, "click"), cI = col(H, "impress"), cP = col(H, "position");
    return q.rows
      .map((r) => ({ query: (r[cQ] || "").trim(), clicks: num(r[cC]), impressions: num(r[cI]), position: +num(r[cP]).toFixed(1) }))
      .filter((x) => x.query)
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, 12);
  })();

  // Opportunities from Pages.csv: real demand (impressions) but weak placement (position past the
  // top of page one), biggest first. Paths shown relative to the site root.
  const pg = await readRows(await findCsv(dir, "page"));
  const opportunities = (() => {
    if (!pg.rows.length) return [];
    const H = pg.header;
    const cU = col(H, "page", "top page", "url") >= 0 ? col(H, "page", "top page", "url") : 0;
    const cC = col(H, "click"), cI = col(H, "impress"), cP = col(H, "position"), cR = col(H, "ctr");
    return pg.rows
      .map((r) => ({
        page: (r[cU] || "").replace(/^https?:\/\/[^/]+/, "") || "/",
        clicks: num(r[cC]), impressions: num(r[cI]),
        position: +num(r[cP]).toFixed(1), ctr: +pct(r[cR]).toFixed(4),
      }))
      .filter((x) => x.position > 8 && x.impressions >= 1)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 12);
  })();

  const out = {
    generatedAt: new Date().toISOString(),
    range: dateMin && dateMax ? `${dateMin} → ${dateMax}` : "Search Console export",
    clicks, impressions, ctr: impressions ? +(clicks / impressions).toFixed(4) : 0, position,
    topQueries, opportunities,
  };
  await writeFile(new URL("../src/lib/search-console.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  if (cleanup) await rm(cleanup, { recursive: true, force: true });

  console.log(`+ wrote src/lib/search-console.json`);
  console.log(`  ${out.range} · ${clicks.toLocaleString()} clicks / ${impressions.toLocaleString()} impressions · avg pos ${position}`);
  console.log(`  ${topQueries.length} top queries, ${opportunities.length} opportunity pages`);
  const foundAnyFile = !!(datesFile || (await findCsv(dir, "quer")) || (await findCsv(dir, "page")));
  if (!dates.rows.length && !q.rows.length && !pg.rows.length) {
    if (foundAnyFile) {
      console.log("  ℹ The export's CSVs have no data rows yet — that's expected until the property has search traffic. Re-run once it does.");
    } else {
      console.log("  ⚠ No Chart/Queries/Pages CSVs found in there — make sure you exported the Performance report as CSV.");
    }
  } else {
    console.log("  Next: commit src/lib/search-console.json and push — Vercel redeploys and /studio lights up.");
  }
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
