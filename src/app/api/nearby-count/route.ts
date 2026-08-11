// Lightweight count endpoint for the chat welcome: "There are N meetings near you today."
// Returns just a number (Typesense `found`) for meetings within ~40mi of lat/lng, optionally
// filtered to a weekday. No documents, no personal data stored — only the coordinates the
// client already has are used, and only to count. Never returns meeting details.
import { countMeetings } from "@/lib/serverSearch";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ count: null });
  }
  const p: { near_lat: number; near_lng: number; radius_miles: number; day?: number; lo?: number; hi?: number } = {
    near_lat: lat, near_lng: lng, radius_miles: 40,
  };
  const dayRaw = searchParams.get("day");
  if (dayRaw != null && dayRaw !== "") {
    const d = Number(dayRaw);
    if (Number.isInteger(d) && d >= 0 && d <= 6) p.day = d;
  }
  // Time-of-day window (minutes since midnight) so the welcome can say "tonight" specifically.
  const WINDOWS: Record<string, [number, number]> = {
    morning: [300, 719], afternoon: [720, 1019], tonight: [1020, 1439],
  };
  const w = WINDOWS[searchParams.get("window") || ""];
  if (w) { p.lo = w[0]; p.hi = w[1]; }
  const count = await countMeetings(p);
  return Response.json({ count }, { headers: { "Cache-Control": "public, max-age=300" } });
}
