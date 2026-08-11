// KPI alert engine. Evaluates the product KPIs (same targets + thresholds the /studio scorecard
// uses) from the committed data, compares each to the last recorded status in kpi-state.json, and
// emails the global alert address when a KPI crosses a threshold (good or bad) or hits its goal.
// State-based, so it emails on the *transition*, not every run. First run self-baselines silently.
//
//   node scripts/kpi-alerts.mjs            # evaluate + email on changes, update state
//   node scripts/kpi-alerts.mjs --dry-run  # print what would send, don't email, don't write state
//
// Email provider (first one configured wins; otherwise dry-run prints the digest):
//   RESEND_API_KEY + ALERT_EMAIL   → Resend API (ALERT_FROM defaults to "Fellow Studio <studio@fellow.space>")
//   ALERT_WEBHOOK                  → POST { text } (Slack-compatible incoming webhook)
// ALERT_EMAIL defaults to the app CONTACT_EMAIL.
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const DRY = process.argv.includes("--dry-run");
const url = (p) => new URL(p, import.meta.url);
const readJson = async (p, fallback) => { try { return JSON.parse(await readFile(url(p))); } catch { return fallback; } };

const US_STATES = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "));
function stateOf(address) {
  if (!address) return null;
  const parts = String(address).split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) { const m = parts[i].match(/^([A-Z]{2})\b/); if (m && US_STATES.has(m[1])) return m[1]; }
  return null;
}
const ageDays = (updated, refMs) => { const m = String(updated).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (refMs - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000 : null; };

async function loadMeetings() {
  try { return JSON.parse(await readFile(url("../public/data/meetings.json"), "utf8")); }
  catch { try { return JSON.parse(gunzipSync(await readFile(url("../public/data/meetings.json.gz"))).toString("utf8")); } catch { return []; } }
}

function statusOf(d, v) {
  if (v == null) return "na";
  if (d.dir === "up") { if (v >= d.target) return "met"; if (v <= d.warn) return "at_risk"; if (v >= d.near * d.target) return "approaching"; return "on_track"; }
  if (v <= d.target) return "met"; if (v >= d.warn) return "at_risk"; if (v <= d.target * d.near) return "approaching"; return "on_track";
}
const fmtVal = (unit, v) => v == null ? "—" : unit === "pct" ? `${Math.round(v)}%` : unit === "pos" ? v.toFixed(1) : v.toLocaleString("en-US");
const LABEL = { met: "GOAL MET", approaching: "Approaching goal", on_track: "On track", at_risk: "AT RISK", na: "awaiting data" };

async function computeValues() {
  const raw = await loadMeetings();
  const stats = await readJson("../src/lib/fellowship-stats.json", { generatedAt: "", counts: {} });
  const search = await readJson("../src/lib/search-console.json", null);
  const cb = await readJson("../src/lib/chatbot-analytics.json", { connected: false, totals: {} });
  const refMs = stats.generatedAt ? new Date(stats.generatedAt).getTime() : Date.now();

  const byState = {}; let inPerson = 0, online = 0, onlineNoJoin = 0, dated = 0, fresh = 0, aging = 0;
  const fels = new Set();
  for (const m of raw) {
    if (m.fellowship) fels.add(m.fellowship);
    if (m.online) { online++; if (!m.conference_url) onlineNoJoin++; }
    else { inPerson++; const st = stateOf(m.address); if (st) byState[st] = (byState[st] || 0) + 1; }
    if (m.updated) { const a = ageDays(m.updated, refMs); if (a != null) { dated++; if (a < 90) fresh++; else if (a <= 365) aging++; } }
  }
  const thin = Object.values(byState).filter((n) => n < 50).length;
  const cbConns = cb.connected ? (cb.totals?.conversations ?? 0) : null;
  return {
    meetings: raw.length,
    states: Object.keys(byState).length,
    fellowships: fels.size,
    thin_states: thin,
    freshness: dated ? Math.round(((fresh + aging) / dated) * 100) : null,
    joinlink: online ? Math.round(((online - onlineNoJoin) / online) * 100) : null,
    impressions: search ? Number(search.impressions || 0) : null,
    clicks: search ? Number(search.clicks || 0) : null,
    position: search ? Number(search.position || 0) : null,
    chat_queries: cbConns,
    chat_hit: cb.connected && (cb.totals?.conversations ?? 0) > 0 ? Math.round(((cb.totals?.foundMeeting ?? 0) / cb.totals.conversations) * 100) : (cb.connected ? 0 : null),
  };
}

async function send(subject, textLines) {
  const body = textLines.join("\n");
  const to = process.env.ALERT_EMAIL || "Iamfoundoftenlost@gmail.com";
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.ALERT_FROM || "Fellow Studio <studio@fellow.space>", to: [to], subject, text: body }),
    });
    console.log(r.ok ? `+ emailed ${to} via Resend` : `✗ Resend failed: HTTP ${r.status} ${await r.text()}`);
    return;
  }
  if (process.env.ALERT_WEBHOOK) {
    const r = await fetch(process.env.ALERT_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `*${subject}*\n${body}` }) });
    console.log(r.ok ? "+ posted to webhook" : `✗ Webhook failed: HTTP ${r.status}`);
    return;
  }
  console.log(`\n(dry-run — no email provider configured) Would send to ${to}:\n── ${subject} ──\n${body}\n`);
}

async function main() {
  const defs = (await readJson("../src/lib/kpi-targets.json", { kpis: [] })).kpis;
  const values = await computeValues();
  const prev = await readJson("../src/lib/kpi-state.json", null);
  const now = {};
  const transitions = [];
  for (const d of defs) {
    const v = values[d.id] ?? null;
    const s = statusOf(d, v);
    now[d.id] = s;
    const was = prev?.statuses?.[d.id];
    if (!prev || was === s) continue;
    // Alert on crossing into a good/bad threshold or the goal, and on recovering out of at-risk.
    const notable = s === "at_risk" || s === "approaching" || s === "met" || (was === "at_risk");
    if (notable && s !== "na") {
      transitions.push({ d, v, s, was: was || "—" });
    }
  }

  const stamp = new Date().toISOString();
  if (!prev) {
    console.log(`+ baseline established (${defs.length} KPIs) — no email on first run.`);
  } else if (transitions.length) {
    const bad = transitions.filter((t) => t.s === "at_risk").length;
    const good = transitions.length - bad;
    const subject = `Fellow KPI alert · ${bad ? `${bad} at risk` : ""}${bad && good ? ", " : ""}${good ? `${good} good` : ""}`.trim();
    const lines = [`As of ${stamp.slice(0, 10)} — ${transitions.length} KPI status change(s):`, ""];
    for (const t of transitions) {
      const goalTxt = `goal ${t.d.dir === "down" ? "≤ " : ""}${fmtVal(t.d.unit, t.d.target)}`;
      lines.push(`• [${LABEL[t.s]}] ${t.d.label}: ${fmtVal(t.d.unit, t.v)} (${goalTxt}) — was ${LABEL[t.was] || t.was}`);
      lines.push(`    ${t.d.why}`);
    }
    lines.push("", "See the full scorecard at /studio.");
    await send(subject, lines);
  } else {
    console.log("· no KPI status changes since last run — no email.");
  }

  if (!DRY) {
    await writeFile(url("../src/lib/kpi-state.json"), JSON.stringify({ updatedAt: stamp, statuses: now }, null, 2) + "\n");
    console.log(`+ wrote kpi-state.json`);
  }
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
