// Unified meeting shape (shared by ingest, indexing, and UI) + the Typesense
// collection schema. Mirrors the DC spike's normalized output.

export interface Meeting {
  id: string;
  source: "meeting-guide" | "bmlt" | string;
  fellowship: "AA" | "NA" | "SLAA" | "Al-Anon" | string;
  name: string;
  day: number;            // 0=Sun .. 6=Sat
  time: string;           // "HH:MM"
  end: string | null;
  place: string | null;
  address: string;
  online: boolean;
  lat: number | null;
  lng: number | null;
  types: string[];        // human labels: Open, Closed, Wheelchair, ...
  notes: string;
  conference_url?: string;   // online join link (Zoom, etc.)
  conference_phone?: string; // dial-in number for phone/hybrid meetings
  website?: string;          // group or meeting website
  updated?: string;          // when the source feed last updated this record
  dist?: number | null;
  transit?: Array<{ k: string; t: string; d: string; q: string; slat?: number; slng?: number }>;
  parking?: Array<{ k: string; t: string; d: string; q: string }>;
}

// Typesense document: flatten what we facet/sort on; keep the rest as JSON.
export interface MeetingDoc extends Omit<Meeting, "transit" | "parking" | "place" | "dist"> {
  place?: string;
  dist?: number;
  _geoloc?: [number, number]; // [lat, lng] — Typesense geopoint
  transit_json?: string;
  parking_json?: string;
}

export const COLLECTION = process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION || "meetings";

export const meetingsSchema = {
  name: COLLECTION,
  enable_nested_fields: false,
  fields: [
    { name: "name", type: "string" },
    { name: "fellowship", type: "string", facet: true },
    { name: "fellowship_name", type: "string", optional: true },
    { name: "fellowship_terms", type: "string", optional: true },
    { name: "types", type: "string[]", facet: true },
    { name: "day", type: "int32", facet: true },
    { name: "time", type: "string", sort: true },
    { name: "minutes", type: "int32", optional: true, sort: true }, // minutes since midnight → "starts soon" range filter

    { name: "online", type: "bool", facet: true },
    { name: "place", type: "string", optional: true },
    { name: "address", type: "string" },
    { name: "notes", type: "string", optional: true },
    // Display-only enrichment (stored + returned, not searched/faceted).
    { name: "end", type: "string", optional: true, index: false },
    { name: "conference_url", type: "string", optional: true, index: false },
    { name: "conference_phone", type: "string", optional: true, index: false },
    { name: "website", type: "string", optional: true, index: false },
    { name: "updated", type: "string", optional: true, index: false },
    { name: "_geoloc", type: "geopoint", optional: true },
    { name: "dist", type: "float", optional: true, sort: true },
    { name: "transit_json", type: "string", optional: true, index: false },
    { name: "parking_json", type: "string", optional: true, index: false },
  ],
} as const;

export function toDoc(m: Meeting): MeetingDoc {
  const { transit, parking, ...rest } = m;
  return {
    ...rest,
    place: m.place ?? undefined,
    dist: m.dist ?? undefined,
    _geoloc: m.lat != null && m.lng != null ? [m.lat, m.lng] : undefined,
    transit_json: transit ? JSON.stringify(transit) : undefined,
    parking_json: parking ? JSON.stringify(parking) : undefined,
  };
}
