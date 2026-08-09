"use client";
import { useState, useEffect, useRef } from "react";
import {
  InstantSearch, Configure, useSearchBox, useRefinementList, useHits, useInstantSearch, useClearRefinements,
} from "react-instantsearch";
import dynamic from "next/dynamic";
import { searchClient } from "@/lib/typesense";
import { COLLECTION } from "@/lib/schema";
import { fellowshipName, fellowshipColor } from "@/lib/fellowships";
import { Icon } from "./Icon";
import { ErrorBoundary } from "./ErrorBoundary";
import { DetailMap } from "./DetailMap";

// MapLibre is heavy — only load its chunk when the map view is opened.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-wrap" aria-busy="true" aria-label="Loading map…" />,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  const loc = m.online ? "Online meeting" : [m.place, m.address].filter(Boolean).join(", ");
  const details = [m.notes, "Recurring weekly · shared via Fellow"].filter(Boolean).join("\n\n");
  const p = new URLSearchParams({ action: "TEMPLATE", text: m.name || "Meeting", dates: `${fmtCal(start)}/${fmtCal(end)}`, location: loc, details });
  return `https://calendar.google.com/calendar/render?${p.toString()}&recur=${encodeURIComponent("RRULE:FREQ=WEEKLY;BYDAY=" + BYDAY[m.day])}`;
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

function SearchBox({ onNearMe }: { onNearMe: () => void }) {
  const { query, refine } = useSearchBox();
  return (
    <div className="searchbar" role="search">
      <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>Search meetings</label>
      <input id="q" type="search" placeholder="Search meetings, places, or ZIP"
        value={query} onChange={(e) => refine(e.currentTarget.value)} />
      {query && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={() => refine("")}>
          <Icon name="close" size={18} />
        </button>
      )}
      <button className="btn btn-near" onClick={onNearMe}><Icon name="nearme" size={18} /> Near me</button>
    </div>
  );
}

function Toggle({ attribute, value, label }: { attribute: string; value: string; label: string }) {
  const { items, refine } = useRefinementList({ attribute });
  const on = items.some((i) => i.value === value && i.isRefined);
  return (
    <button className="chip" aria-pressed={on} onClick={() => refine(value)}>{label}</button>
  );
}

// Quick day filter (Today / Tomorrow). day is stored 0=Sun..6=Sat.
function DayChip({ day, label }: { day: number; label: string }) {
  const { items, refine } = useRefinementList({ attribute: "day", limit: 20 });
  const val = String(day);
  const on = items.some((i) => i.value === val && i.isRefined);
  return <button className="chip" aria-pressed={on} onClick={() => refine(val)}>{label}</button>;
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

// distance from the user to a hit (miles), or null if we can't compute it
function hitMiles(m: any, user: { lat: number; lng: number } | null) {
  if (!user || m.online) return null;
  const g = m._geoloc;
  const lat = m.lat ?? (Array.isArray(g) ? g[0] : g?.lat);
  const lng = m.lng ?? (Array.isArray(g) ? g[1] : g?.lng);
  if (lat == null || lng == null) return null;
  return haversineMi(user.lat, user.lng, lat, lng);
}

function Results({ onOpen, user, onClearLocation }: { onOpen: (m: any) => void; user: { lat: number; lng: number } | null; onClearLocation: () => void }) {
  const { items } = useHits();
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
        <h2>No meetings match</h2>
        <p>{user ? "No meetings found within about 50 miles yet. Try widening your search or view online meetings." : "Try removing a filter, widening your search, or switching to online meetings."}</p>
        {user && <button className="btn btn-soft" onClick={onClearLocation}>Search everywhere</button>}
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
                {m.online
                  ? <><Icon name="video" size={15} /> Online</>
                  : rail
                    ? <><span className="line" style={{ background: lineColor as string }} /> {rail.t}</>
                    : <><Icon name="subway" size={15} /> Transit nearby</>}
                <span className="dist">{m.online ? "" : mi != null ? `${mi.toFixed(1)} mi` : ""}</span>
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

// Applies the area filter. We filter to a radius around the chosen location for
// in-person browsing; online meetings are location-agnostic, so when "Online" is
// active we don't constrain by distance (the adapter also requires a radius whenever
// aroundLatLng is set, so this is the one Configure that owns geo).
function GeoConfigure({ place }: { place: Place }) {
  const { items } = useRefinementList({ attribute: "online" });
  const onlineOnly = items.some((i) => i.value === "true" && i.isRefined);
  const geo = place && !onlineOnly
    ? { aroundLatLng: `${place.lat},${place.lng}`, aroundRadius: AREA_RADIUS_M }
    : {};
  return <Configure hitsPerPage={100} {...geo} />;
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
        <button className="btn btn-soft" type="submit" disabled={busy}>{busy ? "…" : "Go"}</button>
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

export default function Finder() {
  const [view, setView] = useState<"list" | "map">("list"); // list default; Near me → map
  const [place, setPlace] = useState<Place>(null);
  const [selected, setSelected] = useState<any>(null);
  const [located, setLocated] = useState(false); // already tried device location?

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
    navigator.geolocation.getCurrentPosition((p) => useCoords(p.coords.latitude, p.coords.longitude, true));
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

  const user = place ? { lat: place.lat, lng: place.lng } : null;

  return (
    <InstantSearch searchClient={searchClient} indexName={COLLECTION} future={{ preserveSharedStateOnUnmount: true }}>
      <GeoConfigure place={place} />
      <SearchBox onNearMe={nearMe} />

      <FellowshipChips />
      <div className="filter-row" role="group" aria-label="Day, type and format">
        <DayChip day={TODAY} label="Today" />
        <DayChip day={(TODAY + 1) % 7} label="Tomorrow" />
        <Toggle attribute="types" value="Open" label="Open" />
        <Toggle attribute="types" value="Wheelchair" label="Accessible" />
        <Toggle attribute="online" value="true" label="Online" />
      </div>

      <div className="results-head">
        <LocationControl place={place} onZip={setPlace} onNearMe={nearMe} onClear={() => setPlace(null)} />
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>Map</button>
        </div>
      </div>

      {view === "list" ? (
        <Results onOpen={setSelected} user={user} onClearLocation={() => setPlace(null)} />
      ) : (
        <ErrorBoundary fallback={<div className="state"><h2>Map unavailable</h2><p>Switch back to List, or reload. (If this persists, the map key may be missing.)</p></div>}>
          <MapView onOpen={setSelected} />
        </ErrorBoundary>
      )}

      {selected && <MeetingSheet m={selected} onClose={() => setSelected(null)} />}
    </InstantSearch>
  );
}

function MeetingSheet({ m, onClose }: { m: any; onClose: () => void }) {
  const t = to12(m.time);
  const { refine } = useSearchBox();
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
    const loc = m.online ? "Online meeting" : [m.place, m.address].filter(Boolean).join(", ");
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
  const seeAll = (q: string) => { refine(q); onClose(); };
  return (
    <div role="dialog" aria-modal aria-label={m.name} className="sheet-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-panel" ref={panelRef} tabIndex={-1} style={{ ["--fc" as any]: fellowshipColor(m.fellowship), outline: "none" }}>
        <div className="sheet-top">
          <button className="share-btn" onClick={share} aria-label={`Share ${m.name}`}>
            <Icon name="share" size={18} /> {copied ? "Copied!" : "Share"}
          </button>
        </div>
        <h2>{m.name}</h2>
        <div>
          <a className="when" href={calendarUrl(m)} target="_blank" rel="noopener" aria-label={`Add ${m.name} to your calendar`}>
            <Icon name="calmonth" size={16} /> {DAYS[m.day]}, {t.hh} {t.ap} <Icon name="add" size={15} />
          </a>
        </div>
        <div className="sheet-addr">
          {m.online ? "Online meeting" : <>{m.place ? m.place + " · " : ""}<a href={mapsAddr} target="_blank" rel="noopener">{m.address}</a></>}
        </div>
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
        {m.notes && <p className="notes-block">{m.notes}</p>}
        <DetailMap m={m} defaultMode="map" />
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
            ? <button className="btn btn-fc" onClick={onClose}><Icon name="video" size={18} /> Join online</button>
            : <a className="btn btn-fc" href={mapsAddr} target="_blank" rel="noopener"><Icon name="route" size={18} /> Directions</a>}
          <button className="btn btn-soft" onClick={onClose}><Icon name="close" size={18} /> Close</button>
        </div>
      </div>
    </div>
  );
}
