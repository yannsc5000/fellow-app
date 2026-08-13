// Builds the URL for a single meeting's detail sheet (the /m page — "the MeetingSheet as its own
// URL"). Directory pages (city, city/all, fellowship×city, fellowship/all) link their meeting rows
// here so a tap opens that meeting's sheet, not a fresh search. Param shape matches what /m reads
// (see Finder.tsx share() and m/page.tsx paramsMeeting): id + a best-effort fallback payload so the
// sheet renders even before the live lookup resolves.
export function meetingSheetHref(m: {
  id?: string; objectID?: string; name?: string; fellowship?: string;
  day?: number; time?: string; place?: string; address?: string; online?: boolean;
}): string {
  const qp = new URLSearchParams({
    id: String(m.id || m.objectID || ""),
    n: m.name || "",
    f: m.fellowship || "",
    d: String(m.day ?? ""),
    t: m.time || "",
    p: m.place || "",
    a: m.address || "",
    o: m.online ? "1" : "0",
  });
  return `/m?${qp.toString()}`;
}
