"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeoSearch } from "react-instantsearch";

// OpenStreetMap raster style (no API key). Swap for a vector style in prod.
const STYLE: maplibregl.StyleSpecification = {
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

export default function MapView({ onOpen }: { onOpen: (m: any) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const { items } = useGeoSearch();

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = new maplibregl.Map({
      container: el.current, style: STYLE,
      center: [-77.0369, 38.9072], zoom: 11,
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    const bounds = new maplibregl.LngLatBounds();
    items.forEach((hit: any) => {
      if (!hit._geoloc) return;
      const [lat, lng] = hit._geoloc;
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", hit.name);
      dot.style.cssText = "width:26px;height:26px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:#0f766e;border:3px solid #fff;cursor:pointer";
      dot.onclick = () => onOpen(hit);
      const mk = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map.current!);
      markers.current.push(mk);
      bounds.extend([lng, lat]);
    });
    if (!bounds.isEmpty()) map.current.fitBounds(bounds, { padding: 48, maxZoom: 14 });
  }, [items, onOpen]);

  return <div className="map-wrap" ref={el} aria-label="Map of meetings" role="application" />;
}
