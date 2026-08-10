"use client";
import { useEffect, useRef, useState } from "react";
import { fellowshipColor } from "@/lib/fellowships";
import { Icon } from "./Icon";
import { MeetingSheet } from "./Finder";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

type Meeting = { id: string; name: string; fellowship: string; day: number; time: string; place: string; address: string; online: boolean; lat: number | null; lng: number | null; conference_url?: string; conference_phone?: string; website?: string; updated?: string; end?: string; types?: string[]; notes?: string; transit_json?: string; parking_json?: string };
type WebSearch = { query: string; url: string; official?: { label: string; url: string } };
type Msg = { role: "user" | "assistant"; content: string; meetings?: Meeting[]; webSearch?: WebSearch };
type Place = { lat: number; lng: number; label: string };

// Keyless helpers (shared shape with the Search view).
async function reverseLabel(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const d = await r.json();
    return d.postcode || d.city || d.locality || "your area";
  } catch { return "your area"; }
}
async function zipToPlace(zip: string): Promise<Place | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const d = await r.json();
    const pl = d.places[0];
    return { lat: Number(pl.latitude), lng: Number(pl.longitude), label: zip };
  } catch { return null; }
}

// Editable location bar: prepopulated from the device's best guess; tap to change.
function LocationBar({ place, onSet }: { place: Place | null; onSet: (p: Place) => void }) {
  const [editing, setEditing] = useState(false);
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setErr("Enter a 5-digit ZIP"); return; }
    setBusy(true); setErr("");
    const p = await zipToPlace(zip);
    if (p) { onSet(p); setEditing(false); setZip(""); } else setErr("ZIP not found");
    setBusy(false);
  }
  function useMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (p) => {
      const lat = p.coords.latitude, lng = p.coords.longitude;
      onSet({ lat, lng, label: "your area" });
      onSet({ lat, lng, label: await reverseLabel(lat, lng) });
      setEditing(false);
    });
  }
  if (editing) {
    return (
      <form className="loc-form" onSubmit={submit}>
        <input inputMode="numeric" maxLength={5} autoFocus aria-label="ZIP code" placeholder="ZIP code"
          value={zip} onChange={(e) => setZip(e.currentTarget.value.replace(/\D/g, ""))} />
        <button className="btn btn-soft" type="submit" disabled={busy}>{busy ? "…" : "Go"}</button>
        <button type="button" className="loc-link" onClick={useMe}><Icon name="nearme" size={14} /> Use my location</button>
        <button type="button" className="loc-link" onClick={() => { setEditing(false); setErr(""); }}>Cancel</button>
        {err && <span className="loc-err" role="alert">{err}</span>}
      </form>
    );
  }
  return (
    <button className="loc-btn" onClick={() => setEditing(true)} aria-label={place ? `Location: ${place.label}. Tap to change.` : "Set your location"}>
      <Icon name="pin" size={16} />
      {place ? <span>Near <b>{place.label}</b></span> : <span>Set your location</span>}
      <span className="loc-change">Change</span>
    </button>
  );
}

const SUGGESTIONS = [
  "AA meeting tonight near me",
  "Something for gambling this weekend",
  "My partner's drinking is a problem",
  "Online NA meeting this morning",
];

// Contextual one-tap refinements shown under the latest results.
const REFINE = ["Only online", "Tomorrow instead", "Wider area", "In the morning"];

function ChatCard({ m, onOpen }: { m: Meeting; onOpen: (m: Meeting) => void }) {
  return (
    <button className="chat-card" style={{ ["--fc" as any]: fellowshipColor(m.fellowship) }}
      onClick={() => onOpen(m)} aria-label={`${m.name} details`}>
      <span className="cc-badge">{m.fellowship}</span>
      <span className="cc-body">
        <span className="cc-name">{m.name}</span>
        <span className="cc-meta">{DAYS[m.day]} · {to12(m.time)} · {m.online ? "Online" : m.place || m.address}</span>
      </span>
      <Icon name="chevron" size={18} className="cc-chev" />
    </button>
  );
}

export default function Chat({ onSwitchToSearch }: { onSwitchToSearch?: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [listening, setListening] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  // Voice input via the Web Speech API — supported in Chrome/Safari; the mic button
  // is hidden where it isn't. Fills the input so the user can review before sending.
  const speechSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  function toggleVoice() {
    if (!speechSupported) return;
    if (listening) { recogRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-US"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  }
  useEffect(() => () => { try { recogRef.current?.stop(); } catch {} }, []);

  // Best-guess location on load; the user can change it in the LocationBar.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude;
        setPlace({ lat, lng, label: "your area" });
        setPlace({ lat, lng, label: await reverseLabel(lat, lng) });
      },
      () => {}, { timeout: 8000, maximumAge: 600000 },
    );
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
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), location: place }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d?.error || "Something went wrong."); setBusy(false); return; }
      setMsgs((cur) => [...cur, { role: "assistant", content: d.reply || "", meetings: d.meetings || [], webSearch: d.webSearch }]);
    } catch {
      setErr("Couldn’t reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  const lastAssistantIdx = msgs.reduce((acc, m, i) => (m.role === "assistant" ? i : acc), -1);

  return (
    <div className="chat-wrap">
      <div className="chat-loc"><LocationBar place={place} onSet={setPlace} /></div>
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
              <div className="chat-cards">{m.meetings.map((mt) => <ChatCard key={mt.id} m={mt} onOpen={setSelected} />)}</div>
            )}
            {m.webSearch && (!m.meetings || m.meetings.length === 0) && (
              <div className="web-fallbacks">
                {m.webSearch.official && (
                  <a className="web-fallback wf-official" href={m.webSearch.official.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="list" size={18} />
                    <span>{m.webSearch.official.label}</span>
                    <Icon name="external" size={15} className="wf-ext" />
                  </a>
                )}
                <a className="web-fallback" href={m.webSearch.url} target="_blank" rel="noopener noreferrer">
                  <Icon name="search" size={18} />
                  <span>Search the web for “{m.webSearch.query}”</span>
                  <Icon name="external" size={15} className="wf-ext" />
                </a>
              </div>
            )}
            {i === lastAssistantIdx && m.meetings && m.meetings.length > 0 && !busy && (
              <div className="chat-followups" aria-label="Refine these results">
                {REFINE.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg assistant"><div className="bubble typing"><span></span><span></span><span></span></div></div>}
        {err && (
          <div className="chat-err" role="alert">
            {err}
            {onSwitchToSearch && (
              <button className="btn btn-soft chat-err-switch" onClick={onSwitchToSearch}>
                <Icon name="search" size={16} /> Use classic Search
              </button>
            )}
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="chatq" style={{ position: "absolute", left: -9999 }}>Message</label>
        <input id="chatq" value={input} onChange={(e) => setInput(e.currentTarget.value)}
          placeholder={listening ? "Listening…" : "Ask for a meeting…"} autoComplete="off" />
        {speechSupported && (
          <button type="button" className={`btn btn-soft chat-mic${listening ? " mic-on" : ""}`}
            onClick={toggleVoice} aria-pressed={listening} aria-label={listening ? "Stop voice input" : "Speak your request"}>
            <Icon name="mic" size={18} />
          </button>
        )}
        <button className="btn btn-fc" type="submit" disabled={busy || !input.trim()} style={{ ["--fc" as any]: "var(--brand)" }} aria-label="Send">
          <Icon name="nearme" size={18} />
        </button>
      </form>
      {selected && <MeetingSheet m={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
