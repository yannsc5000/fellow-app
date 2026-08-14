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
    // Enrichment so users don't have to browse elsewhere: the online join link, a
    // dial-in number, the group's website, and when the source last updated it.
    conference_url: rec.conference_url || '',
    conference_phone: rec.conference_phone || '',
    website: rec.website || rec.url || '',
    updated: rec.updated || '',
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
    conference_url: rec.virtual_meeting_link || '',
    conference_phone: rec.phone_meeting_number || '',
    website: rec.url || '',
    updated: '',
  };
  m.dist = (m.lat != null) ? +haversineMi(DC_CENTER.lat, DC_CENTER.lng, m.lat, m.lng).toFixed(1) : null;
  return enrich(m);
}

// Minimal HTML-entity decode — The Events Calendar returns titles/venues HTML-encoded.
export function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8217;|&#039;|&#39;|&rsquo;|&lsquo;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#0?38;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => { const c = Number(n); return Number.isFinite(c) ? String.fromCharCode(c) : ''; })
    .replace(/\s+/g, ' ').trim();
}

// A category/tag/title hinting an online/phone meeting (venue geo is then ignored).
const TEC_ONLINE_RE = /\b(online|virtual|phone|telephone|electronic|zoom)\b/i;
const pad2 = (n) => String(n).padStart(2, '0');

// The Events Calendar (Tribe Events) REST event → our schema. CoDA and other orgs that migrated off
// TSML use this plugin; its /wp-json/tribe/events/v1/events endpoint returns dated event INSTANCES,
// so recurring weekly meetings arrive several times — dedupe() collapses them by name|day|time|address.
export function fromTribeEvents(rec, i, fellowship = 'CoDA') {
  const sd = rec.start_date_details || {};
  const ed = rec.end_date_details || {};
  const y = num(sd.year), mo = num(sd.month), d = num(sd.day);
  // Weekday (0=Sun) from the event's LOCAL calendar date; UTC construction keeps it TZ-stable.
  const day = (y && mo && d) ? new Date(Date.UTC(y, mo - 1, d)).getUTCDay() : NaN;
  const time = (sd.hour != null && sd.minutes != null)
    ? `${pad2(sd.hour)}:${pad2(sd.minutes)}`
    : (typeof rec.start_date === 'string' ? rec.start_date.slice(11, 16) : null);

  const catNames = [...(rec.categories || []), ...(rec.tags || [])]
    .map((c) => decodeEntities((c && (c.name || c.slug)) || '')).filter(Boolean);
  const title = decodeEntities(rec.title || rec.name || '');
  const online = catNames.some((n) => TEC_ONLINE_RE.test(n)) || TEC_ONLINE_RE.test(title);

  const v = rec.venue || {};
  const state = v.stateprovince || v.state || '';
  const address = [v.address, v.city, [state, v.zip].filter(Boolean).join(' ')]
    .map((x) => decodeEntities(x || '')).filter(Boolean).join(', ');
  const websiteRaw = decodeEntities(rec.website || rec.url || '');

  const m = {
    id: `${fellowship.toLowerCase()}-tec-${i}`,
    source: 'tribe-events',
    fellowship,
    name: title || 'Meeting',
    day: Number.isInteger(day) ? day : NaN,   // NaN if missing → filtered out by ingest
    time: typeof time === 'string' ? time.slice(0, 5) : null,
    end: (ed.hour != null && ed.minutes != null) ? `${pad2(ed.hour)}:${pad2(ed.minutes)}` : null,
    place: decodeEntities(v.venue || '') || null,
    address,
    online,
    lat: online ? null : num(v.geo_lat),
    lng: online ? null : num(v.geo_lng),
    types: catNames.filter((n) => !TEC_ONLINE_RE.test(n)).slice(0, 6),
    notes: '',
    conference_url: online
      ? (rec.virtual_url || (/^https?:\/\//i.test(websiteRaw) ? websiteRaw : ''))
      : '',
    conference_phone: '',
    website: websiteRaw,
    updated: (typeof rec.modified_utc === 'string' ? rec.modified_utc : '')
      || (typeof rec.date_utc === 'string' ? rec.date_utc : ''),
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
  const adapter = system === 'bmlt' ? fromBMLT
    : system === 'tribe-events' ? fromTribeEvents
    : fromMeetingGuide;
  return records.map((r, i) => adapter(r, i, fellowship));
}

// Backward-compatible convenience (used by tests): AA Meeting Guide + NA BMLT.
export function normalizeAll(aaRecords = [], naRecords = []) {
  return dedupe([
    ...aaRecords.map((r, i) => fromMeetingGuide(r, i, 'AA')),
    ...naRecords.map((r, i) => fromBMLT(r, i, 'NA')),
  ]);
}
