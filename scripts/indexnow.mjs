// IndexNow — ping search engines (Bing, Yandex, Seznam, …) the moment Fellow's data refreshes, so
// changes get crawled in minutes instead of waiting for the next sitemap sweep. Run after each
// ingest (the daily data refresh + redeploy). Submits the AGGREGATE pages whose content is
// data-backed and therefore changes with the dataset — the six hubs, every problem page, and every
// fellowship page (all guaranteed to exist), in both locales. City/state pages are left to the
// sitemap (submitting thousands daily would be spammy and mostly unchanged).
//
//   node scripts/indexnow.mjs                        # submit
//   INDEXNOW_DRY_RUN=1 node scripts/indexnow.mjs     # print the payload, don't POST
//
// The key is public by design (hosted at https://fellow.space/<key>.txt). It defaults to the
// committed key; override with INDEXNOW_KEY if you rotate it (and update the public/<key>.txt file).
import { readFileSync } from "node:fs";

const HOST = "fellow.space";
const BASE = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY || "54a6a95ac479a221baed91640d9b7461";
const DRY = process.env.INDEXNOW_DRY_RUN === "1";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
// Slugs/codes come from the same source of truth as the pages — extracted from text so this stays
// in sync without importing the aliased TypeScript modules.
const problemSlugs = [...read("../src/lib/problems.ts").matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const fellowshipCodes = [...read("../src/lib/fellowships.ts").matchAll(/code:\s*"([^"]+)"/g)].map((m) => m[1]);

const paths = [
  "", "meetings", "fellowships", "coverage", "support-groups",
  ...problemSlugs.map((s) => `support-groups/${s}`),
  ...fellowshipCodes.map((c) => c.toLowerCase()),
];
const enUrl = (p) => (p ? `${BASE}/${p}` : `${BASE}/`);
const esUrl = (p) => (p ? `${BASE}/es/${p}` : `${BASE}/es`);
const urlList = [...new Set([...paths.map(enUrl), ...paths.map(esUrl)])];

async function main() {
  console.log(`· IndexNow: ${urlList.length} URLs (${problemSlugs.length} problems, ${fellowshipCodes.length} fellowships × 2 locales + hubs)`);
  if (DRY) { console.log(urlList.join("\n")); console.log("\n(dry run — not submitted)"); return; }
  const body = { host: HOST, key: KEY, keyLocation: `${BASE}/${KEY}.txt`, urlList };
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await r.text().catch(() => "");
  // IndexNow returns 200/202 on success; 422 = key/URL mismatch, 403 = key not found at keyLocation.
  if (r.ok) console.log(`+ IndexNow accepted ${urlList.length} URLs (HTTP ${r.status})`);
  else console.warn(`! IndexNow HTTP ${r.status}${text ? ` — ${text.slice(0, 200)}` : ""}`);
}

main().catch((e) => { console.warn(`! IndexNow ping failed (non-fatal): ${e.message}`); });
