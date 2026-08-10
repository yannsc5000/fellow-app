"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  InstantSearch, Configure, useSearchBox, useRefinementList, useHits, useInstantSearch, useClearRefinements, useStats,
} from "react-instantsearch";
import dynamic from "next/dynamic";
import { searchClient } from "@/lib/typesense";
import { COLLECTION } from "@/lib/schema";
import { fellowshipName, fellowshipColor } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { CONTACT_EMAIL } from "@/lib/config";
import { parseQuery, type Parsed } from "@/lib/parseQuery";
import { Icon } from "./Icon";
import { Loader } from "./Loader";
import { ErrorBoundary } from "./ErrorBoundary";
import { DetailMap } from "./DetailMap";

// MapLibre is heavy — only load its chunk when the map view is opened.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="map-wrap map-wrap--loading" aria-busy="true" aria-label="Loading map…">
      <Loader size={44} label="Loading map" />
    </div>
  ),
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  let [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12;
  return { hh: `${h}:${String(m).padStart(2, "0")}`, ap };
}

// ---- Add-to-calendar (weekly recurring Google Calendar event) ----
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const pad2 = (n: number) => String(n).padStart(2, "0");
function nextOccurrence(day: number, hh: number, mm: number) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  let diff = (day - d.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() < now.getTime()) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}
const fmtCal = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
function calendarUrl(m: any) {
  const [hh, mm] = String(m.time).split(":").map(Number);
  const start = nextOccurrence(m.day, hh || 0, mm || 0);
  let end: Date;
  if (m.end && /^\d{1,2}:\d{2}/.test(m.end)) {
    const [eh, em] = String(m.end).split(":").map(Number);
    end = new Date(start); end.setHours(eh, em, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);
  } else { end = new Date(start.getTime() + 60 * 60000); }
  const loc = m.online ? (m.conference_url || "Online meeting") : [m.place, m.address].filter(Boolean).join(", ");
  const details = [m.notes, "Recurring weekly · shared via Fellow"].filter(Boolean).join("\n\n");
  const p = new URLSearchParams({ action: "TEMPLATE", text: m.name || "Meeting", dates: `${fmtCal(start)}/${fmtCal(end)}`, location: loc, details });
  return `https://calendar.google.com/calendar/render?${p.toString()}&recur=${encodeURIComponent("RRULE:FREQ=WEEKLY;BYDAY=" + BYDAY[m.day])}`;
}

// Freshness stamp from the source's "updated" string → "Mar 2024", or null if unparseable.
function fmtUpdated(s?: string): string | null {
  if (!s) return null;
  const d = new Date(String(s).replace(" ", "T"));
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat), dLng = r(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
// Only show a walking distance when we actually have the amenity's own coordinates
// (currently just real transit stations, e.g. WMATA). Everything else is a live Google
// Maps *search*, so we show its honest description — never a fabricated distance.
function accessSubtitle(p: any, m: any) {
  if (p.slat != null && p.slng != null && m.lat != null && m.lng != null) {
    const mi = haversineMi(m.lat, m.lng, p.slat, p.slng) * 1.25;
    const min = Math.max(1, Math.round(mi * 20));
    return `Approx walking distance: ${min} min · ${mi.toFixed(mi < 0.1 ? 2 : 1)} mi`;
  }
  return p.d || "Search on Google Maps";
}
const T_ICON: Record<string, string> = { metro: "subway", train: "subway", bus: "bus", bike: "bike", streetcar: "tram" };
const P_ICON: Record<string, string> = { garage: "parking", street: "route", zone: "signpost", free: "parking" };

// Named-color fallback; GTFS route_color (p.colors) is preferred and scales nationwide.
const LINE_COLORS: Record<string, string> = { red: "#e01933", orange: "#f7941d", blue: "#0076c0", silver: "#9aa0a6", green: "#00a94f", yellow: "#ffd200" };
function lineColorsFromLabel(t: string) {
  const after = t.split("·")[1] || "";
  return after.split(/[/,&+]/).map((s) => s.trim().toLowerCase()).map((k) => LINE_COLORS[k]).filter(Boolean);
}
function picoStyle(p: any): React.CSSProperties | undefined {
  if (!["metro", "train", "tram", "streetcar"].includes(p.k)) return undefined;
  const cols: string[] = p.colors?.length ? p.colors : lineColorsFromLabel(p.t || "");
  if (!cols.length) return undefined;
  const n = cols.length;
  const bg = n > 1
    ? `linear-gradient(135deg, ${cols.map((c, i) => `${c} ${Math.round((i / n) * 100)}% ${Math.round(((i + 1) / n) * 100)}%`).join(", ")})`
    : cols[0];
  const light = ["#ffd200", "#9aa0a6"].includes(cols[0]);
  return { background: bg, color: light ? "#1b1a17" : "#fff", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" };
}

function AccessItem({ p, m, iconName }: { p: any; m: any; iconName: string }) {
  const mode = p.k === "bike" ? "bicycling" : "walking";
  const dest = encodeURIComponent((m.place ? m.place + ", " : "") + m.address);
  const href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(p.q || p.t)}&destination=${dest}&travelmode=${mode}`;
  return (
    <a className="park-item" href={href} target="_blank" rel="noopener" aria-label={`Directions from ${p.t} to ${m.place || m.address}`}>
      <span className="pico" style={picoStyle(p)}><Icon name={iconName} size={20} /></span>
      <span><span className="pt">{p.t}</span><span className="pd">{accessSubtitle(p, m)}</span></span>
      <Icon name="chevron" size={20} className="chev" />
    </a>
  );
}

function SearchBox({ value, onChange, onClear, onSubmit }: {
  value: string; onChange: (v: string) => void; onClear: () => void; onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="searchbar" role="search">
      <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>Search meetings</label>
      <input ref={inputRef} id="q" type="search" placeholder="Try “Sunday morning AA” or “Boston”"
        value={value} onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { inputRef.current?.blur(); onSubmit(); } }} />
      {value && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={onClear}>
          <Icon name="close" size={18} />
        </button>
      )}
      <button className="btn btn-near" aria-label="Find meetings" onClick={() => { inputRef.current?.blur(); onSubmit(); }}>
        <Icon name="search" size={18} /> Find
      </button>
    </div>
  );
}

// Pushes the parsed free-text into InstantSearch's query. The visible input stays raw
// (what the user typed); this drives the actual search with the residual text.
function QueryDriver({ text }: { text: string }) {
  const { query, refine } = useSearchBox();
  useEffect(() => { if (query !== text) refine(text); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Toggle({ attribute, value, label }: { attribute: string; value: string; label: string }) {
  const { items, refine } = useRefinementList({ attribute });
  const on = items.some((i) => i.value === value && i.isRefined);
  return (
    <button className="chip" aria-pressed={on} onClick={() => refine(value)}>{label}</button>
  );
}

// Controlled day filter: reconciles the InstantSearch `day` refinement to exactly the set
// of days chosen by "Starts soon" / "Today" / "Tomorrow" (and any natural-language day).
// Because it uses the day facet (disjunctive), multiple days combine as OR — so selecting
// Starts soon + Today + Tomorrow broadens rather than conflicts.
function DaySync({ days }: { days: number[] }) {
  const { items, refine } = useRefinementList({ attribute: "day", limit: 20 });
  const want = [...new Set(days)].map(String).sort().join(",");
  useEffect(() => {
    const wantSet = new Set(want ? want.split(",") : []);
    const haveSet = new Set(items.filter((i) => i.isRefined).map((i) => i.value));
    wantSet.forEach((v) => { if (!haveSet.has(v)) refine(v); });
    haveSet.forEach((v) => { if (!wantSet.has(v)) refine(v); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want]);
  return null;
}

// Data-driven fellowship chips: "All" + every fellowship present in the index,
// alphabetical, labeled by acronym with the full name as the accessible label.
// Each carries its fellowship color (a dot when unselected, solid fill when active).
function FellowshipChips() {
  const { items, refine } = useRefinementList({ attribute: "fellowship", limit: 200, sortBy: ["name:asc"] });
  const { refine: clearFellowship } = useClearRefinements({ includedAttributes: ["fellowship"] });
  const anyRefined = items.some((i) => i.isRefined);
  return (
    <div className="filter-row" role="group" aria-label="Fellowship">
      <button className="chip" aria-pressed={!anyRefined} onClick={() => clearFellowship()}>All</button>
      {items.map((i) => (
        <button key={i.value} className="chip fchip" aria-pressed={i.isRefined}
          style={{ ["--fc" as any]: fellowshipColor(i.value) }}
          title={fellowshipName(i.value)} aria-label={fellowshipName(i.value)}
          onClick={() => refine(i.value)}><span className="cdot" />{i.value}</button>
      ))}
    </div>
  );
}

function Skeletons() {
  return (
    <ul className="cards" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="card card--skeleton">
          <span className="sk sk-time" />
          <span><span className="sk sk-line" /><span className="sk sk-line sk-short" /></span>
        </li>
      ))}
    </ul>
  );
}

// nearest real rail station for the card strip — only when we have precise station coords
function railItem(m: any) {
  if (m.online || !m.transit_json) return null;
  try {
    const t = JSON.parse(m.transit_json);
    return t.find((x: any) => ["metro", "train", "tram"].includes(x.k) && x.slat != null) || null;
  } catch { return null; }
}

// Is a meeting's start time within a minutes-since-midnight window? (client-side time filter)
function inWindow(m: any, w: { lo: number; hi: number }) {
  const [h, mm] = String(m.time).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return false;
  const mins = h * 60 + mm;
  return mins >= w.lo && mins <= w.hi;
}

// "Now" / "in Nm" label if this meeting is today and starts within [-20, +90] min.
function soonLabel(m: any): string | null {
  if (m == null || m.day == null || !m.time) return null;
  const now = new Date();
  if (m.day !== now.getDay()) return null;
  const [h, mm] = String(m.time).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  const diff = (h * 60 + mm) - (now.getHours() * 60 + now.getMinutes());
  if (diff > 90 || diff < -20) return null;
  return diff <= 0 ? "Now" : `in ${diff}m`;
}

// distance from the user to a hit (miles), or null if we can't compute it
function hitMiles(m: any, user: { lat: number; lng: number } | null) {
  if (!user || m.online) return null;
  const g = m._geoloc;
  const lat = m.lat ?? (Array.isArray(g) ? g[0] : g?.lat);
  const lng = m.lng ?? (Array.isArray(g) ? g[1] : g?.lng);
  if (lat == null || lng == null) return null;
  return haversineMi(user.lat, user.lng, lat, lng);
}

function Results({ onOpen, user, onClearLocation, startsSoon, timeWindow }: { onOpen: (m: any) => void; user: { lat: number; lng: number } | null; onClearLocation: () => void; startsSoon: boolean; timeWindow: { lo: number; hi: number } | null }) {
  const { items: rawItems } = useHits();
  const items = timeWindow ? rawItems.filter((m: any) => inWindow(m, timeWindow)) : rawItems;
  const { status, error } = useInstantSearch();
  const busy = status === "loading" || status === "stalled";

  if (error) {
    return (
      <div className="state" role="alert">
        <h2>Can’t reach the meeting service</h2>
        <p>Something went wrong loading meetings. Check your connection and try again.</p>
        <button className="btn btn-soft" onClick={() => location.reload()}>Retry</button>
      </div>
    );
  }
  if (busy && !items.length) return <Skeletons />;
  if (!items.length) {
    return (
      <div className="state">
        <h2>{startsSoon ? "Nothing starting right now" : "No meetings match"}</h2>
        <p>{startsSoon
          ? "No meetings start in the next 90 minutes here. Turn off “Starts soon” to see the full schedule, or check online meetings."
          : user ? "No meetings found within about 50 miles yet. Try widening your search or view online meetings." : "Try removing a filter, widening your search, or switching to online meetings."}</p>
        {user && !startsSoon && <button className="btn btn-soft" onClick={onClearLocation}>Search everywhere</button>}
      </div>
    );
  }
  return (
    <ul className="cards" aria-busy={busy}>
      {items.map((m: any) => {
        const t = to12(m.time);
        const mi = hitMiles(m, user);
        const rail = railItem(m);
        const lineColor = rail ? (rail.colors?.[0] || lineColorsFromLabel(rail.t)[0] || "#9aa0a6") : null;
        const soon = soonLabel(m);
        return (
          <li key={m.objectID} style={{ ["--fc" as any]: fellowshipColor(m.fellowship) }}>
            <button className="card" onClick={() => onOpen(m)}>
              <span className="timechip"><span className="hh">{t.hh}</span><span className="ap">{t.ap}</span></span>
              <span className="cardbody">
                <h3>{m.name}</h3>
                <span className="meta"><b>{DAYS[m.day]}</b> · {m.online ? "Online" : m.place || m.address}</span>
                <span className="tags">
                  <span className="tag fellow" title={fellowshipName(m.fellowship)}>{m.fellowship}</span>
                  {(m.types || []).slice(0, 3).map((x: string) => <span key={x} className="tag">{x}</span>)}
                </span>
              </span>
              <span className="rt">
                {soon && <span className={`soon${soon === "Now" ? " soon-now" : ""}`}>{soon}</span>}
                {m.online
                  ? <><Icon name="video" size={15} /> Online</>
                  : rail
                    ? <><span className="line" style={{ background: lineColor as string }} /> {rail.t}</>
                    : <><Icon name="subway" size={15} /> Transit nearby</>}
                <span className="dist">{m.online ? "" : mi != null ? `${mi.toFixed(1)} mi` : ""}</span>
                <Icon name="chevron" size={18} className="rt-chev" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type Place = { lat: number; lng: number; label: string } | null;
const AREA_RADIUS_M = 80467; // ~50 miles — "in your area"
const TODAY = new Date().getDay(); // 0=Sun..6=Sat

// ZIP → coordinates (keyless). Used by the location control and natural-language ZIP.
async function zipToPlace(zip: string): Promise<Place> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const d = await r.json();
    const pl = d.places[0];
    return { lat: Number(pl.latitude), lng: Number(pl.longitude), label: zip };
  } catch { return null; }
}

// City/place name → coordinates (keyless, Open-Meteo geocoding). Powers "aa in phoenix":
// the named place recenters the whole search instead of leaking into the text query.
async function geocodePlace(name: string): Promise<Place> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
    if (!r.ok) return null;
    const d = await r.json();
    const list: any[] = d?.results || [];
    if (!list.length) return null;
    const pick = list.find((x) => x.country_code === "US") || list[0];
    const label = pick.admin1 ? `${pick.name}, ${pick.admin1}` : pick.name;
    return { lat: Number(pick.latitude), lng: Number(pick.longitude), label };
  } catch { return null; }
}

// Applies the area filter. We filter to a radius around the chosen location for
// in-person browsing; online meetings are location-agnostic, so when "Online" is
// active we don't constrain by distance (the adapter also requires a radius whenever
// aroundLatLng is set, so this is the one Configure that owns geo).
function GeoConfigure({ place, wide, searching }: { place: Place; wide: boolean; searching: boolean }) {
  const { items } = useRefinementList({ attribute: "online" });
  const onlineOnly = items.some((i) => i.value === "true" && i.isRefined);
  // Only constrain to the "near me" radius while BROWSING. When the user is actively
  // searching free text (e.g. a city like "Boston"), drop the radius so the query finds
  // matches anywhere. Day filtering is handled by DaySync (facet, OR-combined); time-of-day
  // is applied client-side (Results/inWindow). Widen the page when a time window is active.
  const geo = place && !onlineOnly && !searching
    ? { aroundLatLng: `${place.lat},${place.lng}`, aroundRadius: AREA_RADIUS_M }
    : {};
  return <Configure hitsPerPage={wide ? 250 : 100} {...geo} />;
}

// The tappable location control: shows the current ZIP/area and lets people change it
// by typing a ZIP or using their device location.
function LocationControl({ place, onZip, onNearMe, onClear }:
  { place: Place; onZip: (p: Place) => void; onNearMe: () => void; onClear: () => void }) {
  const [editing, setEditing] = useState(false);
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setErr("Enter a 5-digit ZIP"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const pl = d.places[0];
      onZip({ lat: Number(pl.latitude), lng: Number(pl.longitude), label: zip });
      setEditing(false); setZip("");
    } catch { setErr("ZIP not found"); }
    finally { setBusy(false); }
  }

  if (editing) {
    return (
      <form className="loc-form" onSubmit={submit}>
        <input inputMode="numeric" maxLength={5} autoFocus aria-label="ZIP code" placeholder="ZIP code"
          value={zip} onChange={(e) => setZip(e.currentTarget.value.replace(/\D/g, ""))} />
        <button className="btn btn-soft" type="submit" disabled={busy}>{busy ? <Loader size={18} label="Looking up ZIP" /> : "Go"}</button>
        <button type="button" className="loc-link" onClick={() => { onNearMe(); setEditing(false); }}>
          <Icon name="nearme" size={14} /> Use my location
        </button>
        <button type="button" className="loc-link" onClick={() => { setEditing(false); setErr(""); }}>Cancel</button>
        {err && <span className="loc-err" role="alert">{err}</span>}
      </form>
    );
  }
  return (
    <button className="loc-btn" onClick={() => setEditing(true)}
      aria-label={place ? `Location: ${place.label}. Tap to change.` : "Set your location"}>
      <Icon name="pin" size={16} />
      {place ? <span>Near <b>{place.label}</b></span> : <span>Set your location</span>}
      <span className="loc-change">Change</span>
    </button>
  );
}

function ResultsCount({ place, startsSoon, timeWindow }: { place: Place; startsSoon: boolean; timeWindow: { lo: number; hi: number } | null }) {
  const { nbHits } = useStats();
  const { items } = useHits();
  const n = timeWindow ? items.filter((m: any) => inWindow(m, timeWindow)).length : nbHits;
  const suffix = startsSoon ? " starting soon" : place ? ` near ${place.label}` : "";
  return <div className="count-line" aria-live="polite">{n.toLocaleString()} meeting{n === 1 ? "" : "s"}{suffix}</div>;
}

export default function Finder() {
  const [view, setView] = useState<"list" | "map">("list"); // list default; Near me → map
  const [place, setPlace] = useState<Place>(null);
  const [selected, setSelected] = useState<any>(null);
  const [located, setLocated] = useState(false); // already tried device location?
  const [soon, setSoon] = useState(false);                 // "Starts soon" toggle
  const [dayToggles, setDayToggles] = useState<number[]>([]); // Today / Tomorrow toggles
  const toggleDay = (d: number) => setDayToggles((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  // Seed from ?q= so shared search links and the sitelinks search box land pre-filled.
  const [raw, setRaw] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : "");
  const parsed = useMemo(() => parseQuery(raw), [raw]);     // → filters + residual text
  // Keep the URL in sync with the query so any search is a copy-pasteable link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (raw.trim()) u.searchParams.set("q", raw); else u.searchParams.delete("q");
    window.history.replaceState(null, "", u.toString());
  }, [raw]);
  const [placeMiss, setPlaceMiss] = useState(false);        // a named place that didn't geocode
  const nearMeRef = useRef(false);

  // Best-effort, keyless reverse geocode so the button can show the user's ZIP.
  async function labelFor(lat: number, lng: number): Promise<string> {
    try {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const d = await r.json();
      return d.postcode || d.city || d.locality || "your area";
    } catch { return "your area"; }
  }
  async function useCoords(lat: number, lng: number, toMap: boolean) {
    setPlace({ lat, lng, label: "your area" });
    if (toMap) setView("map");
    const label = await labelFor(lat, lng);
    setPlace({ lat, lng, label });
  }
  function nearMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    // Stay in the current view (don't force Map) — just center results on the user.
    navigator.geolocation.getCurrentPosition((p) => useCoords(p.coords.latitude, p.coords.longitude, false));
  }
  // On first load, default results to the user's area (if they allow location).
  useEffect(() => {
    if (place || located || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocated(true);
    navigator.geolocation.getCurrentPosition(
      (p) => useCoords(p.coords.latitude, p.coords.longitude, false),
      () => {}, // denied/unavailable → stay national; they can set a ZIP
      { timeout: 8000, maximumAge: 600000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Natural-language "near me" in the query → use device location (once per phrase).
  useEffect(() => {
    if (parsed.nearMe && !nearMeRef.current) { nearMeRef.current = true; nearMe(); }
    if (!parsed.nearMe) nearMeRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.nearMe]);
  // Natural-language ZIP in the query → center on that ZIP.
  useEffect(() => {
    if (!parsed.zip) return;
    let cancelled = false;
    zipToPlace(parsed.zip).then((p) => { if (!cancelled && p) setPlace(p); });
    return () => { cancelled = true; };
  }, [parsed.zip]);
  // Natural-language city ("aa in phoenix") → geocode the place and recenter the search on
  // it (updates the location control + count). If it doesn't resolve, fall back to a plain
  // text search that still includes the place word.
  useEffect(() => {
    if (!parsed.place) { setPlaceMiss(false); return; }
    let cancelled = false;
    setPlaceMiss(false);
    geocodePlace(parsed.place).then((p) => {
      if (cancelled) return;
      if (p) setPlace(p); else setPlaceMiss(true);
    });
    return () => { cancelled = true; };
  }, [parsed.place]);

  const user = place ? { lat: place.lat, lng: place.lng } : null;
  // A successfully geocoded place means we've recentered on it — keep the radius so results
  // are AROUND that city. If geocoding missed, re-append the place word to the text query.
  const placeActive = !!parsed.place && !placeMiss;
  const queryText = parsed.place && placeMiss ? `${parsed.text} ${parsed.place}`.trim() : parsed.text;
  // Drop the "near me" radius only when searching a DIFFERENT place by free text. If the user
  // said "near me", or we recentered on a named city, keep the radius.
  const searching = !!queryText.trim() && !parsed.nearMe && !placeActive;
  const nowD = new Date();
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  // "When" is an OR of everything selected: Starts soon (→ today), Today, Tomorrow, and any
  // day parsed from the query. The soon *time window* only applies when Starts soon is the
  // ONLY thing chosen — otherwise the day chips broaden the results (union), not conflict.
  const days = [...new Set([...dayToggles, ...(parsed.day != null ? [parsed.day] : []), ...(soon ? [TODAY] : [])])];
  const soleSoon = soon && dayToggles.length === 0 && parsed.day == null;
  const timeWindow = soleSoon ? { lo: nowMin - 20, hi: nowMin + 90 } : parsed.window;
  const wide = !!timeWindow;

  return (
    <InstantSearch searchClient={searchClient} indexName={COLLECTION} future={{ preserveSharedStateOnUnmount: true }}>
      <GeoConfigure place={place} wide={wide} searching={searching} />
      <QueryDriver text={queryText} />
      <DaySync days={days} />
      <SearchBox value={raw} onChange={setRaw} onClear={() => setRaw("")} onSubmit={() => { if (!raw.trim()) nearMe(); }} />
      {parsed.labels.length > 0 && (
        <div className="parse-hint">
          <Icon name="search" size={13} /> Reading: {parsed.labels.join(" · ")}{parsed.text ? ` · “${parsed.text}”` : ""}
        </div>
      )}

      <FellowshipChips />
      <div className="filter-row" role="group" aria-label="Day, type and format">
        <button className="chip chip-soon" aria-pressed={soon} onClick={() => setSoon((v) => !v)}>
          <span className="livedot" aria-hidden="true" /> Starts soon
        </button>
        <button className="chip" aria-pressed={dayToggles.includes(TODAY)} onClick={() => toggleDay(TODAY)}>Today</button>
        <button className="chip" aria-pressed={dayToggles.includes((TODAY + 1) % 7)} onClick={() => toggleDay((TODAY + 1) % 7)}>Tomorrow</button>
        <Toggle attribute="types" value="Open" label="Open" />
        <Toggle attribute="types" value="Wheelchair" label="Accessible" />
        <Toggle attribute="online" value="true" label="Online" />
      </div>

      <ResultsCount place={place} startsSoon={soleSoon} timeWindow={timeWindow} />
      <div className="results-head">
        <LocationControl place={place} onZip={setPlace} onNearMe={nearMe} onClear={() => setPlace(null)} />
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>Map</button>
        </div>
      </div>

      {view === "list" ? (
        <Results onOpen={setSelected} user={user} onClearLocation={() => setPlace(null)} startsSoon={soleSoon} timeWindow={timeWindow} />
      ) : (
        <ErrorBoundary fallback={<div className="state"><h2>Map unavailable</h2><p>Switch back to List, or reload. (If this persists, the map key may be missing.)</p></div>}>
          <MapView onOpen={setSelected} />
        </ErrorBoundary>
      )}

      {selected && <MeetingSheet m={selected} onClose={() => setSelected(null)} onSeeAll={setRaw} />}
    </InstantSearch>
  );
}

export function MeetingSheet({ m, onClose, onSeeAll }: { m: any; onClose: () => void; onSeeAll?: (q: string) => void }) {
  const t = to12(m.time);
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // A11y: move focus into the dialog on open and close it with Escape.
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function share() {
    const when = `${DAYS[m.day]} ${t.hh} ${t.ap}`;
    const loc = m.online ? (m.conference_url || "Online meeting") : [m.place, m.address].filter(Boolean).join(", ");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `${m.name} — ${when}\n${loc}${m.online ? "" : "\n" + mapsAddr}\n\nvia Fellow ${url}`.trim();
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: m.name, text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true); setTimeout(() => setCopied(false), 1800);
      }
    } catch { /* user cancelled share — ignore */ }
  }
  const transit = m.transit_json ? JSON.parse(m.transit_json) : [];
  const parking = m.parking_json ? JSON.parse(m.parking_json) : [];
  const mapsAddr = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((m.place ? m.place + ", " : "") + m.address)}`;
  const correctionBody = `Meeting: ${m.name}\nWhen: ${DAYS[m.day]} ${t.hh} ${t.ap}\n${m.online ? "Online meeting" : [m.place, m.address].filter(Boolean).join(", ")}\nFellowship: ${m.fellowship}\n\nWhat needs fixing?\n`;
  const correctionHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Fellow correction: " + m.name)}&body=${encodeURIComponent(correctionBody)}`;
  const seeAll = (q: string) => { onSeeAll?.(q); onClose(); };
  // A guaranteed "learn more" target so the sheet is never a dead end: the group's own
  // page if we have it, else the fellowship's official directory, else a web search.
  const finder = officialFinder(m.fellowship);
  const webSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${m.name} ${fellowshipName(m.fellowship)} meeting`)}`;
  const learnMoreUrl = m.website || finder?.url || webSearchUrl;
  return (
    <div role="dialog" aria-modal aria-label={m.name} className="sheet-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-panel" ref={panelRef} tabIndex={-1} style={{ ["--fc" as any]: fellowshipColor(m.fellowship), outline: "none" }}>
        <div className="sheet-top">
          <button className="share-btn" onClick={share} aria-label={`Share ${m.name}`}>
            <Icon name="share" size={18} /> {copied ? "Copied!" : "Share"}
          </button>
          <button className="close-x" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <h2>{m.name}</h2>

        <div className="sheet-facts">
          <a className="fact fact-when" href={calendarUrl(m)} target="_blank" rel="noopener" aria-label={`Add ${m.name} to your calendar`}>
            <span className="fact-ico"><Icon name="calmonth" size={18} /></span>
            <span className="fact-body">
              <span className="fact-main">{FULL_DAYS[m.day]}, {t.hh} {t.ap}</span>
              <span className="fact-sub">Add to calendar</span>
            </span>
            <Icon name="add" size={16} className="fact-add" />
          </a>
          <div className="fact">
            <span className="fact-ico"><Icon name={m.online ? "video" : "pin"} size={18} /></span>
            <span className="fact-body">
              {m.online
                ? <span className="fact-main">Online meeting</span>
                : m.place
                  ? <>
                      <span className="fact-main">{m.place}</span>
                      <a className="fact-sub fact-link" href={mapsAddr} target="_blank" rel="noopener">{m.address}</a>
                    </>
                  : <a className="fact-main fact-link" href={mapsAddr} target="_blank" rel="noopener">{m.address}</a>}
            </span>
          </div>
        </div>

        <div className="sheet-tags">
          <span className="tag tag-fellow" title={fellowshipName(m.fellowship)}>{m.fellowship}</span>
          {(m.types || []).map((x: string) => <span key={x} className="tag">{x}</span>)}
          {fmtUpdated(m.updated) && <span className="freshness" title="When the source last updated this listing">Updated {fmtUpdated(m.updated)}</span>}
        </div>
        {m.notes && (
          <>
            <hr className="sheet-divider" />
            <div className="sheet-notes">
              <p className="notes-label">Meeting notes</p>
              <p className="notes-text">{m.notes}</p>
            </div>
          </>
        )}

        {(m.conference_phone || m.website || finder || onSeeAll) && (
          <>
            <hr className="sheet-divider" />
            {(m.conference_phone || m.website || finder) && (
              <div className="detail-contact-row">
                {m.conference_phone && (
                  <a className="detail-contact" href={`tel:${String(m.conference_phone).replace(/[^+\d,;]/g, "")}`}>
                    Call in: {m.conference_phone}
                  </a>
                )}
                {m.website && (
                  <a className="detail-contact" href={m.website} target="_blank" rel="noopener">
                    <Icon name="external" size={15} /> Group website
                  </a>
                )}
                {finder && (
                  <a className="detail-contact" href={finder.url} target="_blank" rel="noopener">
                    <Icon name="external" size={15} /> {finder.label}
                  </a>
                )}
              </div>
            )}
            {onSeeAll && (
              <div className="detail-links">
                <button className="tlink" onClick={() => seeAll(m.name)}>
                  <Icon name="calmonth" size={16} /> All sessions of this group
                </button>
                {!m.online && m.place && (
                  <button className="tlink" onClick={() => seeAll(m.place)}>
                    <Icon name="pin" size={16} /> All sessions at this location
                  </button>
                )}
              </div>
            )}
          </>
        )}
        <details className="expect">
          <summary>New here? What to expect</summary>
          <p>
            Most meetings are free and anonymous — first names only. You can simply listen;
            you’re never required to speak or share. “Open” meetings welcome anyone (including
            visitors and family), while “Closed” meetings are for people who identify with the
            fellowship. Arriving a few minutes early is a nice way to be welcomed.
          </p>
        </details>
        {!m.online && <DetailMap m={m} defaultMode="map" />}
        {!m.online && (transit.length > 0 || parking.length > 0) && (
          <div className="access-grid">
            {transit.length > 0 && (
              <div className="access-col">
                <h4><Icon name="subway" size={18} /> Public transportation</h4>
                <div className="park-list">{transit.map((p: any, i: number) => (
                  <AccessItem key={i} p={p} m={m} iconName={T_ICON[p.k] || "pin"} />
                ))}</div>
              </div>
            )}
            {parking.length > 0 && (
              <div className="access-col">
                <h4><Icon name="parking" size={18} /> Parking</h4>
                <div className="park-list">{parking.map((p: any, i: number) => (
                  <AccessItem key={i} p={p} m={m} iconName={P_ICON[p.k] || "parking"} />
                ))}</div>
              </div>
            )}
          </div>
        )}
        <div className="sheet-actions">
          {m.online
            ? (m.conference_url
                ? <a className="btn btn-fc" href={m.conference_url} target="_blank" rel="noopener"><Icon name="video" size={18} /> Join online</a>
                : <a className="btn btn-fc" href={learnMoreUrl} target="_blank" rel="noopener"><Icon name="search" size={18} /> Find this meeting online</a>)
            : <a className="btn btn-fc" href={mapsAddr} target="_blank" rel="noopener"><Icon name="route" size={18} /> Directions</a>}
          <button className="btn btn-soft" onClick={onClose}><Icon name="close" size={18} /> Close</button>
        </div>
        <a className="report-link" href={correctionHref}>
          <Icon name="signpost" size={15} /> Something look wrong? Suggest a correction
        </a>
      </div>
    </div>
  );
}
