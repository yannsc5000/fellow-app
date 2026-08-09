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

  // ---- AA — Meeting Guide intergroup feeds. ----
  // VERIFIED here (returned meeting JSON):
  { id: "aa-dc-waia",     fellowship: "AA", system: "meeting-guide", area: "Washington DC (WAIA)",  url: "https://aa-dc.org/wp-admin/admin-ajax.php?action=meetings", localSnapshot: "raw-aa-dc.json" },
  { id: "aa-nyc",         fellowship: "AA", system: "meeting-guide", area: "New York (NY Intergroup)", url: "https://nyintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-houston",     fellowship: "AA", system: "meeting-guide", area: "Houston",                url: "https://aahouston.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-atlanta",     fellowship: "AA", system: "meeting-guide", area: "Metro Atlanta",          url: "https://www.atlantaaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-san-diego",   fellowship: "AA", system: "meeting-guide", area: "San Diego",              url: "https://aasandiego.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-minneapolis", fellowship: "AA", system: "meeting-guide", area: "Minneapolis",            url: "https://aaminneapolis.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sacramento",  fellowship: "AA", system: "meeting-guide", area: "Sacramento",             url: "https://aasacramento.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-seattle",     fellowship: "AA", system: "meeting-guide", area: "Seattle",                url: "https://www.seattleaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-st-louis",    fellowship: "AA", system: "meeting-guide", area: "St. Louis",              url: "https://aastl.org/wp-admin/admin-ajax.php?action=meetings" },
  // Endpoint exists (site responded) but a WAF blocked the sandbox fetcher — these
  // normally succeed from CI / a real server. ingest() skips any that fail, so safe to include.
  { id: "aa-sf-marin",    fellowship: "AA", system: "meeting-guide", area: "SF & Marin",            url: "https://aasfmarin.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-chicago",     fellowship: "AA", system: "meeting-guide", area: "Chicago (CAAIS)",        url: "https://www.chicagoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-boston",      fellowship: "AA", system: "meeting-guide", area: "Boston",                 url: "https://aaboston.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-phoenix",     fellowship: "AA", system: "meeting-guide", area: "Phoenix (Salt River)",   url: "https://www.aaphoenix.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-dallas",      fellowship: "AA", system: "meeting-guide", area: "Dallas",                 url: "https://aadallas.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-philadelphia",fellowship: "AA", system: "meeting-guide", area: "Philadelphia (SEPIA)",   url: "https://aasepia.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-portland",    fellowship: "AA", system: "meeting-guide", area: "Portland OR",            url: "https://pdxaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-denver",      fellowship: "AA", system: "meeting-guide", area: "Denver",                 url: "https://www.daccaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-austin",      fellowship: "AA", system: "meeting-guide", area: "Austin",                 url: "https://www.austinaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-cleveland",   fellowship: "AA", system: "meeting-guide", area: "Cleveland",              url: "https://www.aacle.org/wp-admin/admin-ajax.php?action=meetings" },
  // Regional additions (requested). Boston/Seattle/Portland already covered above.
  { id: "aa-detroit-semi", fellowship: "AA", system: "meeting-guide", area: "Detroit / SE Michigan", url: "https://aa-semi.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-detroit-ferndale", fellowship: "AA", system: "meeting-guide", area: "AA of Greater Detroit (Ferndale)", url: "https://www.aaferndale.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-miami-dade",  fellowship: "AA", system: "meeting-guide", area: "Miami-Dade FL",          url: "https://aamiamidade.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-wyoming",     fellowship: "AA", system: "meeting-guide", area: "Wyoming (Area 76)",       url: "https://wyomingaa.org/wp-admin/admin-ajax.php?action=meetings" }, // verify: custom install, confirm from CI
  // DC METRO double-down: WAIA (aa-dc, above) already covers DC + MD suburbs + close-in VA;
  // add outer Northern Virginia (Fairfax/NoVA) for full metro coverage.
  { id: "aa-nova",        fellowship: "AA", system: "meeting-guide", area: "Northern Virginia (NoVA Intergroup)", url: "https://nvintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  // TODO: LA uses a non-TSML format (returns HTML) — needs its own adapter.
  // Grow toward the full ~400 intergroups (see NATIONAL-ROLLOUT.md discovery approach).

  // ---- Other fellowships — many are on BMLT (add their root servers from awesome-bmlt)
  // or publish Meeting Guide feeds. Add per-fellowship national sources here. ----
];
