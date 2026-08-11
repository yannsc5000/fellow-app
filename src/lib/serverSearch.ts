// Server-side Typesense search used by the chatbot's `search_meetings` tool.
// Runs in the /api/chat route (Node runtime) — never in the browser.
import Typesense from "typesense";
import { COLLECTION } from "./schema";

const client = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || process.env.TYPESENSE_HOST || "localhost",
    port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT || process.env.TYPESENSE_PORT || 8108),
    protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || process.env.TYPESENSE_PROTOCOL || "http",
  }],
  apiKey: process.env.TYPESENSE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "devkey",
  connectionTimeoutSeconds: 6,
});

const TIME_WINDOWS: Record<string, { lo: number; hi: number }> = {
  morning: { lo: 300, hi: 719 }, noon: { lo: 690, hi: 810 }, afternoon: { lo: 720, hi: 1019 },
  evening: { lo: 1020, hi: 1259 }, night: { lo: 1080, hi: 1439 },
};

export type SearchParams = {
  query?: string; fellowship?: string; day?: number; time_of_day?: string;
  online?: boolean; near_lat?: number; near_lng?: number; radius_miles?: number; limit?: number;
};
export type MeetingResult = {
  id: string; name: string; fellowship: string; day: number; time: string;
  place: string; address: string; online: boolean; lat: number | null; lng: number | null;
  conference_url?: string; conference_phone?: string; website?: string; updated?: string; end?: string;
  types?: string[]; notes?: string; transit_json?: string; parking_json?: string;
};

export async function searchMeetings(p: SearchParams): Promise<MeetingResult[]> {
  const filters: string[] = [];
  if (Number.isInteger(p.day)) filters.push(`day:=${p.day}`);
  if (typeof p.online === "boolean") filters.push(`online:=${p.online}`);
  if (p.fellowship) filters.push(`fellowship:=${p.fellowship}`);
  // Online meetings carry no coordinates (_geoloc is unset), so a geo filter/sort would exclude
  // every one of them. When the search is online-only, drop the geo constraint entirely — this is
  // what makes the "always try online first" widening actually return results.
  const geo = p.near_lat != null && p.near_lng != null && p.online !== true;
  if (geo) {
    const km = ((p.radius_miles ?? 40) * 1.60934).toFixed(1);
    filters.push(`_geoloc:(${p.near_lat}, ${p.near_lng}, ${km} km)`);
  }
  // Sort priority: text relevance first when the user named something (a city, ZIP, or group), so
  // an exact match never sits below a weak one. Then nearest (for "near me") or time-of-day. We
  // deliberately avoid absolute day:asc as the lead key — it buries today's meetings behind
  // Sunday's; the client regroups by day-from-today over the fuller set we return here.
  const hasQuery = !!(p.query && p.query.trim());
  const geoSort = `_geoloc(${p.near_lat}, ${p.near_lng}):asc`;
  const sort_by = hasQuery
    ? (geo ? `_text_match:desc,${geoSort}` : "_text_match:desc,time:asc")
    : (geo ? geoSort : "day:asc,time:asc");
  const searchParams: any = {
    q: p.query?.trim() || "*",
    query_by: "name,place,address,notes,fellowship,fellowship_name,fellowship_terms,types",
    filter_by: filters.join(" && "),
    sort_by,
    // Fetch a fuller set than we display so the client's day-from-today grouping has every day to
    // work with (a small page sorted by day would truncate today's meetings away server-side).
    per_page: Math.min(Math.max(p.limit ?? 10, 20), 40),
    // Require all query tokens to match — never drop a token. Otherwise "San Francisco"
    // with thin SF coverage would drop "Francisco" and return "San Antonio"/"San Diego".
    drop_tokens_threshold: 0,
  };
  let hits: any[];
  try {
    const res: any = await client.collections(COLLECTION).documents().search(searchParams);
    hits = (res.hits || []).map((h: any) => h.document);
  } catch {
    return [];
  }
  const win = p.time_of_day ? TIME_WINDOWS[p.time_of_day.toLowerCase()] : null;
  if (win) {
    hits = hits.filter((m) => {
      const [h, mm] = String(m.time).split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(mm)) return false;
      const mins = h * 60 + mm;
      return mins >= win.lo && mins <= win.hi;
    });
  }
  return hits.map(toResult);
}

// Normalize a raw Typesense document into the MeetingResult shape the UI uses.
function toResult(m: any): MeetingResult {
  return {
    id: String(m.id ?? m.objectID ?? ""), name: m.name, fellowship: m.fellowship,
    day: m.day, time: m.time, place: m.place || "", address: m.address || "",
    online: !!m.online, lat: m.lat ?? null, lng: m.lng ?? null,
    conference_url: m.conference_url || "", conference_phone: m.conference_phone || "",
    website: m.website || "", updated: m.updated || "", end: m.end || "",
    types: m.types || [], notes: m.notes || "",
    transit_json: m.transit_json || "", parking_json: m.parking_json || "",
  };
}

// Fetch a single meeting by its index id — powers the shared-meeting page (/m?id=…) so a shared
// link opens the full meeting detail (map, website, notes) rather than a stub. null if not found.
export async function getMeetingById(id: string): Promise<MeetingResult | null> {
  if (!id) return null;
  try {
    const doc: any = await client.collections(COLLECTION).documents(String(id)).retrieve();
    return doc ? toResult(doc) : null;
  } catch {
    return null;
  }
}

// How many meetings are near the user in a given time-of-day window (used by the chat welcome:
// "N meetings near you tonight"). Without lo/hi it's a pure Typesense `found` count (no docs).
// With a window, it pulls the nearest matches (time field only — a tiny payload) and counts
// those inside [lo,hi] minutes, so the number is specific to "this morning" / "tonight". 0 on error.
export async function countMeetings(
  p: SearchParams & { lo?: number; hi?: number },
): Promise<number> {
  const filters: string[] = [];
  if (Number.isInteger(p.day)) filters.push(`day:=${p.day}`);
  if (typeof p.online === "boolean") filters.push(`online:=${p.online}`);
  if (p.fellowship) filters.push(`fellowship:=${p.fellowship}`);
  const geo = p.near_lat != null && p.near_lng != null;
  if (geo) {
    const km = ((p.radius_miles ?? 40) * 1.60934).toFixed(1);
    filters.push(`_geoloc:(${p.near_lat}, ${p.near_lng}, ${km} km)`);
  }
  const hasWindow = typeof p.lo === "number" && typeof p.hi === "number";
  try {
    const res: any = await client.collections(COLLECTION).documents().search({
      q: "*", query_by: "name", filter_by: filters.join(" && "),
      per_page: hasWindow ? 250 : 1,
      ...(hasWindow ? { include_fields: "time", sort_by: geo ? `_geoloc(${p.near_lat}, ${p.near_lng}):asc` : "time:asc" } : {}),
    });
    if (!hasWindow) return Number(res.found || 0);
    let n = 0;
    for (const h of res.hits || []) {
      const [hh, mm] = String(h.document?.time || "").split(":").map(Number);
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue;
      const mins = hh * 60 + mm;
      if (mins >= p.lo! && mins <= p.hi!) n++;
    }
    return n;
  } catch {
    return 0;
  }
}
