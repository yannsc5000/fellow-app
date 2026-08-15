// Day-balanced week loader for the calendar view.
//
// The InstantSearch/list path sorts globally by `day:asc,time:asc` and Typesense caps any single
// result page at 250 hits. In a dense metro (e.g. ~1,300 meetings within 50mi) the first 250 are
// entirely Sunday + Monday, so Tue–Sat never arrive and the week looks empty. This loader instead
// issues ONE `multi_search` with a separate per-day search (day 0..6), each sorted by time and
// capped independently — so every day gets its own full slate plus an exact `found` count. It honors
// the same active filters as the list (fellowship / online / types / geo / free-text) by taking a
// prebuilt `filterBy` string; day selection is expressed by which days we query.
import { COLLECTION } from "@/lib/schema";

// Same fields the InstantSearch adapter searches — keep in sync with `query_by` in typesense.ts.
export const CAL_QUERY_BY =
  "name,place,address,notes,fellowship,fellowship_name,fellowship_terms,types";

const HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost";
const PORT = process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108";
const PROTOCOL = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http";
const KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "devkey";

export type CalWeekResult = {
  byDay: Record<number, any[]>;      // day-of-week (0=Sun..6=Sat) → meeting docs, time-ascending
  foundByDay: Record<number, number>; // exact total meetings that day (may exceed the fetched slice)
};

const emptyByDay = (): Record<number, any[]> => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
const emptyCount = (): Record<number, number> => ({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });

export async function fetchCalendarWeek(
  { q, filterBy, days = [0, 1, 2, 3, 4, 5, 6], perDay = 250 }:
    { q?: string; filterBy?: string; days?: number[]; perDay?: number },
  signal?: AbortSignal,
): Promise<CalWeekResult> {
  const text = q && q.trim() ? q.trim() : "*"; // "*" = match-all when there's no free-text query
  const searches = days.map((d) => ({
    collection: COLLECTION,
    q: text,
    query_by: CAL_QUERY_BY,
    filter_by: [`day:=${d}`, filterBy].filter(Boolean).join(" && "),
    sort_by: "time:asc",
    per_page: perDay,
    drop_tokens_threshold: 0,
  }));

  const url = `${PROTOCOL}://${HOST}:${PORT}/multi_search`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "X-TYPESENSE-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ searches }),
    signal,
  });
  if (!r.ok) throw new Error(`Typesense ${r.status}`);
  const data = await r.json();

  const byDay = emptyByDay();
  const foundByDay = emptyCount();
  const results: any[] = data.results || [];
  results.forEach((res, i) => {
    const day = days[i];
    if (day == null) return;
    // Raw Typesense docs carry `id`; the UI keys/shares on `objectID` (the adapter's alias) — map it.
    byDay[day] = (res.hits || []).map((h: any) => ({ ...h.document, objectID: h.document?.id }));
    foundByDay[day] = typeof res.found === "number" ? res.found : byDay[day].length;
  });
  return { byDay, foundByDay };
}
