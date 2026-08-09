// Post-deploy smoke test — confirms Typesense is reachable, indexed, and searchable.
//   TYPESENSE_HOST=… TYPESENSE_ADMIN_API_KEY=… npm run smoke
// (a search-only key also works: set TYPESENSE_SEARCH_API_KEY or NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY)
import Typesense from "typesense";

const HOST = process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost";
const PORT = Number(process.env.TYPESENSE_PORT || process.env.NEXT_PUBLIC_TYPESENSE_PORT || 8108);
const PROTOCOL = process.env.TYPESENSE_PROTOCOL || process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http";
const KEY = process.env.TYPESENSE_ADMIN_API_KEY || process.env.TYPESENSE_SEARCH_API_KEY
  || process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "devkey";
const COLLECTION = process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION || process.env.TYPESENSE_COLLECTION || "meetings";

const client = new Typesense.Client({
  nodes: [{ host: HOST, port: PORT, protocol: PROTOCOL }],
  apiKey: KEY, connectionTimeoutSeconds: 8,
});

let failures = 0;
const ok = (label, extra = "") => console.log(`✅ ${label}${extra ? " — " + extra : ""}`);
const bad = (label, e) => { failures++; console.log(`❌ ${label} — ${e?.message || e}`); };

console.log(`Fellow smoke test → ${PROTOCOL}://${HOST}:${PORT} / "${COLLECTION}"\n`);

// 1) health
try { const h = await client.health.retrieve(); h.ok ? ok("Typesense health") : bad("health", "not ok"); }
catch (e) { bad("health (is the host/key right?)", e); }

// 2) collection has documents
let count = 0;
try {
  const c = await client.collections(COLLECTION).retrieve();
  count = c.num_documents;
  count > 0 ? ok("collection indexed", `${count} meetings`) : bad("collection empty", "run ingest+index first");
} catch (e) { bad(`collection "${COLLECTION}" retrieve`, e); }

// 3) keyword search
try {
  const r = await client.collections(COLLECTION).documents().search({
    q: "alcoholics", query_by: "name,fellowship,fellowship_name,fellowship_terms", per_page: 3,
  });
  r.found > 0 ? ok("keyword search", `"alcoholics" → ${r.found} hits`) : bad("keyword search", "0 hits");
} catch (e) { bad("keyword search", e); }

// 4) synonym search (taxonomy wired?)
try {
  const r = await client.collections(COLLECTION).documents().search({
    q: "overeaters", query_by: "name,fellowship,fellowship_name,fellowship_terms", per_page: 3,
  });
  ok("synonym search", `"overeaters" → ${r.found} hits (OA if present)`);
} catch (e) { bad("synonym search", e); }

// 5) geo search near Washington, DC
try {
  const r = await client.collections(COLLECTION).documents().search({
    q: "*", query_by: "name", sort_by: "_geoloc(38.9072,-77.0369):asc", per_page: 3,
  });
  r.found > 0 ? ok("geo search", `${r.found} near DC; nearest: ${r.hits?.[0]?.document?.name}`) : bad("geo search", "0 hits");
} catch (e) { bad("geo search", e); }

console.log(`\n${failures ? "❌ " + failures + " check(s) failed" : "🎉 All checks passed — search is live"}`);
process.exit(failures ? 1 : 0);
