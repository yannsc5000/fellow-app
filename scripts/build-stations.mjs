// One-time generator: downloads major US rail agencies' GTFS feeds, extracts each rail
// STATION (name, coordinates, official line colors, route names) and writes a compact
// scripts/lib/stations/<id>.json. The ingest then enriches meetings in those metros with
// real nearest-station data (like DC already does) — no huge feeds at ingest time.
//
// Run on a machine with internet (your Mac), then commit the generated JSON:
//   node scripts/build-stations.mjs
//   git add scripts/lib/stations && git commit -m "rail stations" && git push
//   npm run ingest && npm run index
//
// Requires the `unzip` command (preinstalled on macOS). Feeds that fail (dead URL, moved,
// nested zip) are skipped and reported — edit AGENCIES below or ask for updated URLs.
import { mkdir, writeFile, rm, readFile, readdir } from "node:fs/promises";
import { createWriteStream, createReadStream, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { parseCSV } from "./lib/gtfs.mjs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = new URL("./lib/stations/", import.meta.url);
const TMP = new URL("./.gtfs-tmp/", import.meta.url);

// route_type values that are rail/tram (colored lines riders take to a meeting).
const RAIL_TYPES = { "0": "tram", "1": "metro", "2": "train", "5": "tram", "7": "tram", "12": "metro" };
const hex = (c) => (c && /^[0-9a-fA-F]{6}$/.test(c) ? `#${c.toLowerCase()}` : null);

// Rail agencies. DC (WMATA) is intentionally omitted — it's already bundled. Some feeds
// include buses too (bigger, but we filter to rail). Edit freely; unknowns are skipped.
const AGENCIES = [
  { id: "mta-nyc",  name: "New York City Subway",    url: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip" },
  { id: "mbta",     name: "Boston (MBTA)",           url: "https://cdn.mbta.com/MBTA_GTFS.zip" },
  { id: "cta",      name: "Chicago (CTA 'L')",       url: "https://www.transitchicago.com/downloads/sch_data/google_transit.zip" },
  { id: "bart",     name: "San Francisco (BART)",    url: "https://www.bart.gov/dev/schedules/google_transit.zip" },
  { id: "sfmuni",   name: "San Francisco (Muni)",    url: "https://muni-gtfs.apps.sfmta.com/data/muni_gtfs-current.zip" },
  { id: "lametro",  name: "Los Angeles Metro Rail",  url: "https://gitlab.com/LACMTA/gtfs_rail/-/raw/master/gtfs_rail.zip" },
  { id: "marta",    name: "Atlanta (MARTA)",         url: "https://www.itsmarta.com/google_transit_feed/google_transit.zip" },
  { id: "miami",    name: "Miami-Dade Metrorail",    url: "https://www.miamidade.gov/transit/googletransit/current/google_transit.zip" },
  { id: "trimet",   name: "Portland (MAX)",          url: "https://developer.trimet.org/schedule/gtfs.zip" },
  { id: "sound",    name: "Seattle (Link)",          url: "https://www.soundtransit.org/GTFS-rail/40_gtfs.zip" },
  { id: "sdmts",    name: "San Diego Trolley",       url: "https://www.sdmts.com/google_transit_files/google_transit.zip" },
  { id: "septa",    name: "Philadelphia (SEPTA)",    url: "https://github.com/septadev/GTFS/releases/latest/download/gtfs_public.zip" },
];

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", rej);
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}: ${err.slice(0, 120)}`))));
  });
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(dest);
    Readable.fromWeb(res.body).pipe(ws);
    ws.on("finish", resolve);
    ws.on("error", reject);
  });
}

// Find every folder under `root` (root itself + one level down) that looks like a GTFS set.
async function findGtfsDirs(root) {
  const out = [];
  if (existsSync(`${root}/stops.txt`)) out.push(root);
  for (const e of await readdir(root, { withFileTypes: true })) {
    if (e.isDirectory() && existsSync(`${root}/${e.name}/stops.txt`)) out.push(`${root}/${e.name}`);
  }
  return out;
}

// Stream stop_times.txt (can be hundreds of MB) → Map(stop_id -> Set(route_id)) for rail trips.
async function railStopRoutes(dir, railTripToRoute) {
  const stopRoutes = new Map();
  const rl = createInterface({ input: createReadStream(`${dir}/stop_times.txt`), crlfDelay: Infinity });
  let ti = -1, si = -1;
  for await (const line of rl) {
    if (ti < 0) { const h = line.replace(/\r$/, "").split(","); ti = h.indexOf("trip_id"); si = h.indexOf("stop_id"); continue; }
    const cols = line.split(","); // trip_id / stop_id are unquoted in practice
    const rid = railTripToRoute.get(cols[ti]);
    if (!rid) continue;
    const stop = cols[si];
    if (!stopRoutes.has(stop)) stopRoutes.set(stop, new Set());
    stopRoutes.get(stop).add(rid);
  }
  return stopRoutes;
}

async function stationsFromDir(dir) {
  const [routes, trips, stops] = await Promise.all([
    readFile(`${dir}/routes.txt`, "utf8").then(parseCSV),
    readFile(`${dir}/trips.txt`, "utf8").then(parseCSV),
    readFile(`${dir}/stops.txt`, "utf8").then(parseCSV),
  ]);
  const routeById = new Map();
  for (const r of routes) {
    const k = RAIL_TYPES[r.route_type];
    if (!k) continue;
    routeById.set(r.route_id, { k, color: hex(r.route_color), name: r.route_short_name || r.route_long_name || r.route_id });
  }
  if (!routeById.size) return [];
  const railTripToRoute = new Map();
  for (const t of trips) if (routeById.has(t.route_id)) railTripToRoute.set(t.trip_id, t.route_id);
  const stopRoutes = await railStopRoutes(dir, railTripToRoute);

  const stopById = new Map(stops.map((s) => [s.stop_id, s]));
  const agg = new Map(); // stationId -> { routes:Set, colors:Set, k }
  for (const [stopId, rids] of stopRoutes) {
    const s = stopById.get(stopId);
    if (!s) continue;
    const sid = s.parent_station && stopById.has(s.parent_station) ? s.parent_station : stopId;
    if (!agg.has(sid)) agg.set(sid, { routes: new Set(), colors: new Set(), k: null });
    const a = agg.get(sid);
    for (const rid of rids) {
      const info = routeById.get(rid);
      if (!info) continue;
      a.routes.add(info.name);
      if (info.color) a.colors.add(info.color);
      if (!a.k) a.k = info.k;
    }
  }
  const out = [];
  for (const [sid, a] of agg) {
    const s = stopById.get(sid);
    if (!s) continue;
    const lat = parseFloat(s.stop_lat), lng = parseFloat(s.stop_lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    out.push({ name: s.stop_name, lat: +lat.toFixed(5), lng: +lng.toFixed(5), colors: [...a.colors], routes: [...a.routes], k: a.k || "metro" });
  }
  return out;
}

await mkdir(OUT, { recursive: true });
await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
const tmpPath = (p) => new URL(p, TMP).pathname;

const summary = [];
for (const ag of AGENCIES) {
  try {
    const zip = tmpPath(`${ag.id}.zip`);
    const dir = tmpPath(`${ag.id}/`);
    await download(ag.url, zip);
    await mkdir(dir, { recursive: true });
    await run("unzip", ["-o", "-q", zip, "-d", dir]);
    // Some feeds (e.g. SEPTA) ship a zip-of-zips — extract any nested .zip one level down
    // so findGtfsDirs can see the inner GTFS set(s). Rail lives in google_rail.zip; the
    // bus zip extracts too but is skipped cheaply (no rail route_types → no stop_times read).
    for (const f of await readdir(dir)) {
      if (!f.toLowerCase().endsWith(".zip")) continue;
      const sub = tmpPath(`${ag.id}/${f.replace(/\.zip$/i, "")}/`);
      await mkdir(sub, { recursive: true });
      await run("unzip", ["-o", "-q", `${dir}${f}`, "-d", sub]);
    }
    const gdirs = await findGtfsDirs(dir.replace(/\/$/, ""));
    if (!gdirs.length) throw new Error("no stops.txt found (nested zip?)");
    const seen = new Set(), stations = [];
    for (const g of gdirs) {
      for (const st of await stationsFromDir(g)) {
        const key = `${st.name}|${st.lat.toFixed(3)}|${st.lng.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        stations.push(st);
      }
    }
    if (!stations.length) throw new Error("no rail stations extracted");
    await writeFile(new URL(`${ag.id}.json`, OUT), JSON.stringify(stations));
    console.log(`+ ${ag.id} [${ag.name}] ${stations.length} stations`);
    summary.push({ id: ag.id, n: stations.length });
  } catch (e) {
    console.warn(`! ${ag.id} [${ag.name}] failed — ${e.message}`);
    summary.push({ id: ag.id, n: 0, err: e.message });
  }
}
await rm(TMP, { recursive: true, force: true });

const ok = summary.filter((s) => s.n > 0);
const bad = summary.filter((s) => s.n === 0);
console.log(`\nDone. ${ok.length}/${AGENCIES.length} systems written (${ok.reduce((a, s) => a + s.n, 0)} stations).`);
if (bad.length) console.log(`Skipped: ${bad.map((s) => s.id).join(", ")} — fix the URL in AGENCIES or ask for an updated one.`);
console.log(`Next: commit scripts/lib/stations/*.json, then run:  npm run ingest && npm run index`);
