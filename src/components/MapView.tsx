"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeoSearch } from "react-instantsearch";
import { DetailMap } from "./DetailMap";

// Basemap: use MapTiler (vector) when NEXT_PUBLIC_MAPTILER_KEY is set (production),
// otherwise fall back to OpenStreetMap raster tiles (fine for local/dev).
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
// MapTiler accepts a style URL directly; "streets-v2" is a clean general basemap.
const STYLE: string | maplibregl.StyleSpecification = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : OSM_STYLE;

export default function MapView({ onOpen }: { onOpen: (m: any) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const { items } = useGeoSearch();
  const [focused, setFocused] = useState<any>(null); // pin tapped → preview card w/ Map/Street toggle

  useEffect(() => {
    if (!el.current || map.current) return;
    try {
      map.current = new maplibregl.Map({
        container: el.current, style: STYLE,
        center: [-77.0369, 38.9072], zoom: 11,
      });
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");
      // If the style (e.g. a bad MapTiler key) fails, fall back to OSM instead of crashing.
      map.current.on("error", (ev: any) => {
        const msg = String(ev?.error?.message || "");
        if (STYLE !== OSM_STYLE && /style|40[13]|Forbidden|Unauthorized/i.test(msg)) {
          try { map.current?.setStyle(OSM_STYLE); } catch {}
        }
      });
    } catch (e) {
      console.error("Map init failed:", e);
    }
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    const bounds = new maplibregl.LngLatBounds();
    items.forEach((hit: any) => {
      const g = hit._geoloc;
      if (!g) return;
      // adapter may give {lat,lng} (Algolia) or [lat,lng] (raw) — handle both
      const lat = Array.isArray(g) ? g[0] : g.lat;
      const lng = Array.isArray(g) ? g[1] : g.lng;
      if (lat == null || lng == null) return;
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", hit.name);
      dot.style.cssText = "width:26px;height:26px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:#0f766e;border:3px solid #fff;cursor:pointer";
      dot.onclick = () => setFocused({ ...hit, lat, lng });
      const mk = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map.current!);
      markers.current.push(mk);
      bounds.extend([lng, lat]);
    });
    if (!bounds.isEmpty()) map.current.fitBounds(bounds, { padding: 48, maxZoom: 14 });
  }, [items]);

  return (
    <div className="map-wrap-wrap">
      <div className="map-wrap" ref={el} aria-label="Map of meetings" role="application" />
      {focused && (
        <div className="map-focus-card">
          <div className="mfc-head">
            <strong>{focused.name}</strong>
            <button className="close-x" aria-label="Close" onClick={() => setFocused(null)}>✕</button>
          </div>
          <div className="mfc-sub">{focused.place || focused.address}</div>
          <DetailMap m={focused} defaultMode="map" height={160} />
          <button className="btn btn-soft" style={{ marginTop: 10, width: "100%" }} onClick={() => onOpen(focused)}>
            Full details
          </button>
        </div>
      )}
    </div>
  );
}
