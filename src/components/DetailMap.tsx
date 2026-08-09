"use client";
import { useState } from "react";

// Location map with a Map / Street View toggle. Shared by the detail sheet and the
// search-results map popup. Street View + Google map use a (free) Google Maps Embed
// API key when present; otherwise Map falls back to MapTiler static → OpenStreetMap,
// and Street View opens in Google Maps in a new tab.
export function DetailMap({
  m, defaultMode = "map", height = 240,
}: { m: any; defaultMode?: "map" | "street"; height?: number }) {
  const G = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const MT = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  // Smart default: only start on Street View if we can show it inline (Google key).
  const [mode, setMode] = useState<"map" | "street">(defaultMode === "street" && !G ? "map" : defaultMode);
  if (m.online || m.lat == null || m.lng == null) return null;
  const { lat, lng } = m;
  // Prefer the street address for the Map (Google geocodes it precisely and labels the
  // venue). Street View can only take coordinates and snaps to the nearest photo, so it
  // may show a neighboring street — that's why Map, not Street View, is the default.
  const addr = ((m.place ? m.place + ", " : "") + (m.address || "")).trim();
  const placeQ = addr ? encodeURIComponent(addr) : `${lat},${lng}`;

  let content: React.ReactNode;
  if (mode === "street") {
    content = G
      ? <iframe title="Street View" loading="lazy" allowFullScreen
          src={`https://www.google.com/maps/embed/v1/streetview?key=${G}&location=${lat},${lng}&fov=90`} />
      : <div className="sv-fallback">
          <a className="btn btn-soft" target="_blank" rel="noopener"
             href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`}>
            Open Street View ↗
          </a>
        </div>;
  } else {
    content = G
      ? <iframe title="Map" loading="lazy"
          src={`https://www.google.com/maps/embed/v1/place?key=${G}&q=${placeQ}&zoom=16`} />
      : MT
        ? <a target="_blank" rel="noopener" href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}>
            <img alt="Map of the meeting location"
              src={`https://api.maptiler.com/maps/streets-v2/static/${lng},${lat},15/600x260@2x.png?key=${MT}&markers=${lng},${lat}`} />
          </a>
        : <iframe title="Map" loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.003},${lng+0.005},${lat+0.003}&layer=mapnik&marker=${lat},${lng}`} />;
  }
  return (
    <div>
      <div className="map-toggle" role="group" aria-label="Location view">
        <button aria-pressed={mode === "map"} onClick={() => setMode("map")}>Map</button>
        <button aria-pressed={mode === "street"} onClick={() => setMode("street")}>Street View</button>
      </div>
      <div className="detail-map" style={{ height }}>{content}</div>
    </div>
  );
}
