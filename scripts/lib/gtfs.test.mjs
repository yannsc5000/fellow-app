import assert from "node:assert";
import { parseCSV, buildIndex, enrichMetro } from "./gtfs.mjs";

// CSV: quotes + embedded comma
const rows = parseCSV(`a,b,c\n1,"x,y",3\n`);
assert.deepEqual(rows, [{ a: "1", b: "x,y", c: "3" }]);

// tiny GTFS: one subway route (Green), one bus route (ignored)
const stops = [
  { stop_id: "S1", stop_name: "Columbia Heights", stop_lat: "38.9287", stop_lon: "-77.0325" },
  { stop_id: "S2", stop_name: "Far Station", stop_lat: "39.5", stop_lon: "-77.5" },
  { stop_id: "B1", stop_name: "Bus Stop", stop_lat: "38.93", stop_lon: "-77.03" },
];
const routes = [
  { route_id: "GR", route_type: "1", route_short_name: "Green", route_color: "00A94F" },
  { route_id: "YL", route_type: "1", route_short_name: "Yellow", route_color: "FFD200" },
  { route_id: "BUS", route_type: "3", route_short_name: "70", route_color: "" },
];
const trips = [
  { trip_id: "t1", route_id: "GR" }, { trip_id: "t2", route_id: "YL" }, { trip_id: "t3", route_id: "BUS" },
];
const stopTimes = [
  { trip_id: "t1", stop_id: "S1" }, { trip_id: "t2", stop_id: "S1" }, // S1 served by Green + Yellow
  { trip_id: "t1", stop_id: "S2" },
  { trip_id: "t3", stop_id: "B1" }, // bus stop — must be excluded
];

const idx = buildIndex({ stops, routes, trips, stopTimes });
const near = idx.nearestRail(38.9309, -77.0278); // near Columbia Heights
assert.equal(near.stopName, "Columbia Heights");
assert.deepEqual(near.colors.sort(), ["#00a94f", "#ffd200"], "picks up both rail line colors");
assert.equal(near.k, "metro");

// bus-only stop excluded from rail index
const all = idx.nearestRail(38.93, -77.03);
assert.notEqual(all.stopName, "Bus Stop");

// enrichMetro replaces the metro transit item with real colors
const m = { online: false, lat: 38.9309, lng: -77.0278, transit: [{ k: "metro", t: "old", d: "?" }] };
enrichMetro(m, idx);
assert.equal(m.transit[0].t, "Columbia Heights · Green/Yellow");
assert.deepEqual(m.transit[0].colors.sort(), ["#00a94f", "#ffd200"]);

console.log("GTFS enrichment tests passed ✔");
