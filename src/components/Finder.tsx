"use client";
import { useState } from "react";
import {
  InstantSearch, Configure, useSearchBox, useRefinementList, useHits, useInstantSearch,
} from "react-instantsearch";
import dynamic from "next/dynamic";
import { searchClient } from "@/lib/typesense";
import { COLLECTION } from "@/lib/schema";
import { Icon } from "./Icon";

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

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat), dLng = r(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
function walkText(p: any, m: any) {
  let mi: number;
  if (p.slat != null && m.lat != null) mi = haversineMi(m.lat, m.lng, p.slat, p.slng) * 1.25;
  else { const demo: Record<string, number> = { bus: 0.1, bike: 0.2, train: 0.5, garage: 0.2, street: 0.06, zone: 0.1, free: 0.05 }; mi = demo[p.k] ?? 0.1; }
  const min = Math.max(1, Math.round(mi * 20));
  return `Approx walking distance: ${min} min · ${mi.toFixed(mi < 0.1 ? 2 : 1)} mi`;
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
      <span><span className="pt">{p.t}</span><span className="pd">{walkText(p, m)}</span></span>
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

function Results({ onOpen }: { onOpen: (m: any) => void }) {
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
        <p>Try removing a filter, widening your search, or switching to online meetings.</p>
      </div>
    );
  }
  return (
    <ul className="cards" aria-busy={busy}>
      {items.map((m: any) => {
        const t = to12(m.time);
        return (
          <li key={m.objectID}>
            <button className="card" onClick={() => onOpen(m)}>
              <span className="timechip"><span className="hh">{t.hh}</span><span className="ap">{t.ap}</span></span>
              <span>
                <h3>{m.name}</h3>
                <span className="meta"><b>{DAYS[m.day]}</b> · {m.online ? "Online" : m.place || m.address}</span>
              </span>
              <span className="dist">{m.dist != null ? `${Number(m.dist).toFixed(1)} mi` : "Online"}</span>
              <span className="tags">
                <span className="tag fellow">{m.fellowship}</span>
                {(m.types || []).slice(0, 3).map((x: string) => <span key={x} className="tag">{x}</span>)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Finder() {
  const [view, setView] = useState<"list" | "map">("list"); // list default; Near me → map
  const [geo, setGeo] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<any>(null);

  function nearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      setGeo(`${p.coords.latitude},${p.coords.longitude}`);
      setView("map"); // spatial context is what you want after "Near me"
    });
  }

  return (
    <InstantSearch searchClient={searchClient} indexName={COLLECTION} future={{ preserveSharedStateOnUnmount: true }}>
      {/* aroundLatLng: when set, the Typesense adapter sorts/filters by distance */}
      <Configure hitsPerPage={100} {...(geo ? { aroundLatLng: geo } : {})} />
      <SearchBox onNearMe={nearMe} />

      <div className="filter-row" role="group" aria-label="Fellowship">
        <Toggle attribute="fellowship" value="AA" label="AA" />
        <Toggle attribute="fellowship" value="NA" label="NA" />
        <Toggle attribute="fellowship" value="SLAA" label="SLAA" />
        <Toggle attribute="fellowship" value="Al-Anon" label="Al-Anon" />
        <Toggle attribute="types" value="Open" label="Open" />
        <Toggle attribute="types" value="Wheelchair" label="Accessible" />
        <Toggle attribute="online" value="true" label="Online" />
      </div>

      <div className="results-head">
        <div className="results-count">Meetings near you</div>
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>Map</button>
        </div>
      </div>

      {view === "list" ? <Results onOpen={setSelected} /> : <MapView onOpen={setSelected} />}

      {selected && <MeetingSheet m={selected} onClose={() => setSelected(null)} />}
    </InstantSearch>
  );
}

function MeetingSheet({ m, onClose }: { m: any; onClose: () => void }) {
  const t = to12(m.time);
  const transit = m.transit_json ? JSON.parse(m.transit_json) : [];
  const parking = m.parking_json ? JSON.parse(m.parking_json) : [];
  const mapsAddr = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((m.place ? m.place + ", " : "") + m.address)}`;
  return (
    <div role="dialog" aria-modal aria-label={m.name}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "end center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: 820, borderRadius: "28px 28px 0 0", padding: 20, maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ marginTop: 0 }}>{m.name}</h2>
        <div style={{ color: "var(--brand-ink)", fontWeight: 800 }}>{DAYS[m.day]}, {t.hh} {t.ap}</div>
        <div style={{ color: "var(--ink-soft)" }}>
          {m.online ? "Online meeting" : <>{m.place ? m.place + " · " : ""}<a href={mapsAddr} target="_blank" rel="noopener">{m.address}</a></>}
        </div>
        {m.notes && <p style={{ background: "var(--surface-2)", padding: 16, borderRadius: 14 }}>{m.notes}</p>}
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
            ? <button className="btn btn-soft" onClick={onClose}><Icon name="nearme" size={18} /> Join online</button>
            : <a className="btn btn-soft" href={mapsAddr} target="_blank" rel="noopener"><Icon name="route" size={18} /> Directions</a>}
          <button className="btn btn-soft" onClick={onClose}><Icon name="close" size={18} /> Close</button>
        </div>
      </div>
    </div>
  );
}
