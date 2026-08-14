"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { track } from "@vercel/analytics";
import { fellowshipColor, fellowshipName } from "@/lib/fellowships";
import { Link } from "@/i18n/navigation";
import { Icon } from "./Icon";
import { Mark } from "./Mark";
import { Loader } from "./Loader";
import { MeetingSheet } from "./Finder";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}
function timeMin(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
// How many days from today (0..6) a weekly meeting's day is — used to order results
// chronologically starting from today, then group them under day headers.
function dayOffset(day: number, today: number) {
  return (((day - today) % 7) + 7) % 7;
}
// Always name the weekday so a day the person explicitly asked for is confirmed (e.g. searching
// "Wednesday" shouldn't just say "Tomorrow"); keep the friendly relative cue for today/tomorrow.
const DAYS_FULL_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function dayLabel(offset: number, day: number, es: boolean) {
  const name = (es ? DAYS_FULL_ES : DAYS_FULL)[day];
  if (es) return offset === 0 ? `Hoy · ${name}` : offset === 1 ? `Mañana · ${name}` : name;
  return offset === 0 ? `Today · ${name}` : offset === 1 ? `Tomorrow · ${name}` : name;
}
// Sort meetings by (days-from-today, time), then split into contiguous day groups.
function groupByDay(list: Meeting[]) {
  const today = new Date().getDay();
  const sorted = [...list].sort((a, b) => {
    const d = dayOffset(a.day, today) - dayOffset(b.day, today);
    return d !== 0 ? d : timeMin(a.time) - timeMin(b.time);
  });
  const groups: { offset: number; day: number; items: Meeting[] }[] = [];
  for (const m of sorted) {
    const off = dayOffset(m.day, today);
    let g = groups.find((x) => x.offset === off);
    if (!g) { g = { offset: off, day: m.day, items: [] }; groups.push(g); }
    g.items.push(m);
  }
  return { sorted, groups };
}

type Meeting = { id: string; name: string; fellowship: string; day: number; time: string; place: string; address: string; online: boolean; lat: number | null; lng: number | null; conference_url?: string; conference_phone?: string; website?: string; updated?: string; end?: string; types?: string[]; notes?: string; transit_json?: string; parking_json?: string };
type WebSearch = { query: string; url: string; official?: { label: string; url: string } };
type Msg = { role: "user" | "assistant"; content: string; meetings?: Meeting[]; webSearch?: WebSearch; fellowships?: string[] };
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
  const es = useLocale() === "es";
  const [editing, setEditing] = useState(false);
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setErr(es ? "Ingresa un código postal de 5 dígitos" : "Enter a 5-digit ZIP"); return; }
    setBusy(true); setErr("");
    const p = await zipToPlace(zip);
    if (p) { onSet(p); setEditing(false); setZip(""); } else setErr(es ? "Código postal no encontrado" : "ZIP not found");
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
        <input inputMode="numeric" maxLength={5} autoFocus aria-label={es ? "Código postal" : "ZIP code"} placeholder={es ? "Código postal" : "ZIP code"}
          value={zip} onChange={(e) => setZip(e.currentTarget.value.replace(/\D/g, ""))} />
        <button className="btn btn-soft" type="submit" disabled={busy}>{busy ? <Loader size={18} label={es ? "Buscando código postal" : "Looking up ZIP"} /> : (es ? "Ir" : "Go")}</button>
        <button type="button" className="loc-link" onClick={useMe}><Icon name="nearme" size={14} /> {es ? "Usar mi ubicación" : "Use my location"}</button>
        <button type="button" className="loc-link" onClick={() => { setEditing(false); setErr(""); }}>Cancel</button>
        {err && <span className="loc-err" role="alert">{err}</span>}
      </form>
    );
  }
  return (
    <button className="loc-btn" onClick={() => setEditing(true)} aria-label={place ? `${es ? "Ubicación" : "Location"}: ${place.label}` : (es ? "Indica tu ubicación" : "Set your location")}>
      <Icon name="pin" size={16} />
      {place ? <span>{es ? "Cerca de" : "Near"} <b>{place.label}</b></span> : <span>{es ? "Indica tu ubicación" : "Set your location"}</span>}
      <Icon name="chevron" size={16} className="loc-caret" />
    </button>
  );
}

// Every starter maps to a fellowship Fellow actually indexes and shows off a different
// capability: time-of-day, natural-language need → the right fellowship, online-only, and
// non-12-step breadth. Each carries its fellowship's color as a dot. `code` drives that color.
// Never add a starter for something we don't have meetings for (e.g. gambling).
const SUGGESTIONS: { text: string; code: string }[] = [
  { text: "AA meeting tonight near me", code: "AA" },
  { text: "My partner's drinking is a problem", code: "Al-Anon" },
  { text: "Online NA meeting tomorrow morning", code: "NA" },
  { text: "A meditation-based recovery meeting", code: "RD" },
];

// Contextual one-tap refinements shown under the latest results.
const REFINE = ["Only online", "Tomorrow instead", "Wider area", "In the morning"];

// Spanish variants (Phase 0 Ask Fellow i18n) — shown when the browser language is Spanish. The
// assistant itself replies in whatever language the person writes (see the route's system prompt).
const SUGGESTIONS_ES: { text: string; code: string }[] = [
  { text: "Reunión de AA esta noche cerca de mí", code: "AA" },
  { text: "La bebida de mi pareja es un problema", code: "Al-Anon" },
  { text: "Reunión de NA en línea mañana por la mañana", code: "NA" },
  { text: "Una reunión de recuperación con meditación", code: "RD" },
];
const REFINE_ES = ["Solo en línea", "Mejor mañana", "Área más amplia", "Por la mañana"];
function ChatCard({ m, onOpen }: { m: Meeting; onOpen: (m: Meeting) => void }) {
  const es = useLocale() === "es";
  return (
    <button className="chat-card" style={{ ["--fc" as any]: fellowshipColor(m.fellowship) }}
      onClick={() => onOpen(m)} aria-label={`${m.name} details`}>
      <span className="cc-badge">{m.fellowship}</span>
      <span className="cc-body">
        <span className="cc-name">{m.name}</span>
        <span className="cc-meta">{DAYS[m.day]} · {to12(m.time)} · {m.online ? (es ? "En línea" : "Online") : m.place || m.address}</span>
      </span>
      <Icon name="chevron" size={18} className="cc-chev" />
    </button>
  );
}

// Results block: meetings grouped under day headers (Today / Tomorrow / weekday), sorted
// chronologically from today. Collapsed to the first 3 with a "View all" expander so the
// first reply stays scannable; expanding reveals the rest, still grouped.
function MeetingResults({ list, onOpen }: { list: Meeting[]; onOpen: (m: Meeting) => void }) {
  const es = useLocale() === "es";
  const [expanded, setExpanded] = useState(false);
  const { sorted } = groupByDay(list);
  const shown = expanded ? sorted : sorted.slice(0, 3);
  const groups = groupByDay(shown).groups;
  const hasMore = sorted.length > 3;
  return (
    <div className="chat-results">
      {groups.map((g) => (
        <div key={g.offset} className="chat-daygroup">
          <div className="chat-day">{dayLabel(g.offset, g.day, es)}</div>
          <div className="chat-cards">
            {g.items.map((mt) => <ChatCard key={mt.id} m={mt} onOpen={onOpen} />)}
          </div>
        </div>
      ))}
      {hasMore && (
        <button className="chat-viewall" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? (es ? "Ver menos" : "Show fewer") : (es ? `Ver las ${sorted.length} reuniones` : `View all ${sorted.length} meetings`)}
          <Icon name="chevron" size={16} className={`va-caret${expanded ? " va-up" : ""}`} />
        </button>
      )}
    </div>
  );
}

// sessionStorage key for the in-tab conversation (ephemeral — cleared on tab close or "New chat").
const CHAT_STORE_KEY = "fellow-chat";

export default function Chat({ onSwitchToSearch }: { onSwitchToSearch?: () => void }) {
  const es = useLocale() === "es";
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore an in-progress conversation within the same browser tab. sessionStorage ONLY — it is
  // never sent anywhere and is erased when the tab closes, so continuation (pop out to a fellowship
  // page, come back) doesn't compromise Fellow's no-tracking promise. Runs once on mount; the
  // `hydrated` gate below keeps SSR and the first client render identical (both empty) to avoid a
  // hydration mismatch, then swaps in the restored thread.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHAT_STORE_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setMsgs(parsed); }
    } catch {}
    setHydrated(true);
  }, []);
  // Persist after hydration; an empty thread (fresh or cleared) removes the store entirely.
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (msgs.length) sessionStorage.setItem(CHAT_STORE_KEY, JSON.stringify(msgs));
      else sessionStorage.removeItem(CHAT_STORE_KEY);
    } catch {}
  }, [msgs, hydrated]);
  // Clear the conversation on demand (also wipes the stored copy).
  function newChat() {
    setMsgs([]); setErr(""); setInput("");
    try { sessionStorage.removeItem(CHAT_STORE_KEY); } catch {}
    inputRef.current?.focus();
  }

  // Auto-grow the composer: reset to one line, then grow to fit up to ~5 lines. Runs on every
  // input change (typing, voice fill, or clearing after send).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

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

  // Time-of-day framing, shared by the greeting salute, the count window, and its wording, so
  // "Good evening" always lines up with "tonight" and a count of tonight's meetings.
  const hour = new Date().getHours();
  const salute = es
    ? (hour < 12 ? "Buenos días" : hour < 17 ? "Buenas tardes" : "Buenas noches")
    : (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  const win = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "tonight";
  const winWord = es
    ? (win === "morning" ? "esta mañana" : win === "afternoon" ? "esta tarde" : "esta noche")
    : (win === "morning" ? "this morning" : win === "afternoon" ? "this afternoon" : "tonight");

  // Once we know the user's area, count meetings near them in the current window for the welcome.
  // Keyed on coordinates so the label-refinement re-render doesn't re-fetch.
  useEffect(() => {
    if (!place) { setNearbyCount(null); return; }
    let cancelled = false;
    fetch(`/api/nearby-count?lat=${place.lat}&lng=${place.lng}&day=${new Date().getDay()}&window=${win}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setNearbyCount(typeof d.count === "number" ? d.count : null); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.lat, place?.lng]);

  // When we have a location and a live count, lead with it (specific to the time of day);
  // otherwise a warm, still-personal fallback. Never shows a "0" — uses the support line instead.
  const near = place?.label && place.label !== "your area" ? place.label : (es ? "ti" : "you");
  const greeting = es
    ? (place && nearbyCount != null && nearbyCount > 0
        ? `${salute} 👋 Hay ${nearbyCount.toLocaleString()} reunion${nearbyCount === 1 ? "" : "es"} cerca de ${near} ${winWord} — aquí tienes algunas formas de empezar:`
        : place
          ? `${salute} 👋 Puedo ayudarte a encontrar una reunión cerca de ${near} o el tipo de apoyo adecuado — aquí tienes algunas formas de empezar:`
          : `${salute} 👋 Puedo ayudarte a encontrar una reunión o el tipo de apoyo adecuado — ¿qué estás buscando?`)
    : (place && nearbyCount != null && nearbyCount > 0
        ? `${salute}! 👋 There ${nearbyCount === 1 ? "is" : "are"} ${nearbyCount.toLocaleString()} meeting${nearbyCount === 1 ? "" : "s"} near ${near} ${winWord} — here are a few ways to start:`
        : place
          ? `${salute}! 👋 I can help you find a meeting near ${near} or the right kind of support — here are a few ways to start:`
          : `${salute}! 👋 I can help you find a meeting or the right kind of support — what are you looking for?`);

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
      if (!r.ok) { setErr(d?.error || (es ? "Perdona — algo falló de mi lado. ¿Lo intentas de nuevo?" : "Sorry — something went wrong on my end. Mind trying that again?")); setBusy(false); return; }
      setMsgs((cur) => [...cur, { role: "assistant", content: d.reply || "", meetings: d.meetings || [], webSearch: d.webSearch, fellowships: d.fellowships || [] }]);
    } catch {
      setErr(es ? "No pude conectar con Fellow ahora mismo. Revisa tu conexión e inténtalo otra vez — o usa la búsqueda clásica abajo." : "I couldn’t reach Fellow just now. Check your connection and try once more — or use classic Search below.");
    } finally {
      setBusy(false);
    }
  }

  const lastAssistantIdx = msgs.reduce((acc, m, i) => (m.role === "assistant" ? i : acc), -1);

  return (
    <div className="chat-wrap">
      <div className="chat-loc">
        <LocationBar place={place} onSet={setPlace} />
        {msgs.length > 0 && (
          <button type="button" className="chat-new" onClick={newChat} aria-label={es ? "Empezar una conversación nueva" : "Start a new chat"}>
            <Icon name="add" size={16} /> {es ? "Nueva" : "New chat"}
          </button>
        )}
      </div>
      <div className="chat-thread" ref={threadRef} role="log" aria-live="polite" aria-label="Conversation">
        {hydrated && msgs.length === 0 && (
          <div className="chat-intro">
            <div className="chat-greet">
              <span className="chat-ava" aria-hidden><Mark size={54} /></span>
              <div className="bubble chat-greet-bubble">{greeting}</div>
            </div>
            <p className="chat-try">{es ? "Prueba una de estas" : "Try one of these"}</p>
            <div className="chat-suggest">
              {(es ? SUGGESTIONS_ES : SUGGESTIONS).map((s) => (
                <button key={s.text} className="chip" onClick={() => send(s.text)}>
                  <span className="sug-dot" style={{ background: fellowshipColor(s.code) }} aria-hidden />
                  {s.text}
                </button>
              ))}
              {/* Catch-all last chip: the problem-first "which support group?" question, handled
                  IN-CHAT (the bot guides them from what they're facing → the right fellowship).
                  No fellowship dot — it's the "not sure where to start" entry. We still fire a
                  custom analytics event so this funnel entry stays measurable. */}
              <button
                className="chip chip-nav"
                onClick={() => {
                  track("support_groups_chip", { locale: es ? "es" : "en" });
                  send(es ? "¿Qué grupo de apoyo es adecuado para mí?" : "Which support group is right for me?");
                }}
              >
                {es ? "¿Qué grupo de apoyo es adecuado para mí?" : "Which support group is right for me?"}
              </button>
            </div>
            <p className="chat-fine">{es ? "Fellow es independiente y no está afiliado a ninguna comunidad. Encuentra reuniones — no sustituye la ayuda profesional." : "Fellow is independent and not affiliated with any fellowship. It finds meetings — it isn’t a substitute for professional help."}</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {/* Discovery flow: when the bot routes to 2+ fellowships, lead with tappable chips to
                each one's page (/[fellowship]) so people can read about the options it named. */}
            {m.role === "assistant" && m.fellowships && m.fellowships.length >= 2 && (
              <div className="chat-fellows">
                <span className="chat-fellows-label">{es ? "Grupos que podrían encajar" : "Groups that might fit"}</span>
                <div className="chat-fellows-chips">
                  {m.fellowships.map((code) => (
                    <Link key={code} href={`/${code.toLowerCase()}`} className="chip chat-fellow-chip"
                      onClick={() => track("fellowship_suggestion", { code })}>
                      <span className="sug-dot" style={{ background: fellowshipColor(code) }} aria-hidden />
                      {fellowshipName(code)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {m.content && <div className="bubble">{m.content}</div>}
            {m.meetings && m.meetings.length > 0 && (
              <MeetingResults list={m.meetings} onOpen={setSelected} />
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
                  <span>{es ? "Buscar en la web" : "Search the web for"} “{m.webSearch.query}”</span>
                  <Icon name="external" size={15} className="wf-ext" />
                </a>
              </div>
            )}
            {i === lastAssistantIdx && m.meetings && m.meetings.length > 0 && !busy && (
              <div className="chat-followups" aria-label="Refine these results">
                {(es ? REFINE_ES : REFINE).map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg assistant"><div className="bubble bubble-thinking"><Loader size={30} label={es ? "Fellow está buscando" : "Fellow is searching"} /></div></div>}
        {err && (
          <div className="chat-err" role="alert">
            {err}
            {onSwitchToSearch && (
              <button className="btn btn-soft chat-err-switch" onClick={onSwitchToSearch}>
                <Icon name="search" size={16} /> {es ? "Usar la búsqueda clásica" : "Use classic Search"}
              </button>
            )}
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="chatq" style={{ position: "absolute", left: -9999 }}>Message</label>
        <textarea id="chatq" ref={inputRef} rows={1} value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={listening ? (es ? "Escuchando…" : "Listening…") : (es ? "Cuéntame qué necesitas…" : "Tell me what you need…")} autoComplete="off" />
        {speechSupported && (
          <button type="button" className={`btn btn-soft chat-mic${listening ? " mic-on" : ""}`}
            onClick={toggleVoice} aria-pressed={listening} aria-label={listening ? "Stop voice input" : "Speak your request"}>
            <Icon name="mic" size={18} />
          </button>
        )}
        <button className="btn btn-fc" type="submit" disabled={busy || !input.trim()} style={{ ["--fc" as any]: "var(--action)" }} aria-label="Send">
          <Icon name="nearme" size={18} />
        </button>
      </form>
      {selected && <MeetingSheet m={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
