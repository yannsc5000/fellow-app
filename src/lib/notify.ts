import "server-only";
import { CONTACT_EMAIL } from "@/lib/config";

// Heads-up email when someone starts a NEW Ask Fellow conversation.
//
// PRIVACY: this transmits ZERO chat data — no message text, no location, no fellowship, no
// outcome, nothing that could identify a person or reveal what they asked. It is only a signal
// that the chatbot was engaged, which keeps Fellow's "we don't store your conversation" promise
// intact. (Do not add message content here — that's a deliberate, load-bearing omission.)
//
// Best-effort: returns a promise that NEVER rejects, so a mail failure can't affect the chat
// reply. No-op unless RESEND_API_KEY is set, so the chatbot behaves identically without it.
//
// Provider mirrors scripts/kpi-alerts.mjs:
//   RESEND_API_KEY  → Resend API
//   ALERT_EMAIL     → recipient (defaults to the app CONTACT_EMAIL)
//   ALERT_FROM      → sender    (defaults to "Fellow <studio@fellow.space>")
export function notifyChatEngagement(): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return Promise.resolve(); // no provider configured → silent no-op

  const to = process.env.ALERT_EMAIL || CONTACT_EMAIL;
  const from = process.env.ALERT_FROM || "Fellow <studio@fellow.space>";
  const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const subject = "Ask Fellow: someone just started a chat";
  const text = [
    "Someone just engaged Ask Fellow on fellow.space.",
    "",
    `A new conversation started at ${when}.`,
    "",
    "No conversation content is included here — and none is stored. This is only a heads-up that the chatbot is being used.",
    "",
    "— Fellow",
  ].join("\n");

  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(4000),
  })
    .then(() => undefined)
    .catch(() => undefined); // best-effort; never surface to the user
}
