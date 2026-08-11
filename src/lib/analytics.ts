// Privacy-preserving chatbot analytics. Records ONLY non-identifying daily aggregates — a per-day
// count of conversations, whether a meeting was found, whether online was requested, and which
// fellowship code was searched. It never stores the user's message, the place they typed, an IP, or
// anything that could identify a person — that keeps Fellow's anonymity promise intact.
//
// Storage is an optional Upstash Redis (REST, zero-dep). If ANALYTICS_UPSTASH_URL/TOKEN aren't set,
// every call is a silent no-op, so the chatbot works identically with or without analytics.
import "server-only";

const URL_BASE = process.env.ANALYTICS_UPSTASH_URL || "";
const TOKEN = process.env.ANALYTICS_UPSTASH_TOKEN || "";
export const analyticsEnabled = !!(URL_BASE && TOKEN);

type ChatEvent = { fellowship?: string; found: boolean; online: boolean };

// Fire a single Redis pipeline of INCRs (+ one SADD to remember which fellowship codes appear).
// Awaited with a tight timeout so it never meaningfully delays the reply, and every error is
// swallowed — analytics must never break chat.
export async function logChatEvent(ev: ChatEvent): Promise<void> {
  if (!analyticsEnabled) return;
  const day = new Date().toISOString().slice(0, 10); // UTC date only — no finer timestamp
  const cmds: string[][] = [["INCR", `cb:day:${day}:total`]];
  if (!ev.found) cmds.push(["INCR", `cb:day:${day}:empty`]);
  if (ev.online) cmds.push(["INCR", `cb:day:${day}:online`]);
  const code = (ev.fellowship || "").replace(/[^A-Za-z-]/g, "").slice(0, 12);
  if (code) {
    cmds.push(["INCR", `cb:day:${day}:fel:${code}`]);
    cmds.push(["SADD", "cb:fels", code]);
  }
  try {
    await fetch(`${URL_BASE}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds),
      signal: AbortSignal.timeout(1500),
    });
  } catch { /* analytics is best-effort; never surface to the user */ }
}
