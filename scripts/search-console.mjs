// Fetch Google Search Console performance for fellow.space and write the export the internal
// /studio dashboard reads (src/lib/search-console.json). Zero external dependencies — a service
// account JWT is minted and signed with Node's built-in crypto, exchanged for an access token,
// then the Search Analytics API is queried directly. Nothing here invents data: if the property
// has no traffic yet, it writes real zeros, and /studio shows them honestly.
//
//   GSC_KEY_FILE=./gsc-service-account.json npm run gsc
//
// One-time Google setup (see the refresh runbook, "Connecting Google Search Console"):
//   1. Create a Google Cloud service account, download its JSON key.
//   2. In Search Console → Settings → Users and permissions, add the service account's
//      client_email as a user (Restricted is enough) on the fellow.space property.
//   3. Point GSC_KEY_FILE at the JSON key (or set GOOGLE_APPLICATION_CREDENTIALS).
//
// Env:
//   GSC_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS  path to the service-account JSON key (required)
//   GSC_SITE   property URL, default "https://fellow.space/"  (domain property: "sc-domain:fellow.space")
//   GSC_DAYS   window length in days, default 28
//   GSC_LAG    days to skip at the recent end for data settling, default 3
import { readFile, writeFile } from "node:fs/promises";
import { createSign } from "node:crypto";

const SITE = process.env.GSC_SITE || "https://fellow.space/";
const DAYS = Number(process.env.GSC_DAYS || 28);
const LAG = Number(process.env.GSC_LAG || 3);
const KEY_FILE = process.env.GSC_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ymd = (d) => d.toISOString().slice(0, 10);

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email, scope: SCOPE, aud: key.token_uri || "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(key.private_key));
  const jwt = `${header}.${claim}.${sig}`;
  const r = await fetch(key.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!r.ok) throw new Error(`token exchange failed: HTTP ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

async function query(token, body) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`query failed: HTTP ${r.status} ${await r.text()}`);
  return (await r.json()).rows || [];
}

async function main() {
  if (!KEY_FILE) {
    console.error("✗ No service-account key. Set GSC_KEY_FILE (or GOOGLE_APPLICATION_CREDENTIALS) to the JSON key path.");
    process.exit(1);
  }
  const key = JSON.parse(await readFile(KEY_FILE, "utf8"));
  const token = await accessToken(key);

  const end = new Date(Date.now() - LAG * 86_400_000);
  const start = new Date(end.getTime() - (DAYS - 1) * 86_400_000);
  const range = { startDate: ymd(start), endDate: ymd(end) };
  console.log(`+ ${SITE} · ${range.startDate} → ${range.endDate}`);

  // Totals (no dimension → a single summary row).
  const totalRows = await query(token, { ...range, dimensions: [] });
  const t = totalRows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  // Top queries by clicks.
  const qRows = await query(token, { ...range, dimensions: ["query"], rowLimit: 12, orderBy: [{ field: "clicks", descending: true }] });
  const topQueries = qRows.map((r) => ({
    query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: +r.position.toFixed(1),
  }));

  // Opportunities: pages with real demand (impressions) but weak placement (avg position past the
  // top of page one). Sorted by impressions so the biggest under-performers surface first.
  const pRows = await query(token, { ...range, dimensions: ["page"], rowLimit: 1000 });
  const site = SITE.replace(/^sc-domain:/, "https://").replace(/\/$/, "");
  const opportunities = pRows
    .filter((r) => r.position > 8 && r.impressions >= 1)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 12)
    .map((r) => ({
      page: r.keys[0].replace(site, "") || "/",
      impressions: r.impressions, position: +r.position.toFixed(1), ctr: +r.ctr.toFixed(4),
    }));

  const out = {
    generatedAt: new Date().toISOString(),
    range: `${range.startDate} → ${range.endDate}`,
    clicks: t.clicks || 0,
    impressions: t.impressions || 0,
    ctr: +(t.ctr || 0).toFixed(4),
    position: +(t.position || 0).toFixed(1),
    topQueries,
    opportunities,
  };
  await writeFile(new URL("../src/lib/search-console.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log(`+ wrote src/lib/search-console.json — ${out.clicks} clicks / ${out.impressions} impressions, ${topQueries.length} queries, ${opportunities.length} opportunities`);
  if (out.impressions === 0) console.log("  (zero impressions in range — the site may be new or newly verified; /studio will show real zeros)");
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
