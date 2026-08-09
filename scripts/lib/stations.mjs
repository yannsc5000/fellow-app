// Aggregated rail-station data used to enrich each in-person meeting with its nearest
// station (name, distance, official line colors). Combines the always-bundled DC set
// (wmata-stations.js) with any generated per-city files in ./stations/*.json.
//
// Generate the per-city files once, on a networked machine, with:
//   node scripts/build-stations.mjs
// then commit scripts/lib/stations/*.json. Until you do, only DC is populated and
// every other city falls back to a generic "find transit on Maps" link.
import { readFileSync, readdirSync } from "node:fs";
import { STATIONS as WMATA } from "./wmata-stations.js";

// Uniform shape: { sys, name, lat, lng, lines (text), colors (hex[]), k }
// DC line names → official hex, so DC icons match the GTFS-derived systems.
const WMATA_HEX = { red: "#e01933", orange: "#f7941d", blue: "#0076c0", silver: "#9aa0a6", green: "#00a94f", yellow: "#ffd200" };
const wmataUniform = WMATA.map((s) => ({
  sys: "wmata", name: s.name, lat: s.lat, lng: s.lng, lines: s.lines, k: "metro",
  colors: String(s.lines || "").split(/[/,&+]/).map((x) => WMATA_HEX[x.trim().toLowerCase()]).filter(Boolean),
}));

function loadGenerated() {
  const out = [];
  const dirUrl = new URL("./stations/", import.meta.url);
  let files = [];
  try { files = readdirSync(dirUrl); } catch { return out; }
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const sys = f.replace(/\.json$/, "");
    try {
      const arr = JSON.parse(readFileSync(new URL(f, dirUrl), "utf8"));
      for (const s of arr) {
        if (typeof s.lat !== "number" || typeof s.lng !== "number") continue;
        out.push({
          sys, name: s.name, lat: s.lat, lng: s.lng,
          lines: Array.isArray(s.routes) ? s.routes.join("/") : (s.lines || ""),
          colors: Array.isArray(s.colors) ? s.colors : [],
          k: s.k || "metro",
        });
      }
    } catch { /* skip a malformed file rather than crash the ingest */ }
  }
  return out;
}

export const ALL_STATIONS = [...wmataUniform, ...loadGenerated()];
export const STATION_SYSTEMS = [...new Set(ALL_STATIONS.map((s) => s.sys))];
