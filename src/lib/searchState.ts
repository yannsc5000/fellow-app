// Canonical parse/serialize for the live-search (`/search`) filter state — the single contract that
// both the server route (for its SSR message-match header + canonical) and the client Finder (for
// seeding + writing the URL) share. Kept PURE and dependency-free (no `@/` imports, no `window`) so
// it can be unit-tested in isolation and run on server or client.
//
// URL shape (pretty paths for the two "intent" dimensions, query for the toggles):
//   /search                                  → near-you, unfiltered
//   /search/austin-tx                        → a city (or a ZIP: /search/78701)
//   /search/austin-tx/aa                     → city + fellowship
//   /search/austin-tx/aa?when=today&format=online&type=open&access=wheelchair&time=evening&view=list
//
// SearchState holds RAW url tokens (lowercased slugs / zips); consumers resolve them to app types
// (a canonical fellowship code, geocoded coordinates, day numbers, …). That keeps this file pure and
// avoids importing the fellowship/city data here.

export type Format = "online" | "in-person";
export type MeetingType = "open" | "closed";
export type Access = "wheelchair";
export type TimeOfDay = "morning" | "midday" | "afternoon" | "evening";
export type View = "calendar" | "list" | "map";
// `when` tokens: relative days + explicit weekdays. OR-combined (multiple allowed).
export type When = "today" | "tonight" | "tomorrow" | "soon" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type SearchState = {
  near: string | null;        // city slug ("austin-tx") or 5-digit ZIP ("78701")
  fellowship: string | null;  // fellowship URL slug, lowercased ("aa", "al-anon"); consumer → canonical code
  when: When[];
  format: Format | null;
  types: MeetingType[];
  access: Access[];
  time: TimeOfDay | null;
  q: string | null;
  view: View | null;
};

export const EMPTY_STATE: SearchState = {
  near: null, fellowship: null, when: [], format: null, types: [], access: [], time: null, q: null, view: null,
};

const WHEN = new Set<When>(["today", "tonight", "tomorrow", "soon", "sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
const FORMATS = new Set<Format>(["online", "in-person"]);
const TYPES = new Set<MeetingType>(["open", "closed"]);
const TIMES = new Set<TimeOfDay>(["morning", "midday", "afternoon", "evening"]);
const VIEWS = new Set<View>(["calendar", "list", "map"]);

const isZip = (s: string) => /^\d{5}$/.test(s);
// A plausible location slug: lowercase word(s) ending in a 2-letter state ("austin-tx",
// "st-louis-mo"), OR a bare ZIP. Anything else in the location slot is ignored (→ near-you).
const isLocationSlug = (s: string) => isZip(s) || /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z]{2}$/.test(s);
const clean = (s: string | null | undefined) => (s ? s.trim().toLowerCase() : "");
const splitMulti = (v: string | null): string[] =>
  (v ? v.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) : []);

// Locale segments to strip from the front of the pathname (next-intl `localePrefix: "as-needed"`,
// so only "es" appears; "en" is defensive).
const LOCALES = new Set(["es", "en"]);

/** Parse a `/search…` pathname + query string into the canonical SearchState. Order-agnostic on
 *  query; ignores unknown values and tracking params (utm_*, gclid, …). */
export function parseSearchState(pathname: string, search: string): SearchState {
  const segs = (pathname || "").split("/").filter(Boolean);
  if (segs.length && LOCALES.has(segs[0])) segs.shift();
  if (segs.length && segs[0] === "search") segs.shift();
  // Fixed positions: [location, fellowship]. Location must look like a slug/ZIP or it's dropped.
  let near: string | null = null;
  let fellowship: string | null = null;
  if (segs[0]) { const s = clean(segs[0]); if (isLocationSlug(s)) near = s; }
  if (segs[1]) fellowship = clean(segs[1]) || null;

  const qs = new URLSearchParams(search || "");
  // Query fallbacks for the path dimensions (so `/search?near=…&fellowship=…` also works).
  if (!near) { const n = clean(qs.get("near")); if (n && isLocationSlug(n)) near = n; }
  if (!fellowship) { const f = clean(qs.get("fellowship")); if (f) fellowship = f; }

  const when = [...new Set(splitMulti(qs.get("when")))].filter((w): w is When => WHEN.has(w as When));
  const fmt = clean(qs.get("format"));
  const format = FORMATS.has(fmt as Format) ? (fmt as Format) : null;
  const types = [...new Set(splitMulti(qs.get("type")))].filter((t): t is MeetingType => TYPES.has(t as MeetingType));
  const access = clean(qs.get("access")) === "wheelchair" ? (["wheelchair"] as Access[]) : [];
  const tm = clean(qs.get("time"));
  const time = TIMES.has(tm as TimeOfDay) ? (tm as TimeOfDay) : null;
  const vw = clean(qs.get("view"));
  const view = VIEWS.has(vw as View) ? (vw as View) : null;
  const qraw = (qs.get("q") || "").trim();
  const q = qraw || null;

  return { near, fellowship, when, format, types, access, time, q, view };
}

/** Serialize a SearchState back to a `/search…` URL. `localePrefix` (e.g. "/es") is prepended when
 *  present. Location + fellowship become path segments (fellowship only when a location is present);
 *  everything else is a query param, emitted in a stable order for clean, canonical URLs. */
export function buildSearchPath(s: SearchState, localePrefix = ""): string {
  let path = `${localePrefix}/search`;
  if (s.near) {
    path += `/${s.near}`;
    if (s.fellowship) path += `/${s.fellowship}`;
  }
  const qs = new URLSearchParams();
  // A fellowship with no location can't sit in the path → carry it in the query.
  if (s.fellowship && !s.near) qs.set("fellowship", s.fellowship);
  if (s.when.length) qs.set("when", [...s.when].sort().join(","));
  if (s.format) qs.set("format", s.format);
  if (s.types.length) qs.set("type", [...s.types].sort().join(","));
  if (s.access.length) qs.set("access", "wheelchair");
  if (s.time) qs.set("time", s.time);
  if (s.view) qs.set("view", s.view);
  if (s.q) qs.set("q", s.q);
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}

/** True when no filter is set (near-you, unfiltered) — used to decide noindex/canonical + headers. */
export function isEmptyState(s: SearchState): boolean {
  return !s.near && !s.fellowship && !s.when.length && !s.format && !s.types.length &&
    !s.access.length && !s.time && !s.q;
}
