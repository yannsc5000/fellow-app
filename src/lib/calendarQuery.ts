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

// Day-part bands (minutes since midnight, half-open [lo, hi)). Single source of truth shared with the
// calendar UI so the per-band queries and the rendered rows never drift.
export const CAL_BANDS: [string, number, number][] = [
  ["Morning", 0, 720], ["Midday", 720, 1020], ["Evening", 1020, 1260], ["Late", 1260, 1440],
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
  const jobs: { d: number; b: number }[] = [];
  const searches: any[] = [];
  for (const d of days) {
    for (let b = 0; b < CAL_BANDS.length; b++) {
      const [, lo, hi] = CAL_BANDS[b];
      jobs.push({ d, b });
      searches.push({
        collection: COLLECTION,
        q: text,
        query_by: CAL_QUERY_BY,
        filter_by: [`day:=${d}`, `minutes:>=${lo}`, `minutes:<${hi}`, filterBy].filter(Boolean).join(" && "),
        sort_by: "minutes:asc",
        per_page: ROWS_PER_CELL,
        drop_tokens_threshold: 0,
      });
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
    const { d, b } = job;
    // Raw Typesense docs carry `id`; the UI keys/shares on `objectID` (the adapter's alias) — map it.
    cells[d][b] = {
      hits: (res.hits || []).map((h: any) => ({ ...h.document, objectID: h.document?.id })),
      found: typeof res.found === "number" ? res.found : (res.hits?.length || 0),
    };
  });

  // Sparkline = the day's four band totals (accurate density-by-day-part, no extra query).
  const spark: Record<number, number[]> = {};
  for (const d of days) spark[d] = cells[d].map((c) => c.found);
  return { cells, spark };
}
