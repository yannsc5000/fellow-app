// Server-only: the internal data-health engine behind /studio. One memoized pass over the
// ingested dataset produces every metric the dashboard shows — scale, freshness, completeness,
// geo, source split, anomalies — plus a rules-based recommendations engine and a growth series
// from data-history.json. Nothing here is fabricated: every number is derived from the committed
// data, and the freshness "as of" date is the ingest's own generatedAt.
//
// Google Search Console is wired but optional. If a committed src/lib/search-console.json export
// exists it's read and surfaced; otherwise the panel shows an honest "not connected yet" state and
// the rules engine simply skips demand-based recommendations. Connecting it later is a drop-in.
import "server-only";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { FELLOWSHIPS, BY_CODE, fellowshipName, fellowshipColor } from "@/lib/fellowships";
import stats from "@/lib/fellowship-stats.json";
import history from "@/lib/data-history.json";

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "),
);
const STATE_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};
const stateName = (st: string) => STATE_NAME[st] || st;

function stateOf(address: string): string | null {
  if (!address) return null;
  const parts = String(address).split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const m = parts[i].match(/^([A-Z]{2})\b/);
    if (m && US_STATES.has(m[1])) return m[1];
  }
  return null;
}

const DAY_MS = 86_400_000;
// Age in days of a "YYYY-MM-DD …" timestamp relative to a reference epoch. Parses only the visible
// date parts (no timezone guessing) so the bucket is a plain, honest signal.
function ageDays(updated: string, refMs: number): number | null {
  const m = String(updated).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return (refMs - Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) / DAY_MS;
}

export type Severity = "good" | "info" | "warning" | "serious";
export type Recommendation = {
  severity: Severity;
  title: string;
  detail: string;
  metric?: string;            // short right-aligned figure
};
export type FillRate = { key: string; label: string; have: number; of: number; pct: number; scope: string };
export type FelRow = {
  code: string; name: string; color: string; group: string;
  total: number; inPerson: number; online: number;
  dated: number; stalePct: number | null;   // stalePct null when the source carries no timestamps
};
export type StateRow = { st: string; name: string; total: number };
export type SourceRow = { source: string; label: string; total: number; datedPct: number };
export type FamilyRow = { group: string; indexed: number; taxonomy: number; meetings: number };
export type GrowthPoint = { date: string; total: number; inPerson: number; online: number };

export type SearchConsole =
  | { connected: false }
  | {
      connected: true;
      range: string;
      clicks: number; impressions: number; ctr: number; position: number;
      topQueries: { query: string; clicks: number; impressions: number; position: number }[];
      opportunities: { page: string; impressions: number; position: number; ctr: number }[];
    };

export type DataHealth = {
  generatedAt: string;
  refDate: string;             // friendly ingest date used as the freshness "as of"
  daysSinceIngest: number;     // vs. the moment the dashboard renders
  // scale
  total: number; inPerson: number; placed: number; online: number; unplaceable: number;
  indexedFellowships: number; taxonomyFellowships: number;
  statesCovered: number;
  // breakdowns
  fellowships: FelRow[];
  families: FamilyRow[];
  topStates: StateRow[];
  thinStates: StateRow[];
  states: StateRow[];
  sources: SourceRow[];
  // freshness
  datedTotal: number;          // records carrying a parseable source-updated timestamp
  fresh: number; aging: number; stale: number;   // <90d / 90–365d / >365d, of datedTotal
  // completeness
  fill: FillRate[];
  // anomalies
  onlineNoJoin: number;
  // growth
  growth: GrowthPoint[];
  // search console (optional)
  search: SearchConsole;
  // engine
  recommendations: Recommendation[];
};

const SOURCE_LABEL: Record<string, string> = { "meeting-guide": "Meeting Guide (TSML)", bmlt: "BMLT" };

let _cache: DataHealth | null = null;

async function loadRaw(): Promise<any[]> {
  const dir = path.join(process.cwd(), "public", "data");
  try {
    return JSON.parse(await readFile(path.join(dir, "meetings.json"), "utf8"));
  } catch {
    try { return JSON.parse(gunzipSync(await readFile(path.join(dir, "meetings.json.gz"))).toString("utf8")); }
    catch { return []; }
  }
}

async function loadSearchConsole(): Promise<SearchConsole> {
  try {
    const p = path.join(process.cwd(), "src", "lib", "search-console.json");
    const sc = JSON.parse(await readFile(p, "utf8"));
    if (sc && typeof sc === "object" && Number.isFinite(sc.impressions)) {
      return {
        connected: true,
        range: String(sc.range || "last 28 days"),
        clicks: Number(sc.clicks || 0),
        impressions: Number(sc.impressions || 0),
        ctr: Number(sc.ctr || (sc.impressions ? sc.clicks / sc.impressions : 0)),
        position: Number(sc.position || 0),
        topQueries: Array.isArray(sc.topQueries) ? sc.topQueries.slice(0, 12) : [],
        opportunities: Array.isArray(sc.opportunities) ? sc.opportunities.slice(0, 12) : [],
      };
    }
  } catch { /* no export committed yet */ }
  return { connected: false };
}

export async function getDataHealth(): Promise<DataHealth> {
  if (_cache) return _cache;
  const [raw, search] = await Promise.all([loadRaw(), loadSearchConsole()]);
  const generatedAt = (stats as { generatedAt?: string }).generatedAt || "";
  const refMs = generatedAt ? new Date(generatedAt).getTime() : Date.now();

  // per-fellowship accumulators
  const fel: Record<string, { total: number; inPerson: number; online: number; dated: number; stale: number }> = {};
  const byState: Record<string, number> = {};
  const bySource: Record<string, { total: number; dated: number }> = {};

  let inPerson = 0, online = 0, placed = 0, unplaceable = 0;
  let datedTotal = 0, fresh = 0, aging = 0, stale = 0;
  let geocoded = 0, hasAddress = 0, hasWebsite = 0, hasTypes = 0, onlineNoJoin = 0;

  for (const m of raw) {
    const code = m.fellowship || "?";
    const f = (fel[code] ||= { total: 0, inPerson: 0, online: 0, dated: 0, stale: 0 });
    f.total++;
    const src = m.source || "?";
    const s = (bySource[src] ||= { total: 0, dated: 0 });
    s.total++;

    if (m.online) {
      online++; f.online++;
      if (!m.conference_url) onlineNoJoin++;
    } else {
      inPerson++; f.inPerson++;
      if (m.lat != null && m.lng != null) geocoded++;
      const st = stateOf(m.address);
      if (st) { placed++; byState[st] = (byState[st] || 0) + 1; }
      else unplaceable++;
    }

    if (m.address && String(m.address).trim()) hasAddress++;
    if (m.website) hasWebsite++;
    if ((m.types || []).length) hasTypes++;

    if (m.updated) {
      const age = ageDays(String(m.updated), refMs);
      if (age != null) {
        datedTotal++; f.dated++; s.dated++;
        if (age < 90) fresh++;
        else if (age <= 365) aging++;
        else { stale++; f.stale++; }
      }
    }
  }

  const total = raw.length;

  // fellowship rows, biggest first
  const fellowships: FelRow[] = Object.keys(fel)
    .map((code) => {
      const f = fel[code];
      return {
        code, name: fellowshipName(code), color: fellowshipColor(code),
        group: BY_CODE[code]?.group || "Other",
        total: f.total, inPerson: f.inPerson, online: f.online,
        dated: f.dated,
        stalePct: f.dated ? Math.round((f.stale / f.dated) * 100) : null,
      };
    })
    .sort((a, b) => b.total - a.total);

  // families: indexed vs taxonomy coverage + meeting volume
  const indexedCodes = new Set(fellowships.filter((f) => f.total > 0).map((f) => f.code));
  const famAgg: Record<string, FamilyRow> = {};
  for (const f of FELLOWSHIPS) {
    const row = (famAgg[f.group] ||= { group: f.group, indexed: 0, taxonomy: 0, meetings: 0 });
    row.taxonomy++;
    if (indexedCodes.has(f.code)) { row.indexed++; row.meetings += fel[f.code]?.total || 0; }
  }
  const families = Object.values(famAgg);

  // states
  const states: StateRow[] = Object.keys(byState)
    .map((st) => ({ st, name: stateName(st), total: byState[st] }))
    .sort((a, b) => b.total - a.total);
  const topStates = states.slice(0, 8);
  const thinStates = [...states].sort((a, b) => a.total - b.total).slice(0, 8);

  // sources
  const sources: SourceRow[] = Object.keys(bySource)
    .map((src) => ({
      source: src, label: SOURCE_LABEL[src] || src,
      total: bySource[src].total,
      datedPct: bySource[src].total ? Math.round((bySource[src].dated / bySource[src].total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // completeness fill rates
  const pct = (h: number, of: number) => (of ? Math.round((h / of) * 100) : 0);
  const fill: FillRate[] = [
    { key: "geo", label: "Geocoded (lat/lng)", have: geocoded, of: inPerson, pct: pct(geocoded, inPerson), scope: "in-person" },
    { key: "addr", label: "Street address", have: hasAddress, of: total, pct: pct(hasAddress, total), scope: "all" },
    { key: "types", label: "Meeting types tagged", have: hasTypes, of: total, pct: pct(hasTypes, total), scope: "all" },
    { key: "join", label: "Online join link", have: online - onlineNoJoin, of: online, pct: pct(online - onlineNoJoin, online), scope: "online" },
    { key: "site", label: "Group website", have: hasWebsite, of: total, pct: pct(hasWebsite, total), scope: "all" },
    { key: "updated", label: "Source-updated timestamp", have: datedTotal, of: total, pct: pct(datedTotal, total), scope: "all" },
  ];

  // growth series from committed history
  const growth: GrowthPoint[] = (history as any[])
    .map((h) => ({
      date: String(h.generatedAt || "").slice(0, 10),
      total: Number(h.total || 0),
      inPerson: Number(h.inPerson || 0),
      online: Number(h.online || 0),
    }))
    .filter((p) => p.date);

  const daysSinceIngest = generatedAt ? Math.max(0, Math.round((Date.now() - refMs) / DAY_MS)) : 0;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rm = generatedAt.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const refDate = rm ? `${MON[Number(rm[2]) - 1]} ${Number(rm[3])}, ${rm[1]}` : "";

  const health: DataHealth = {
    generatedAt, refDate, daysSinceIngest,
    total, inPerson, placed, online, unplaceable,
    indexedFellowships: indexedCodes.size, taxonomyFellowships: FELLOWSHIPS.length,
    statesCovered: states.length,
    fellowships, families, topStates, thinStates, states, sources,
    datedTotal, fresh, aging, stale,
    fill, onlineNoJoin, growth, search,
    recommendations: [],
  };
  health.recommendations = buildRecommendations(health);
  _cache = health;
  return _cache;
}

// ── Rules-based recommendations engine ────────────────────────────────────────────────────
// Deterministic, thresholded rules over the computed metrics. Each rule that fires appends a
// recommendation with a severity so the dashboard can rank and color them. Kept transparent on
// purpose (v1) — no model, no hidden weights — so every suggestion traces to a visible number.
const T = {
  stalePct: 50,          // >this share of dated listings older than a year → re-verify
  ingestDays: 30,        // ingest older than this → schedule a refresh
  ingestDaysHigh: 90,    // …much older → serious
  joinGapPct: 10,        // online-without-link share worth flagging
  unplaceablePct: 2,     // in-person unplaceable share worth flagging
  thinState: 50,         // a covered state under this many in-person meetings is thin
  concentrationPct: 65,  // one fellowship over this share of all meetings → concentration note
};

function buildRecommendations(h: DataHealth): Recommendation[] {
  const out: Recommendation[] = [];
  const fmt = (n: number) => n.toLocaleString("en-US");

  // 1. Refresh cadence
  if (h.daysSinceIngest >= T.ingestDaysHigh) {
    out.push({ severity: "serious", title: "Data is overdue for a refresh",
      detail: `The last ingest ran ${h.daysSinceIngest} days ago. Listings drift as groups change times and venues — schedule a re-ingest and redeploy.`,
      metric: `${h.daysSinceIngest}d` });
  } else if (h.daysSinceIngest >= T.ingestDays) {
    out.push({ severity: "warning", title: "Consider a data refresh",
      detail: `It's been ${h.daysSinceIngest} days since the last ingest. A monthly cadence keeps freshness signals honest.`,
      metric: `${h.daysSinceIngest}d` });
  } else {
    out.push({ severity: "good", title: "Ingest is recent",
      detail: `Last refreshed ${h.refDate} (${h.daysSinceIngest} day${h.daysSinceIngest === 1 ? "" : "s"} ago). Freshness signals are current.`,
      metric: `${h.daysSinceIngest}d` });
  }

  // 2. Stale share among dated listings
  const stalePct = h.datedTotal ? Math.round((h.stale / h.datedTotal) * 100) : 0;
  if (stalePct >= T.stalePct) {
    out.push({ severity: "warning", title: "Most dated listings are over a year old",
      detail: `${stalePct}% of the ${fmt(h.datedTotal)} listings that carry a timestamp were last touched by their source more than 12 months ago. These are the first candidates for re-verification.`,
      metric: `${stalePct}%` });
  }

  // 3. Timestamp coverage gap by source (freshness blind spot)
  const noTs = h.sources.filter((s) => s.datedPct === 0);
  if (noTs.length) {
    const names = noTs.map((s) => `${s.label} (${fmt(s.total)})`).join(", ");
    out.push({ severity: "info", title: "A source exposes no freshness signal",
      detail: `${names} ships listings without a last-updated timestamp, so their freshness can't be measured. Where a feed offers a "last changed" field, prefer it — or set a fixed re-verify cadence for that source.`,
      metric: `${noTs.reduce((n, s) => n + s.total, 0).toLocaleString("en-US")}` });
  }

  // 4. Online meetings missing a join link
  const joinPct = h.online ? Math.round((h.onlineNoJoin / h.online) * 100) : 0;
  if (joinPct >= T.joinGapPct && h.onlineNoJoin > 0) {
    out.push({ severity: "warning", title: "Some online meetings have no join link",
      detail: `${fmt(h.onlineNoJoin)} online listings (${joinPct}%) have no conference URL. The detail page falls back to the official finder, but sourcing the link makes these directly joinable.`,
      metric: `${joinPct}%` });
  }

  // 5. In-person listings that can't be placed to a state
  const upPct = h.inPerson ? Math.round((h.unplaceable / h.inPerson) * 100) : 0;
  if (upPct >= T.unplaceablePct && h.unplaceable > 0) {
    out.push({ severity: "info", title: "Some addresses can't be placed to a state",
      detail: `${fmt(h.unplaceable)} in-person listings (${upPct}%) have an address we can't parse a US state from, so they're absent from state pages and the coverage map. A geocode/format pass would recover them.`,
      metric: `${fmt(h.unplaceable)}` });
  }

  // 6. Fellowship taxonomy coverage (seeded pages awaiting a feed)
  const missing = h.taxonomyFellowships - h.indexedFellowships;
  if (missing > 0) {
    const famGaps = h.families.filter((f) => f.indexed < f.taxonomy)
      .map((f) => `${f.group} (${f.indexed}/${f.taxonomy})`).join(", ");
    out.push({ severity: "info", title: "Most of the taxonomy has no live feed yet",
      detail: `${missing} of ${h.taxonomyFellowships} fellowships have zero indexed meetings — their pages are seeded for SEO but need a data source. Biggest gaps by family: ${famGaps}. Sourcing OA, GA, SAA or DA feeds would open whole families.`,
      metric: `${h.indexedFellowships}/${h.taxonomyFellowships}` });
  }

  // 7. Thin-coverage states
  const thin = h.states.filter((s) => s.total < T.thinState).sort((a, b) => a.total - b.total);
  if (thin.length) {
    const list = thin.slice(0, 6).map((s) => `${s.st} (${s.total})`).join(", ");
    out.push({ severity: "info", title: "Thin coverage in some states",
      detail: `${thin.length} states have fewer than ${T.thinState} in-person meetings — ${list}${thin.length > 6 ? "…" : ""}. Adding a state or regional intergroup feed would lift these fastest.`,
      metric: `${thin.length}` });
  }

  // 8. Concentration risk
  const topFel = h.fellowships[0];
  const concPct = topFel && h.total ? Math.round((topFel.total / h.total) * 100) : 0;
  if (concPct >= T.concentrationPct) {
    out.push({ severity: "info", title: "Coverage leans on one fellowship",
      detail: `${topFel.name} is ${concPct}% of all listings. That's expected given its size, but diversifying sources reduces exposure if that feed changes or breaks.`,
      metric: `${concPct}%` });
  }

  // 9. Growth signal
  if (h.growth.length >= 2) {
    const prev = h.growth[h.growth.length - 2], last = h.growth[h.growth.length - 1];
    const delta = last.total - prev.total;
    if (delta > 0) out.push({ severity: "good", title: "Coverage is growing",
      detail: `Up ${fmt(delta)} listings since the previous ingest (${prev.date} → ${last.date}). Trend is positive.`, metric: `+${fmt(delta)}` });
    else if (delta < 0) out.push({ severity: "warning", title: "Coverage dropped since last ingest",
      detail: `Down ${fmt(Math.abs(delta))} listings vs. the previous ingest (${prev.date} → ${last.date}). Check whether a source went dark or got IP-blocked from the runner.`, metric: `${fmt(delta)}` });
  } else {
    out.push({ severity: "info", title: "Growth baseline established",
      detail: `This is the first recorded ingest snapshot. After the next refresh, /studio will chart growth by total, split, and fellowship.`, metric: "1 pt" });
  }

  // 10. Search Console demand signals (only when connected)
  if (h.search.connected) {
    const opp = h.search.opportunities[0];
    if (opp) out.push({ severity: "warning", title: "High-impression pages ranking low",
      detail: `${opp.page} is drawing ${fmt(opp.impressions)} impressions at position ${opp.position.toFixed(1)} with a ${(opp.ctr * 100).toFixed(1)}% CTR — real demand, weak placement. Strengthen the page's title, intro and internal links.`,
      metric: `#${opp.position.toFixed(0)}` });
  } else {
    out.push({ severity: "info", title: "Connect Search Console for demand signals",
      detail: `The engine can't yet see what people search for or where pages rank. Wire up a Search Console export (src/lib/search-console.json) to turn coverage gaps into demand-ranked priorities — e.g. a seeded page already pulling impressions jumps the queue.`,
      metric: "GSC" });
  }

  const rank: Record<Severity, number> = { serious: 0, warning: 1, info: 2, good: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
