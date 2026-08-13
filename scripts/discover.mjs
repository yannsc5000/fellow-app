// Discovery crawler — fellowship-agnostic. Given candidate domains, probe each for a
// Meeting Guide (TSML) JSON feed or a BMLT root server, VERIFY it returns meetings, dedupe
// against the existing registry, and emit ready-to-paste registry entries plus a full report.
//
// It keys off the plugin signature, NOT the fellowship, so the same crawler discovers feeds
// for AA, CMA, Marijuana Anonymous, Al-Anon, SLAA, NA (BMLT), etc. Only scripts/lib/seeds.mjs
// (the candidate domains) is fellowship-specific.
//
// Usage:
//   node scripts/discover.mjs --seeds                       # probe scripts/lib/seeds.mjs
//   node scripts/discover.mjs aaneworleans.org ndiaa.org    # probe domains from argv
//   node scripts/discover.mjs --file domains.txt            # one domain per line (# = comment)
//   node scripts/discover.mjs --seeds --browser             # headless fallback (WAF/JS-challenged)
//   node scripts/discover.mjs --seeds --force               # re-probe even domains already in the registry
//   node scripts/discover.mjs --seeds --out report.json     # where to write the JSON report
//
// Outputs:
//   • console summary table
//   • a JSON report (--out, default scripts/discovery-report.json)
//   • scripts/discovery-registry-snippet.mjs — paste-ready { id, fellowship, system, area, url }
//     lines for every VERIFIED/CANDIDATE TSML find, so onboarding is copy → paste into registry.mjs
//
// Run it from CI or your own machine, not a cloud sandbox: intergroup WAFs block datacenter
// IPs, so a sandbox run under-reports (verified feeds show as "tsml-candidate"). Same code,
// better network — from a real IP most candidates resolve to verified with live counts.

import { readFile, writeFile } from "node:fs/promises";
import { SOURCES } from "./lib/registry.mjs";

let SEEDS = [];
try { ({ SEEDS } = await import("./lib/seeds.mjs")); } catch { /* seeds file optional */ }

// ---- args -------------------------------------------------------------------------
const A = process.argv.slice(2);
const opts = { seeds: false, force: false, browser: process.env.USE_BROWSER === "1",
  out: "scripts/discovery-report.json", concurrency: 6, file: null, domains: [] };
for (let i = 0; i < A.length; i++) {
  const a = A[i];
  if (a === "--seeds") opts.seeds = true;
  else if (a === "--force") opts.force = true;
  else if (a === "--browser") opts.browser = true;
  else if (a === "--out") opts.out = A[++i];
  else if (a === "--concurrency") opts.concurrency = Number(A[++i]) || 6;
  else if (a === "--file") opts.file = A[++i];
  else if (a.startsWith("--")) console.warn(`(ignoring unknown flag ${a})`);
  else opts.domains.push(a);
}

const normHost = (u) => {
  try { return new URL(u.includes("://") ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return String(u).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(); }
};

// ---- assemble candidates ----------------------------------------------------------
const cand = new Map(); // host -> { host, origin, fellowship, area }
const addCand = (e) => {
  const raw = e.domain || e.url || e;
  const host = normHost(raw);
  // Honor an explicit scheme (handy for testing against a local fixture or forcing http);
  // otherwise assume https, as every real intergroup site is.
  const origin = /^https?:\/\//i.test(raw) ? new URL(raw).origin : `https://${host}`;
  if (host && !cand.has(host)) cand.set(host, { host, origin, fellowship: e.fellowship || "AA", area: e.area || null });
};
if (opts.seeds) SEEDS.forEach(addCand);
if (opts.file) (await readFile(opts.file, "utf8")).split(/\r?\n/).map((s) => s.trim())
  .filter((s) => s && !s.startsWith("#")).forEach((d) => addCand({ domain: d }));
opts.domains.forEach((d) => addCand({ domain: d }));

if (!cand.size) {
  console.error("No candidates. Pass domains, --file <path>, or --seeds (with scripts/lib/seeds.mjs).");
  process.exit(1);
}

// Dedupe against what's already ingested (by hostname), unless --force.
const known = new Set(SOURCES.map((s) => normHost(s.url)));
let list = [...cand.values()];
const already = list.filter((c) => known.has(c.host));
if (!opts.force) list = list.filter((c) => !known.has(c.host));
if (already.length && !opts.force)
  console.log(`· skipping ${already.length} already in registry: ${already.map((c) => c.host).join(", ")}`);

// ---- fetch helpers (shared behavior with ingest.mjs) ------------------------------
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept": "text/html,application/json,*/*",
  "Accept-Language": "en-US,en;q=0.9",
};
const TIMEOUT = 20000;
async function getText(url) {
  const r = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function getJSON(url) {
  let referer; try { referer = new URL(url).origin + "/"; } catch {}
  const h = { ...HEADERS, Accept: "application/json, text/plain, */*", "X-Requested-With": "XMLHttpRequest",
    ...(referer ? { Referer: referer } : {}) };
  const r = await fetch(url, { headers: h, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
// TSML static cache — a plain asset usually outside the admin-ajax WAF rule.
const tsmlCacheUrl = (url) => {
  const m = /^(.*?)\/wp-admin\/admin-ajax\.php/i.exec(url);
  return m ? `${m[1]}/wp-content/uploads/tsml/meetings.json` : null;
};

// Optional headless fallback (opt in with --browser / USE_BROWSER=1). Mirrors ingest.mjs:
// establish a real same-origin session first, then do an in-page fetch of the feed.
const USE_BROWSER = opts.browser;
let _browser = null, _tried = false;
async function getBrowser() {
  if (!USE_BROWSER || _tried) return _browser;
  _tried = true;
  try { const { chromium } = await import("playwright"); _browser = await chromium.launch();
    console.log("+ browser fallback enabled (Playwright/Chromium)"); }
  catch (e) { console.warn(`! --browser set but Playwright isn't ready (${e.message})`); }
  return _browser;
}
async function getJSONviaBrowser(url) {
  const b = await getBrowser(); if (!b) return null;
  const ctx = await b.newContext({ userAgent: HEADERS["User-Agent"], locale: "en-US" });
  const pg = await ctx.newPage();
  try {
    const origin = new URL(url).origin;
    let landed = false;
    for (const p of ["/meetings/", "/meeting-search/", "/"]) {
      try { const resp = await pg.goto(origin + p, { waitUntil: "domcontentloaded", timeout: 60000 });
        if (resp && resp.ok()) { landed = true; break; } } catch {}
    }
    if (landed) {
      await pg.waitForTimeout(3500);
      const data = await pg.evaluate(async (u) => {
        try { const r = await fetch(u, { headers: { Accept: "application/json, text/plain, */*" }, credentials: "include" });
          return r.ok ? await r.json() : null; } catch { return null; }
      }, url);
      if (Array.isArray(data) && data.length) return data;
    }
    await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await pg.waitForTimeout(4000);
    const txt = await pg.evaluate(() => (document.body ? document.body.innerText : ""));
    return JSON.parse(txt);
  } catch { return null; } finally { try { await ctx.close(); } catch {} }
}

// ---- detectors --------------------------------------------------------------------
// TSML advertises itself three ways; any one is enough to try the feed.
function detectTSML(html, origin) {
  const out = { isTSML: false, feedUrl: null, version: null };
  const meta = /<meta[^>]+name=["']meta-12_step_meeting_list["'][^>]*content=["']([^"']+)["']/i.exec(html)
            || /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']meta-12_step_meeting_list["']/i.exec(html);
  if (meta) { out.isTSML = true; out.version = meta[1]; }
  if (/12-step-meeting-list/i.test(html) || /\btsml[-_]/i.test(html)) out.isTSML = true;
  // Preferred: the feed the site advertises in <head> (handles subdir installs like /wp/).
  const link = /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/json["'][^>]+href=["']([^"']+)["']/i.exec(html)
            || /<link[^>]+type=["']application\/json["'][^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (link) { try { out.feedUrl = new URL(link[1], origin).href; } catch {} }
  if (!out.feedUrl && out.isTSML) out.feedUrl = origin + "/wp-admin/admin-ajax.php?action=meetings";
  return out;
}
const detectBMLT = (html) => /main_server\/client_interface|bmlt|BMLTPlugin|semantic\/api/i.test(html);
const otherReason = (html) => {
  if (/cgi-bin/i.test(html)) return "cgi-bin / custom scripts (needs adapter)";
  if (/\.aspx/i.test(html)) return "ASP.NET (e.g. AAStarterKit — needs adapter)";
  if (/wp-content|wordpress/i.test(html)) return "WordPress but no TSML plugin detected";
  if (/\.pdf(["'?]|$)/im.test(html)) return "PDF schedule links only";
  return "unknown / custom site";
};
const summarize = (m) => (!m ? null : {
  name: m.name || m.meeting_name || null,
  city: m.city || m.location_municipality || m.municipality || null,
  hasCoords: !!(m.latitude || m.lat || m.latitude_val),
});

async function verifyFeed(feedUrl) {
  try { const j = await getJSON(feedUrl); if (Array.isArray(j) && j.length) return j; } catch {}
  const cache = tsmlCacheUrl(feedUrl);
  if (cache) { try { const j = await getJSON(cache); if (Array.isArray(j) && j.length) return j; } catch {} }
  if (USE_BROWSER) { const j = await getJSONviaBrowser(feedUrl); if (Array.isArray(j) && j.length) return j; }
  return null;
}

async function probe(c) {
  const origin = c.origin || `https://${c.host}`;
  const res = { host: c.host, fellowship: c.fellowship, area: c.area, status: "", feedUrl: null,
    version: null, count: 0, sample: null, note: null };
  let html;
  try { html = await getText(origin + "/"); }
  catch { try { html = await getText(origin + "/meetings/"); }
    catch (e) {
      // Homepage WAF-blocked. Don't give up — most intergroups are TSML, so try the
      // conventional feed endpoint directly (+ static cache + optional browser). If it
      // returns meetings, that's a verified feed even though we couldn't read the page.
      const guess = origin + "/wp-admin/admin-ajax.php?action=meetings";
      const data = await verifyFeed(guess);
      if (data) { res.status = "tsml-verified"; res.feedUrl = guess; res.count = data.length; res.sample = summarize(data[0]); return res; }
      res.status = "unreachable"; res.note = `${e.message} (homepage + direct feed both blocked; try --browser or CI)`; return res;
    } }

  const t = detectTSML(html, origin);
  if (t.isTSML && t.feedUrl) {
    res.feedUrl = t.feedUrl; res.version = t.version;
    const data = await verifyFeed(t.feedUrl);
    if (data) { res.status = "tsml-verified"; res.count = data.length; res.sample = summarize(data[0]); }
    else { res.status = "tsml-candidate"; res.note = "TSML detected but feed blocked from this runner — retry with --browser or from CI"; }
    return res;
  }
  if (detectBMLT(html)) { res.status = "bmlt"; res.note = "BMLT root server — add as system:\"bmlt\""; return res; }
  res.status = "non-tsml"; res.note = otherReason(html); return res;
}

// ---- run (bounded concurrency) ----------------------------------------------------
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  const worker = async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

console.log(`Probing ${list.length} candidate domain(s)${opts.force ? " (--force: ignoring registry dedupe)" : ""}…\n`);
const results = await pool(list, opts.concurrency, probe);
if (_browser) { try { await _browser.close(); } catch {} }

// ---- report -----------------------------------------------------------------------
const order = { "tsml-verified": 0, "tsml-candidate": 1, bmlt: 2, "non-tsml": 3, unreachable: 4 };
results.sort((a, b) => (order[a.status] - order[b.status]) || (b.count - a.count));
const tally = results.reduce((o, r) => ((o[r.status] = (o[r.status] || 0) + 1), o), {});

const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
console.log(pad("STATUS", 16) + pad("HOST", 30) + pad("FEL", 5) + pad("COUNT", 7) + "NOTE / FEED");
console.log("-".repeat(96));
for (const r of results) {
  const detail = r.status === "tsml-verified" ? `${r.feedUrl}${r.version ? `  (v${r.version})` : ""}`
    : (r.note || r.feedUrl || "");
  console.log(pad(r.status, 16) + pad(r.host, 30) + pad(r.fellowship, 5) + pad(r.count || "", 7) + detail);
}
console.log("\nTally:", tally);

// ---- paste-ready registry snippet -------------------------------------------------
const idFor = (host, fel) => `${fel.toLowerCase()}-${host.replace(/\.(org|com|net|us|info)$/,"").replace(/[^a-z0-9]+/g,"-")}`.slice(0, 40);
const newTsml = results.filter((r) => r.status === "tsml-verified" || r.status === "tsml-candidate");
const snippetLines = newTsml.map((r) => {
  const url = r.feedUrl || `https://${r.host}/wp-admin/admin-ajax.php?action=meetings`;
  const tag = r.status === "tsml-verified" ? `VERIFIED: ${r.count} meetings` : "CANDIDATE: TSML detected; verify from CI/--browser";
  return `  { id: "${idFor(r.host, r.fellowship)}", fellowship: "${r.fellowship}", system: "meeting-guide", area: ${JSON.stringify(r.area || r.host)}, url: "${url}" }, // ${tag}`;
});
const snippet = `// Generated by scripts/discover.mjs — review, then paste new entries into scripts/lib/registry.mjs.\n`
  + `// ${newTsml.length} TSML feed(s) found. Non-TSML / unreachable domains are in the JSON report.\n`
  + (snippetLines.length ? snippetLines.join("\n") + "\n" : "  // (none)\n");

await writeFile(opts.out, JSON.stringify(results, null, 2));
await writeFile("scripts/discovery-registry-snippet.mjs", snippet);
console.log(`\n+ wrote ${opts.out} (full report) and scripts/discovery-registry-snippet.mjs (${newTsml.length} paste-ready entr${newTsml.length === 1 ? "y" : "ies"}).`);
