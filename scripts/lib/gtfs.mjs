// GTFS enrichment — derive each meeting's nearest rail stop and its official
// line color(s) straight from a transit agency's GTFS feed (routes.txt has
// route_color). Pure functions + a small loader; unit-testable, no network.
//
// This is the scalable path for line colors + accurate nearest-transit: point it
// at any US agency's GTFS (nearly all publish one) and it "just works".
import { readFile } from "node:fs/promises";
import { haversineMi } from "./normalize.mjs";

// Minimal RFC4180-ish CSV parser (handles quotes + embedded commas/newlines).
export function parseCSV(text) {
  const rows = []; let row = [], field = "", i = 0, q = false;
  const pushF = () => { row.push(field); field = ""; };
  const pushR = () => { rows.push(row); row = []; };
  text = text.replace(/^﻿/, "");
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") pushF();
    else if (c === "\n") { pushF(); pushR(); }
    else if (c === "\r") { /* skip */ }
    else field += c;
    i++;
  }
  if (field.length || row.length) { pushF(); pushR(); }
  const header = rows.shift() || [];
  return rows.filter(r => r.length && r.some(x => x !== "")).map(r =>
    Object.fromEntries(header.map((h, j) => [h.trim(), (r[j] ?? "").trim()]))
  );
}

// route_type values that are rail/tram (colored lines people ride to a meeting)
const RAIL_TYPES = { "0": "tram", "1": "metro", "2": "train", "5": "tram", "7": "tram", "12": "metro" };
const hex = (c) => (c && /^[0-9a-fA-F]{6}$/.test(c) ? `#${c.toLowerCase()}` : null);

// Build an index: nearestRail(lat,lng) -> { stopName, lat, lng, colors[], routes[], k }
export function buildIndex({ stops, routes, trips, stopTimes }) {
  const routeById = new Map();
  for (const r of routes) {
    const k = RAIL_TYPES[r.route_type];
    if (!k) continue;
    routeById.set(r.route_id, {
      k, color: hex(r.route_color),
      name: r.route_short_name || r.route_long_name || r.route_id,
    });
  }
  const routeOfTrip = new Map();
  for (const t of trips) if (routeById.has(t.route_id)) routeOfTrip.set(t.trip_id, t.route_id);

  const stopRoutes = new Map(); // stop_id -> Set(route_id)
  for (const st of stopTimes) {
    const rid = routeOfTrip.get(st.trip_id);
    if (!rid) continue;
    if (!stopRoutes.has(st.stop_id)) stopRoutes.set(st.stop_id, new Set());
    stopRoutes.get(st.stop_id).add(rid);
  }

  const stopById = new Map(stops.map(s => [s.stop_id, s]));
  // rail stops only
  const railStops = [...stopRoutes.keys()].map(id => stopById.get(id)).filter(Boolean);

  return {
    nearestRail(lat, lng) {
      let best = null;
      for (const s of railStops) {
        const slat = parseFloat(s.stop_lat), slng = parseFloat(s.stop_lon);
        if (Number.isNaN(slat) || Number.isNaN(slng)) continue;
        const d = haversineMi(lat, lng, slat, slng);
        if (!best || d < best.d) best = { s, d, slat, slng };
      }
      if (!best) return null;
      const rids = [...stopRoutes.get(best.s.stop_id)];
      const infos = rids.map(r => routeById.get(r)).filter(Boolean);
      const colors = [...new Set(infos.map(i => i.color).filter(Boolean))];
      const names = [...new Set(infos.map(i => i.name))];
      return {
        stopName: best.s.stop_name, lat: best.slat, lng: best.slng,
        distMi: best.d, colors, routes: names,
        k: infos[0]?.k || "metro",
      };
    },
  };
}

export async function loadGTFS(dir) {
  const read = async (f) => parseCSV(await readFile(new URL(`file://${dir}/${f}`)));
  const [stops, routes, trips, stopTimes] = await Promise.all([
    read("stops.txt"), read("routes.txt"), read("trips.txt"), read("stop_times.txt"),
  ]);
  return buildIndex({ stops, routes, trips, stopTimes });
}

// Replace/insert a meeting's nearest-rail transit item with real GTFS data.
export function enrichMetro(m, idx) {
  if (m.online || m.lat == null || !idx) return m;
  const near = idx.nearestRail(m.lat, m.lng);
  if (!near) return m;
  const item = {
    k: near.k,
    t: `${near.stopName} · ${near.routes.join("/")}`,
    d: `${near.distMi.toFixed(1)} mi to station`,
    q: `${near.stopName} station`,
    slat: near.lat, slng: near.lng,
    colors: near.colors,   // <-- official route_color(s), used by the UI icon
  };
  m.transit = m.transit || [];
  const i = m.transit.findIndex(x => ["metro", "train", "tram", "streetcar"].includes(x.k));
  if (i >= 0) m.transit[i] = item; else m.transit.unshift(item);
  return m;
}
