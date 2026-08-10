// Server-only: builds city groupings from the ingested meetings for the SEO landing
// pages under /meetings/[slug]. Reads public/data/meetings.json at build time (the same
// file the indexer uses), parses "City, ST" out of each address, and groups. Memoized.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fellowshipName } from "./fellowships";

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "),
);
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "Washington, D.C.",
};

// Only build pages for cities with at least this many meetings (avoids thin/low-value pages).
export const CITY_MIN_MEETINGS = 8;
// Cap meetings rendered PER DAY so every day of the week is represented and page weight
// stays bounded; big cities link to live search for the rest.
export const CITY_MAX_PER_DAY = 40;

export type CityMeeting = {
  id: string; name: string; fellowship: string; day: number; time: string;
  place: string; address: string;
};
export type City = {
  slug: string; city: string; state: string; stateName: string;
  count: number; fellowships: string[]; meetings: CityMeeting[];
};

const slugify = (city: string, state: string) =>
  `${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Pull "City, ST" from a formatted address like "123 Main St, Melbourne, FL 32903, USA".
function parseCityState(address: string): { city: string; state: string } | null {
  if (!address) return null;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const st = parts[i].match(/^([A-Z]{2})\b/);
    if (st && US_STATES.has(st[1])) {
      const city = parts[i - 1];
      if (city && /[A-Za-z]/.test(city) && city.length <= 40) {
        return { city: city.replace(/\s+/g, " "), state: st[1] };
      }
    }
  }
  return null;
}

let _cache: Map<string, City> | null = null;

async function build(): Promise<Map<string, City>> {
  if (_cache) return _cache;
  let raw: any[] = [];
  try {
    const file = path.join(process.cwd(), "public", "data", "meetings.json");
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch { raw = []; }

  const map = new Map<string, City>();
  for (const m of raw) {
    if (m.online || !m.address) continue;
    const cs = parseCityState(String(m.address));
    if (!cs) continue;
    const slug = slugify(cs.city, cs.state);
    if (!slug) continue;
    let c = map.get(slug);
    if (!c) {
      c = { slug, city: cs.city, state: cs.state, stateName: STATE_NAMES[cs.state] || cs.state, count: 0, fellowships: [], meetings: [] };
      map.set(slug, c);
    }
    c.count++;
    if (!c.fellowships.includes(m.fellowship)) c.fellowships.push(m.fellowship);
    c.meetings.push({
      id: String(m.id ?? `${slug}-${c.meetings.length}`), name: m.name || "Meeting",
      fellowship: m.fellowship, day: m.day, time: m.time, place: m.place || "", address: m.address,
    });
  }
  // Sort each city's meetings chronologically; sort fellowships by frequency-ish (AA first).
  for (const c of map.values()) {
    c.meetings.sort((a, b) => (a.day - b.day) || String(a.time).localeCompare(String(b.time)));
    c.fellowships.sort((a, b) => (a === "AA" ? -1 : b === "AA" ? 1 : a.localeCompare(b)));
  }
  _cache = map;
  return map;
}

export async function getCities(): Promise<City[]> {
  const map = await build();
  return [...map.values()]
    .filter((c) => c.count >= CITY_MIN_MEETINGS)
    .sort((a, b) => a.stateName.localeCompare(b.stateName) || b.count - a.count || a.city.localeCompare(b.city));
}

export async function getCity(slug: string): Promise<City | null> {
  const map = await build();
  const c = map.get(slug);
  return c && c.count >= CITY_MIN_MEETINGS ? c : null;
}

export const fellowshipLabel = (code: string) => fellowshipName(code);
export { STATE_NAMES };
