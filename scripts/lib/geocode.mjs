// Geocoding — fill missing lat/lng for US meetings using the free U.S. Census
// geocoder (no API key, US-only, ideal for a national US MVP). For big batches
// use the Census batch endpoint (CSV, up to 10k/req); this does one-by-one with
// a small concurrency cap, fine for filling gaps after ingest.
const CENSUS = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

export async function geocode(address) {
  const url = `${CENSUS}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const m = j.result?.addressMatches?.[0];
    return m ? { lat: m.coordinates.y, lng: m.coordinates.x } : null;
  } catch { return null; }
}

// Fill coords for in-person meetings missing lat/lng. Mutates in place.
export async function geocodeMissing(meetings, { concurrency = 5 } = {}) {
  const todo = meetings.filter((m) => !m.online && (m.lat == null || m.lng == null) && m.address);
  let filled = 0, i = 0;
  async function worker() {
    while (i < todo.length) {
      const m = todo[i++];
      const c = await geocode(m.address);
      if (c) { m.lat = c.lat; m.lng = c.lng; filled++; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { attempted: todo.length, filled };
}
