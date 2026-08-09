// Fellow — normalizer. Maps AA (Meeting Guide/TSML) and NA (BMLT) records into
// one unified schema, and enriches each in-person meeting with its nearest
// Metro station (computed from real coordinates) plus Maps-linkable transit and
// parking options. Pure functions — no network — so it is unit-testable.
import { ALL_STATIONS } from './stations.mjs';

const DC_CENTER = { lat: 38.9072, lng: -77.0369 };

// parse a number from string|number|null → finite number or null (drops NaN/bad coords)
const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : null; };

// ---- distance ----
export function haversineMi(aLat, aLng, bLat, bLng) {
  const R = 3958.8, toRad = d => d * Math.PI / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
export function nearestStation(lat, lng) {
  let best = null;
  for (const st of ALL_STATIONS) {
    const d = haversineMi(lat, lng, st.lat, st.lng);
    if (!best || d < best.d) best = { ...st, d };
  }
  return best;
}

// ---- type code maps ----
const AA_TYPES = { O:'Open', C:'Closed', D:'Discussion', ST:'Step Study', SP:'Speaker',
  S:'Spanish', MED:'Meditation', W:'Wheelchair', X:'Wheelchair', TR:'Transgender',
  H:'Birthday', ABSI:'As Bill Sees It', BB:'Big Book', BEG:'Beginners', OUT:'Outdoor',
  '0':'Open', M:'Men', WM:'Women', LGBTQ:'LGBTQ+' };
const NA_FORMATS = { O:'Open', C:'Closed', D:'Discussion', ST:'Step Study', SP:'Speaker',
  BEG:'Beginners', BT:'Basic Text', WC:'Wheelchair', W:'Wheelchair', M:'Men', WO:'Women',
  LC:'Living Clean', TOP:'Topic' };
const FORMAT_ONLY = new Set(['ONL','IPM','TC','HYB','ONLINE']); // not shown as tags

function labelTypes(codes, map) {
  const out = [];
  for (const c of codes || []) {
    if (FORMAT_ONLY.has(c)) continue;
    const label = map[c];
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

// ---- enrichment: transit + parking (Maps-linkable "nearest") ----
// Attaches the nearest real rail station across every bundled system (DC always, plus
// any cities generated into scripts/lib/stations/ via build-stations.mjs) when one is
// within ~20 mi. Real station name, official line colors, and true distance. Cities with
// no station data (or meetings far from any rail) get a generic "find transit" Maps link.
const RAIL_NEAR_MI = 20;
function enrich(m) {
  if (m.online || m.lat == null) return m;
  const transit = [];
  const st = nearestStation(m.lat, m.lng);
  if (st && st.d <= RAIL_NEAR_MI) {
    transit.push({
      k: st.k || 'metro',
      t: st.lines ? `${st.name} · ${st.lines}` : st.name,
      d: `${st.d.toFixed(1)} mi to station`,
      q: `${st.name} station`,
      slat: st.lat, slng: st.lng,
      ...(st.colors && st.colors.length ? { colors: st.colors } : {}),
    });
  } else {
    // No station data near here yet — a generic rail/transit search Maps resolves locally.
    transit.push({ k:'train', t:'Transit & rail nearby', d:'Find stations on Google Maps', q:`transit station near ${m.address}` });
  }
  // Location-correct anywhere (Maps resolves relative to the meeting address).
  // NOTE: these are live Google Maps *searches*, not verified amenities — the UI must
  // NOT show a fabricated walking distance for them (only the real station above has one).
  // Bikeshare is intentionally omitted: it's absent in most areas, so listing it implied
  // availability that usually isn't there.
  transit.push({ k:'bus', t:'Bus stops nearby', d:'Find routes & stops on Google Maps', q:`bus stop near ${m.address}` });
  m.transit = transit;
  m.parking = [
    { k:'garage', t:'Parking nearby', d:'Find garages & lots on Google Maps', q:`parking near ${m.address}` },
    { k:'street', t:'Street parking', d:'Find on-street parking on Google Maps', q:`street parking near ${m.address}` },
  ];
  return m;
}

// ---- adapters ----
export function fromMeetingGuide(rec, i, fellowship = 'AA') {
  const online = (rec.types || []).some(t => ['ONL','ONLINE'].includes(t));
  const m = {
    id: `${fellowship.toLowerCase()}-mg-${i}`,
    source: 'meeting-guide',
    fellowship,
    name: rec.name || 'Meeting',
    day: Number.isInteger(rec.day) ? rec.day : parseInt(rec.day, 10),  // NaN if missing → filtered out
    time: typeof rec.time === 'string' ? rec.time.slice(0, 5) : null,
    end: rec.end_time || null,
    place: rec.location || null,
    address: rec.formatted_address || rec.address || '',
    online,
    lat: online ? null : num(rec.latitude),
    lng: online ? null : num(rec.longitude),
    types: labelTypes(rec.types, AA_TYPES),
    notes: rec.notes || '',
  };
  m.dist = (m.lat != null) ? +haversineMi(DC_CENTER.lat, DC_CENTER.lng, m.lat, m.lng).toFixed(1) : null;
  return enrich(m);
}

// BMLT weekday_tinyint: 1=Sunday .. 7=Saturday  → our day: 0=Sunday .. 6=Saturday
export function fromBMLT(rec, i, fellowship = 'NA') {
  const day = ((parseInt(rec.weekday_tinyint, 10) || 1) - 1) % 7;
  const codes = (rec.formats || '').split(',').map(s => s.trim()).filter(Boolean);
  const online = codes.some(c => ['ONL','HYB','VM'].includes(c));
  const addr = [rec.location_street, rec.location_municipality, rec.location_province]
    .filter(Boolean).join(', ');
  const m = {
    id: `${fellowship.toLowerCase()}-bmlt-${i}`,
    source: 'bmlt',
    fellowship,
    name: rec.meeting_name,
    day,
    time: (rec.start_time || '').slice(0,5),
    end: null,
    place: rec.location_text || null,
    address: addr,
    online,
    lat: online ? null : num(rec.latitude),
    lng: online ? null : num(rec.longitude),
    types: labelTypes(codes, NA_FORMATS),
    notes: rec.comments || '',
  };
  m.dist = (m.lat != null) ? +haversineMi(DC_CENTER.lat, DC_CENTER.lng, m.lat, m.lng).toFixed(1) : null;
  return enrich(m);
}

export function dedupe(list) {
  const seen = new Set();
  return list.filter(m => {
    const k = `${m.name}|${m.day}|${m.time}|${m.address}`.toLowerCase();
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

// Map one source's raw records with the right adapter + fellowship.
export function normalizeSource(records = [], { system, fellowship }) {
  const adapter = system === 'bmlt' ? fromBMLT : fromMeetingGuide;
  return records.map((r, i) => adapter(r, i, fellowship));
}

// Backward-compatible convenience (used by tests): AA Meeting Guide + NA BMLT.
export function normalizeAll(aaRecords = [], naRecords = []) {
  return dedupe([
    ...aaRecords.map((r, i) => fromMeetingGuide(r, i, 'AA')),
    ...naRecords.map((r, i) => fromBMLT(r, i, 'NA')),
  ]);
}
