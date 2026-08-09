// Feed registry — sources ingest pulls from. NATIONAL-FIRST (then hone into DC).
//
// Each source: { id, fellowship, system, url, area, localSnapshot?, national? }
//   system: "meeting-guide" (AA/most fellowships on TSML) | "bmlt" (NA + others)
//
// Strategy:
//  - NA (+ other BMLT fellowships): the BMLT "tomato" AGGREGATOR federates root
//    servers nationwide — near-national from one host. Pull per-state (or bbox)
//    to keep responses sane; see NATIONAL-ROLLOUT.md.
//  - AA: no single national endpoint. Enumerate the Meeting Guide intergroup feeds
//    (the ~400+ the official app aggregates). Start with the largest metros (cover
//    most of the population), grow the long tail. Discover a site's feed via the
//    <link rel="alternate" type="application/json"> tag in its HTML <head>, or the
//    TSML admin-ajax endpoint (…/wp-admin/admin-ajax.php?action=meetings).

const BMLT_TOMATO = "https://tomato.bmlt.app/main_server/client_interface/json/?switcher=GetSearchResults"
  + "&data_field_key=meeting_name,weekday_tzid,start_time,duration_time,location_text,"
  + "location_street,location_municipality,location_province,latitude,longitude,formats,comments";

export const SOURCES = [
  // ---- NA — national via BMLT aggregator (tomato). Iterate US states in ingest. ----
  {
    id: "na-national-bmlt",
    fellowship: "NA",
    system: "bmlt",
    area: "United States (BMLT aggregator)",
    url: process.env.NA_BMLT_URL || BMLT_TOMATO,
    national: true,
    localSnapshot: "raw-na-sample.json",
  },

  // ---- AA — Meeting Guide intergroup feeds. VERIFIED (return meeting JSON): ----
  { id: "aa-dc-waia",     fellowship: "AA", system: "meeting-guide", area: "Washington DC (WAIA)",  url: "https://aa-dc.org/wp-admin/admin-ajax.php?action=meetings", localSnapshot: "raw-aa-dc.json" },
  { id: "aa-nyc",         fellowship: "AA", system: "meeting-guide", area: "New York (NY Intergroup)", url: "https://nyintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-houston",     fellowship: "AA", system: "meeting-guide", area: "Houston",                url: "https://aahouston.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-atlanta",     fellowship: "AA", system: "meeting-guide", area: "Metro Atlanta",          url: "https://www.atlantaaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-san-diego",   fellowship: "AA", system: "meeting-guide", area: "San Diego",              url: "https://aasandiego.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-minneapolis", fellowship: "AA", system: "meeting-guide", area: "Minneapolis",            url: "https://aaminneapolis.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sacramento",  fellowship: "AA", system: "meeting-guide", area: "Sacramento",             url: "https://aasacramento.org/wp-admin/admin-ajax.php?action=meetings" },

  // ---- AA — CANDIDATES: block automated fetchers here but usually work from CI/a
  // real server; verify then move up. LA uses a non-TSML format (needs its own adapter). ----
  // { id: "aa-sf-marin",    fellowship: "AA", system: "meeting-guide", area: "SF & Marin",     url: "https://aasfmarin.org/wp-admin/admin-ajax.php?action=meetings" },
  // { id: "aa-chicago",     fellowship: "AA", system: "meeting-guide", area: "Chicago (CAAIS)", url: "https://chicagoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  // { id: "aa-boston",      fellowship: "AA", system: "meeting-guide", area: "Boston",          url: "https://aaboston.org/wp-admin/admin-ajax.php?action=meetings" },
  // { id: "aa-phoenix",     fellowship: "AA", system: "meeting-guide", area: "Phoenix",         url: "https://www.aaphoenix.org/wp-admin/admin-ajax.php?action=meetings" },
  // { id: "aa-dallas",      fellowship: "AA", system: "meeting-guide", area: "Dallas",          url: "https://aadallas.org/wp-admin/admin-ajax.php?action=meetings" },
  // { id: "aa-philadelphia",fellowship: "AA", system: "meeting-guide", area: "Philadelphia (SEPIA)", url: "https://aasepia.org/wp-admin/admin-ajax.php?action=meetings" },
  // …grow toward the full ~400 intergroups (see NATIONAL-ROLLOUT.md for the discovery approach).

  // ---- Other fellowships — many are on BMLT (add their root servers from awesome-bmlt)
  // or publish Meeting Guide feeds. Add per-fellowship national sources here. ----
];
