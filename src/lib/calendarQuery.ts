// Per-band week loader for the calendar view.
//
// A per-DAY query (sorted by time, capped at Typesense's 250/page) breaks down in dense sets: the
// earliest 250 meetings are all overnight/morning, so Midday/Evening/Late never get any rows. So we
// query per (day × day-part BAND) instead — one search per cell — filtering by the band's minute
// range. Each cell returns its own first few rows plus an exact `found` count (used both for the
// "+N more" affordance and the day-part density sparkline). All cells ride in a single
// `multi_search`. The active list filters (fellowship / online / types / geo / free-text / time-of-
// day window) come in as a prebuilt `filterBy`; which days to load is expressed by `days`.
import { COLLECTION } from "@/lib/schema";

// Same fields the InstantSearch adapter searches — keep in sync with `query_by` in typesense.ts.
export const CAL_QUERY_BY =
  "name,place,address,notes,fellowship,fellowship_name,fellowship_terms,types";

// Day-part bands. Single source of truth shared with the calendar UI so the per-band queries and the
// rendered rows never drift. A "day" runs 4:00am → 3:59am next-day (nobody thinks of 1am as the start
// of the day), so the three normal bands are simple minute ranges [lo, hi) and the Late-night band is
// CROSS-DAY: this day's 9pm–midnight PLUS the *next* day's midnight–3:59am, the latter tagged in the
// UI with the next date.
export type CalBand = { label: string; lo?: number; hi?: number; lateNight?: boolean };
export const CAL_BANDS: CalBand[] = [
  { label: "Morning", lo: 240, hi: 720 },   // 4:00a – 11:59a
  { label: "Midday", lo: 720, hi: 1020 },   // 12:00p – 4:59p
  { label: "Evening", lo: 1020, hi: 1260 }, // 5:00p – 8:59p
  { label: "Late night", lateNight: true }, // 9:00p – 3:59a (spills into the next calendar day)
];

const ROWS_PER_CELL = 5; // meetings shown per cell before "+N more"

const HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost";
const PORT = process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108";
const PROTOCOL = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http";
const KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "devkey";

export type CalCell = { hits: any[]; found: number };
export type CalWeekResult = {
  cells: Record<number, CalCell[]>;   // [day 0..6] → [Morning, Midday, Evening, Late]
  spark: Record<number, number[]>;    // [day] → the 4 band totals (day-part density)
};

const emptyCell = (): CalCell => ({ hits: [], found: 0 });

export async function fetchCalendarWeek(
  { q, filterBy, days = [0, 1, 2, 3, 4, 5, 6] }: { q?: string; filterBy?: string; days?: number[] },
  signal?: AbortSignal,
): Promise<CalWeekResult> {
  const text = q && q.trim() ? q.trim() : "*"; // "*" = match-all when there's no free-text query
  // Each cell is one search — EXCEPT the cross-day Late-night band, which is two: the evening part
  // (this day, 9pm–midnight) and the overnight part (the NEXT day, midnight–3:59am). Both use the same
  // proven `day:= && minutes-range && filters` shape as every other cell; they're combined evening-
  // first below so the per_page cap never hides the 9–11pm rows behind the overnight ones.
  const jobs: { d: number; b: number; part: "main" | "eve" | "owl" }[] = [];
  const searches: any[] = [];
  const addSearch = (d: number, b: number, part: "main" | "eve" | "owl", parts: (string | undefined)[]) => {
    jobs.push({ d, b, part });
    searches.push({
      collection: COLLECTION,
      q: text,
      query_by: CAL_QUERY_BY,
      filter_by: parts.filter(Boolean).join(" && "),
      sort_by: "minutes:asc",
      per_page: ROWS_PER_CELL,
      drop_tokens_threshold: 0,
    });
  };
  for (const d of days) {
    for (let b = 0; b < CAL_BANDS.length; b++) {
      const band = CAL_BANDS[b];
      if (band.lateNight) {
        addSearch(d, b, "eve", [`day:=${d}`, `minutes:>=1260`, `minutes:<1440`, filterBy]);
        addSearch(d, b, "owl", [`day:=${(d + 1) % 7}`, `minutes:>=0`, `minutes:<240`, filterBy]);
      } else {
        addSearch(d, b, "main", [`day:=${d}`, `minutes:>=${band.lo}`, `minutes:<${band.hi}`, filterBy]);
      }
    }
  }

  const url = `${PROTOCOL}://${HOST}:${PORT}/multi_search`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "X-TYPESENSE-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ searches }),
    signal,
  });
  if (!r.ok) throw new Error(`Typesense ${r.status}`);
  const data = await r.json();

  const cells: Record<number, CalCell[]> = {};
  for (const d of days) cells[d] = CAL_BANDS.map(emptyCell);

  const results: any[] = data.results || [];
  results.forEach((res, i) => {
    const job = jobs[i];
    if (!job) return;
    const { d, b, part } = job;
    const found = typeof res.found === "number" ? res.found : (res.hits?.length || 0);
    // Raw Typesense docs carry `id`; the UI keys/shares on `objectID` (the adapter's alias) — map it.
    // Overnight ("owl") rows are the small hours of the *next* calendar day — flag them so the row can
    // render a next-date tag (their own `day` field already IS that next date).
    const hits = (res.hits || []).map((h: any) => ({
      ...h.document,
      objectID: h.document?.id,
      ...(part === "owl" ? { _nextDay: true } : null),
    }));
    const cell = cells[d][b];
    if (part === "owl") {
      // Evening part was pushed (and processed) first, so append overnight after it.
      cell.hits = [...cell.hits, ...hits].slice(0, ROWS_PER_CELL);
      cell.found += found;
    } else {
      cell.hits = hits;
      cell.found = found;
    }
  });

  // Sparkline = the day's four band totals (accurate density-by-day-part, no extra query).
  const spark: Record<number, number[]> = {};
  for (const d of days) spark[d] = cells[d].map((c) => c.found);
  return { cells, spark };
}
