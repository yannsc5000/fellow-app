// Create (or recreate) the Typesense collection and import meetings.json.
//   TYPESENSE_ADMIN_API_KEY=... node scripts/index.mjs
import { readFile } from "node:fs/promises";
import Typesense from "typesense";
import { fellowshipName, fellowshipTerms } from "./lib/fellowships.mjs";

const COLLECTION = process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION || "meetings";

const client = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || "localhost",
    port: Number(process.env.TYPESENSE_PORT || 8108),
    protocol: process.env.TYPESENSE_PROTOCOL || "http",
  }],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY || "devkey",
  connectionTimeoutSeconds: 5,
});

const schema = {
  name: COLLECTION,
  fields: [
    { name: "name", type: "string" },
    { name: "fellowship", type: "string", facet: true },
    { name: "fellowship_name", type: "string", optional: true },
    { name: "fellowship_terms", type: "string", optional: true },
    { name: "types", type: "string[]", facet: true },
    { name: "day", type: "int32", facet: true },
    { name: "time", type: "string", sort: true },
    { name: "minutes", type: "int32", optional: true, sort: true },

    { name: "online", type: "bool", facet: true },
    { name: "place", type: "string", optional: true },
    { name: "address", type: "string" },
    { name: "notes", type: "string", optional: true },
    { name: "_geoloc", type: "geopoint", optional: true },
    { name: "dist", type: "float", optional: true, sort: true },
    { name: "transit_json", type: "string", optional: true, index: false },
    { name: "parking_json", type: "string", optional: true, index: false },
  ],
  // No default_sorting_field: `dist` is optional (online meetings have none), and
  // Typesense forbids an optional default sort field. We always pass sort_by explicitly
  // (day:asc,time:asc, or geo distance for "near me").
};

// Wait for Typesense to be healthy (so `bootstrap` doesn't race container startup).
async function waitForHealth(tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { const h = await client.health.retrieve(); if (h.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Typesense not reachable — is it running? Try `npm run typesense:up`.");
}
await waitForHealth();

const meetings = JSON.parse(await readFile(new URL("../public/data/meetings.json", import.meta.url)));
const toMinutes = (t) => {
  const [h, m] = String(t || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : undefined;
};
const docs = meetings.map((m) => {
  const { transit, parking, lat, lng, ...rest } = m;
  return {
    ...rest, lat, lng,
    minutes: toMinutes(m.time),
    fellowship_name: fellowshipName(m.fellowship),
    fellowship_terms: fellowshipTerms(m.fellowship),
    _geoloc: lat != null && lng != null ? [lat, lng] : undefined,
    transit_json: transit ? JSON.stringify(transit) : undefined,
    parking_json: parking ? JSON.stringify(parking) : undefined,
  };
});

// Safety guard: never let a partial/blocked ingest wipe a much larger live index.
// If this run produced far fewer meetings than what's already indexed, it almost
// always means feeds were blocked this run — abort instead of replacing good data.
// Override intentionally with FORCE_INDEX=1 (e.g. a deliberate shrink).
const MIN_RATIO = Number(process.env.INDEX_MIN_RATIO || 0.7);
let current = 0;
try { current = (await client.collections(COLLECTION).retrieve()).num_documents || 0; } catch {}
if (current > 0 && docs.length < current * MIN_RATIO && process.env.FORCE_INDEX !== "1") {
  console.error(
    `✋ Refusing to index: this run has ${docs.length} meetings but the live index has ${current} ` +
    `(< ${Math.round(MIN_RATIO * 100)}%). Feeds were likely blocked this run. Re-run a full ingest ` +
    `(USE_BROWSER=1), or set FORCE_INDEX=1 to override.`
  );
  process.exit(1);
}

try { await client.collections(COLLECTION).delete(); } catch {}
await client.collections().create(schema);
const res = await client.collections(COLLECTION).documents().import(docs, { action: "upsert" });
const failed = res.filter((r) => !r.success);
console.log(`Indexed ${docs.length - failed.length}/${docs.length} into "${COLLECTION}".`);
if (failed.length) console.error(failed.slice(0, 3));
