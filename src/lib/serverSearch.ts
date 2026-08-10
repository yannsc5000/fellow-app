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
};

export async function searchMeetings(p: SearchParams): Promise<MeetingResult[]> {
  const filters: string[] = [];
  if (Number.isInteger(p.day)) filters.push(`day:=${p.day}`);
  if (typeof p.online === "boolean") filters.push(`online:=${p.online}`);
  if (p.fellowship) filters.push(`fellowship:=${p.fellowship}`);
  const geo = p.near_lat != null && p.near_lng != null;
  if (geo) {
    const km = ((p.radius_miles ?? 40) * 1.60934).toFixed(1);
    filters.push(`_geoloc:(${p.near_lat}, ${p.near_lng}, ${km} km)`);
  }
  const searchParams: any = {
    q: p.query?.trim() || "*",
    query_by: "name,place,address,notes,fellowship,fellowship_name,fellowship_terms,types",
    filter_by: filters.join(" && "),
    sort_by: geo ? `_geoloc(${p.near_lat}, ${p.near_lng}):asc` : "day:asc,time:asc",
    per_page: Math.min(Math.max(p.limit ?? 10, 1), 30),
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
  return hits.map((m) => ({
    id: String(m.id ?? m.objectID ?? ""), name: m.name, fellowship: m.fellowship,
    day: m.day, time: m.time, place: m.place || "", address: m.address || "",
    online: !!m.online, lat: m.lat ?? null, lng: m.lng ?? null,
  }));
}
