// Aggregate the privacy-preserving chatbot counters (Upstash Redis) into src/lib/chatbot-analytics.json,
// which the /studio "Chatbot activity" panel and the two Engagement KPIs read. Aggregates only — the
// store never held any message text, place, or IP to begin with (see src/lib/analytics.ts).
//
//   ANALYTICS_UPSTASH_URL=... ANALYTICS_UPSTASH_TOKEN=... npm run chatbot:stats
//
// If the store isn't configured, it leaves the file as-is (the panel shows "not connected").
import { writeFile } from "node:fs/promises";

const URL_BASE = process.env.ANALYTICS_UPSTASH_URL || "";
const TOKEN = process.env.ANALYTICS_UPSTASH_TOKEN || "";
const DAYS = Number(process.env.CHATBOT_DAYS || 28);

if (!URL_BASE || !TOKEN) {
  console.log("· ANALYTICS_UPSTASH_URL/TOKEN not set — leaving chatbot-analytics.json unchanged (panel stays 'not connected').");
  process.exit(0);
}

async function pipeline(cmds) {
  const r = await fetch(`${URL_BASE}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`Upstash HTTP ${r.status} ${await r.text()}`);
  const out = await r.json();
  return out.map((x) => (x && typeof x === "object" && "result" in x ? x.result : x));
}
const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

async function main() {
  // Date list: DAYS days ending today (UTC).
  const dates = [];
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  for (let i = DAYS - 1; i >= 0; i--) dates.push(new Date(today - i * 86400000).toISOString().slice(0, 10));

  // Pipeline 1: the fellowship-code set + per-day total/empty/online.
  const p1 = [["SMEMBERS", "cb:fels"]];
  for (const d of dates) { p1.push(["GET", `cb:day:${d}:total`], ["GET", `cb:day:${d}:empty`], ["GET", `cb:day:${d}:online`]); }
  const r1 = await pipeline(p1);
  const codes = Array.isArray(r1[0]) ? r1[0] : [];
  const days = dates.map((date, i) => {
    const base = 1 + i * 3;
    return { date, total: n(r1[base]), empty: n(r1[base + 1]), online: n(r1[base + 2]) };
  });

  // Pipeline 2: per-day per-fellowship counts → summed to a per-code total.
  const byFellowship = {};
  if (codes.length) {
    const p2 = [];
    for (const d of dates) for (const c of codes) p2.push(["GET", `cb:day:${d}:fel:${c}`]);
    const r2 = await pipeline(p2);
    let k = 0;
    for (let i = 0; i < dates.length; i++) for (const c of codes) { byFellowship[c] = (byFellowship[c] || 0) + n(r2[k++]); }
    for (const c of Object.keys(byFellowship)) if (!byFellowship[c]) delete byFellowship[c];
  }

  const conversations = days.reduce((s, d) => s + d.total, 0);
  const empty = days.reduce((s, d) => s + d.empty, 0);
  const online = days.reduce((s, d) => s + d.online, 0);

  const out = {
    connected: true,
    generatedAt: new Date().toISOString(),
    range: `${dates[0]} → ${dates[dates.length - 1]}`,
    days,
    byFellowship,
    totals: { conversations, foundMeeting: conversations - empty, empty, online },
  };
  await writeFile(new URL("../src/lib/chatbot-analytics.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log(`+ wrote src/lib/chatbot-analytics.json — ${conversations} conversations, ${conversations - empty} found a meeting, ${Object.keys(byFellowship).length} fellowships (${out.range})`);
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
