"use client";
import { useEffect, useRef, useState } from "react";
import { fellowshipColor, fellowshipName } from "@/lib/fellowships";
import { Icon } from "./Icon";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

type Meeting = { id: string; name: string; fellowship: string; day: number; time: string; place: string; address: string; online: boolean; lat: number | null; lng: number | null };
type Msg = { role: "user" | "assistant"; content: string; meetings?: Meeting[] };

const SUGGESTIONS = [
  "AA meeting tonight near me",
  "Something for gambling this weekend",
  "My partner's drinking is a problem",
  "Online NA meeting this morning",
];

function ChatCard({ m }: { m: Meeting }) {
  const mapsAddr = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((m.place ? m.place + ", " : "") + m.address)}`;
  return (
    <div className="chat-card" style={{ ["--fc" as any]: fellowshipColor(m.fellowship) }}>
      <span className="cc-badge">{m.fellowship}</span>
      <span className="cc-body">
        <span className="cc-name">{m.name}</span>
        <span className="cc-meta">{DAYS[m.day]} · {to12(m.time)} · {m.online ? "Online" : m.place || m.address}</span>
      </span>
      {m.online
        ? <span className="cc-link cc-online">Online</span>
        : <a className="cc-link" href={mapsAddr} target="_blank" rel="noopener" aria-label={`Directions to ${m.name}`}><Icon name="route" size={16} /></a>}
    </div>
  );
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const loc = useRef<{ lat: number; lng: number } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { loc.current = { lat: p.coords.latitude, lng: p.coords.longitude }; },
        () => {}, { timeout: 8000, maximumAge: 600000 },
      );
    }
  }, []);
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setErr("");
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), location: loc.current }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d?.error || "Something went wrong."); setBusy(false); return; }
      setMsgs((cur) => [...cur, { role: "assistant", content: d.reply || "", meetings: d.meetings || [] }]);
    } catch {
      setErr("Couldn’t reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-wrap">
      <div className="chat-thread" ref={threadRef} role="log" aria-live="polite" aria-label="Conversation">
        {msgs.length === 0 && (
          <div className="chat-intro">
            <p><strong>Ask me to find a meeting.</strong> Try something like:</p>
            <div className="chat-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
            <p className="chat-fine">Fellow is independent and not affiliated with any fellowship. It finds meetings — it isn’t a substitute for professional help.</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content && <div className="bubble">{m.content}</div>}
            {m.meetings && m.meetings.length > 0 && (
              <div className="chat-cards">{m.meetings.map((mt) => <ChatCard key={mt.id} m={mt} />)}</div>
            )}
          </div>
        ))}
        {busy && <div className="msg assistant"><div className="bubble typing"><span></span><span></span><span></span></div></div>}
        {err && <div className="chat-err" role="alert">{err}</div>}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="chatq" style={{ position: "absolute", left: -9999 }}>Message</label>
        <input id="chatq" value={input} onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Ask for a meeting…" autoComplete="off" />
        <button className="btn btn-fc" type="submit" disabled={busy || !input.trim()} style={{ ["--fc" as any]: "var(--brand)" }} aria-label="Send">
          <Icon name="nearme" size={18} />
        </button>
      </form>
    </div>
  );
}
