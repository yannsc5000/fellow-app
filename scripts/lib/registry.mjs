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

const BMLT_TOMATO = "https://tomato.na-bmlt.org/main_server/client_interface/json/?switcher=GetSearchResults"
  + "&data_field_key=meeting_name,weekday_tinyint,start_time,duration_time,location_text,"
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

  // ---- Metro expansion (regional research pass). Mix of VERIFIED and CANDIDATE
  // (CANDIDATE = confirmed TSML via the 12_step_meeting_list tag but WAF-blocked from a
  // plain fetch; run ingest with USE_BROWSER=1 to pull those). ----
  // Northeast / Mid-Atlantic
  { id: "aa-baltimore",    fellowship: "AA", system: "meeting-guide", area: "Baltimore MD",                url: "https://baltimoreaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-cnj",          fellowship: "AA", system: "meeting-guide", area: "Central/South New Jersey",    url: "https://cjiaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-ct",           fellowship: "AA", system: "meeting-guide", area: "Connecticut (Hartford)",      url: "https://ct-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-ri",           fellowship: "AA", system: "meeting-guide", area: "Rhode Island (Providence)",   url: "https://aainri.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-buffalo",      fellowship: "AA", system: "meeting-guide", area: "Buffalo NY",                   url: "https://buffaloaany.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-rochester",    fellowship: "AA", system: "meeting-guide", area: "Rochester NY",                 url: "https://meetings.rochesteraa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-longisland",   fellowship: "AA", system: "meeting-guide", area: "Long Island NY (Nassau)",     url: "https://nassauintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-albany",       fellowship: "AA", system: "meeting-guide", area: "Albany NY",                    url: "https://aaalbanyny.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-richmond",     fellowship: "AA", system: "meeting-guide", area: "Richmond VA",                  url: "https://aarichmond.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-hamptonroads", fellowship: "AA", system: "meeting-guide", area: "Hampton Roads VA",            url: "https://tidewaterintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-portland-me",  fellowship: "AA", system: "meeting-guide", area: "Portland ME",                  url: "https://csoaamaine.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-nh",           fellowship: "AA", system: "meeting-guide", area: "New Hampshire",                url: "https://nhaa.net/wp-admin/admin-ajax.php?action=meetings" },
  // South / Southeast / Texas
  { id: "aa-nashville",    fellowship: "AA", system: "meeting-guide", area: "Nashville TN",                 url: "https://aanashville.org/wp/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-memphis",      fellowship: "AA", system: "meeting-guide", area: "Memphis TN",                   url: "https://www.memphis-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-charlotte",    fellowship: "AA", system: "meeting-guide", area: "Charlotte NC",                 url: "https://charlotteaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-raleigh",      fellowship: "AA", system: "meeting-guide", area: "Raleigh/Durham NC",           url: "https://raleighaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tampa",        fellowship: "AA", system: "meeting-guide", area: "Tampa/St. Petersburg FL",     url: "https://meetings.aatampa-area.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-orlando",      fellowship: "AA", system: "meeting-guide", area: "Orlando FL",                   url: "https://cflintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-jacksonville", fellowship: "AA", system: "meeting-guide", area: "Jacksonville FL",             url: "https://neflaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-south-palm-beach", fellowship: "AA", system: "meeting-guide", area: "South Palm Beach County FL (Delray/Boca)", url: "https://www.aainpalmbeach.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-palm-beach",   fellowship: "AA", system: "meeting-guide", area: "Palm Beach County FL",         url: "https://aa-palmbeachcounty.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-birmingham",   fellowship: "AA", system: "meeting-guide", area: "Birmingham AL",               url: "https://birminghamaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-louisville",   fellowship: "AA", system: "meeting-guide", area: "Louisville KY",               url: "https://loukyaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-okc",          fellowship: "AA", system: "meeting-guide", area: "Oklahoma City OK",            url: "https://okcintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tulsa",        fellowship: "AA", system: "meeting-guide", area: "Tulsa OK",                     url: "https://aaneok.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-san-antonio",  fellowship: "AA", system: "meeting-guide", area: "San Antonio TX",              url: "https://aasanantonio.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-fort-worth",   fellowship: "AA", system: "meeting-guide", area: "Fort Worth TX",               url: "https://fortworthaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-little-rock",  fellowship: "AA", system: "meeting-guide", area: "Little Rock AR",              url: "https://arkansascentraloffice.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-charleston",   fellowship: "AA", system: "meeting-guide", area: "Charleston SC",               url: "https://tcio.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-columbia",     fellowship: "AA", system: "meeting-guide", area: "Columbia SC",                 url: "https://aacolumbia.org/wp-admin/admin-ajax.php?action=meetings" },
  // Midwest
  { id: "aa-columbus",     fellowship: "AA", system: "meeting-guide", area: "Columbus OH",                 url: "https://aacentralohio.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-cincinnati",   fellowship: "AA", system: "meeting-guide", area: "Cincinnati OH",               url: "https://aacincinnati.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-kansascity",   fellowship: "AA", system: "meeting-guide", area: "Kansas City MO",              url: "https://kc-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-indianapolis", fellowship: "AA", system: "meeting-guide", area: "Indianapolis IN",             url: "https://indyaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-madison",      fellowship: "AA", system: "meeting-guide", area: "Madison WI",                   url: "https://aamadisonwi.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-omaha",        fellowship: "AA", system: "meeting-guide", area: "Omaha NE",                     url: "https://www.omahaaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-desmoines",    fellowship: "AA", system: "meeting-guide", area: "Des Moines IA",               url: "https://aadesmoines.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-toledo",       fellowship: "AA", system: "meeting-guide", area: "Toledo OH",                    url: "https://toledoaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-akron",        fellowship: "AA", system: "meeting-guide", area: "Akron OH",                     url: "https://akronaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-fortwayne",    fellowship: "AA", system: "meeting-guide", area: "Fort Wayne IN",               url: "https://www.aafortwayne.org/wp-admin/admin-ajax.php?action=meetings" },
  // West / Mountain / Pacific
  { id: "aa-lasvegas",     fellowship: "AA", system: "meeting-guide", area: "Las Vegas NV",                url: "https://www.lvcentraloffice.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tucson",       fellowship: "AA", system: "meeting-guide", area: "Tucson AZ",                    url: "https://aatucson.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-spokane",      fellowship: "AA", system: "meeting-guide", area: "Spokane WA",                   url: "https://aaspokane.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-reno",         fellowship: "AA", system: "meeting-guide", area: "Reno NV",                      url: "https://nnig.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-saltlakecity", fellowship: "AA", system: "meeting-guide", area: "Salt Lake City UT",           url: "https://www.saltlakeaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-albuquerque",  fellowship: "AA", system: "meeting-guide", area: "Albuquerque NM",              url: "https://www.albuquerqueaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-anchorage",    fellowship: "AA", system: "meeting-guide", area: "Anchorage AK",                url: "https://anchorageaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-honolulu",     fellowship: "AA", system: "meeting-guide", area: "Honolulu HI",                 url: "https://www.oahuaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-coloradosprings", fellowship: "AA", system: "meeting-guide", area: "Colorado Springs CO",      url: "https://www.coloradospringsaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-boise",        fellowship: "AA", system: "meeting-guide", area: "Boise ID",                    url: "https://idahoarea18aa.org/wp-admin/admin-ajax.php?action=meetings" },

  // ---- Other fellowships — many are on BMLT (add their root servers from awesome-bmlt)
  // or publish Meeting Guide feeds. Add per-fellowship national sources here. ----
  // CMA — Crystal Meth Anonymous. Regional TSML feeds (verified: returned meeting JSON).
  { id: "cma-la",  fellowship: "CMA", system: "meeting-guide", area: "CMA Los Angeles",  url: "https://cmainla.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "cma-az",  fellowship: "CMA", system: "meeting-guide", area: "CMA Arizona",      url: "https://cmaaz.org/wp-admin/admin-ajax.php?action=meetings" },
  // MA — Marijuana Anonymous. National site confirmed running TSML (12_step_meeting_list
  // plugin); WAF blocks the sandbox fetcher but it serves JSON from CI / a real server.
  { id: "ma-national", fellowship: "MA", system: "meeting-guide", area: "Marijuana Anonymous (national)", url: "https://marijuana-anonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // CANDIDATES — endpoint responded behind a WAF/JS challenge from the sandbox (403 /
  // JS redirect), consistent with a TSML site. ingest() skips any that don't return a
  // usable JSON array, so these are safe to include; verify counts from the CI run.
  { id: "coda-national", fellowship: "CoDA", system: "meeting-guide", area: "Co-Dependents Anonymous (national)", url: "https://coda.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "ha-national",   fellowship: "HA",   system: "meeting-guide", area: "Heroin Anonymous (national)",        url: "https://heroinanonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // SLAA — Sex & Love Addicts Anonymous. No single open national feed (the FWS site uses
  // a custom portal), but regional intergroups run TSML. Greater Delaware Valley VERIFIED
  // (~150 meetings) and conveniently covers PA/NJ/DE/MD/VA/DC. NY is a candidate.
  { id: "slaa-dvi", fellowship: "SLAA", system: "meeting-guide", area: "SLAA Greater Delaware Valley (PA/NJ/DE/MD/VA/DC)", url: "https://slaadvi.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "slaa-ny",  fellowship: "SLAA", system: "meeting-guide", area: "SLAA New York",                                 url: "https://www.slaany.org/wp-admin/admin-ajax.php?action=meetings" },
  // EDA — Eating Disorders Anonymous. National TSML feed VERIFIED (~100 meetings).
  { id: "eda-national", fellowship: "EDA", system: "meeting-guide", area: "Eating Disorders Anonymous (national)", url: "https://eatingdisordersanonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // Al-Anon — national site is closed, but state intergroups run TSML. GA + PA VERIFIED
  // (~150 / ~100). Alateen meetings are included within these feeds (tagged), so they
  // surface under Al-Anon rather than as a separate source (avoids double-pull dupes).
  { id: "alanon-ga", fellowship: "Al-Anon", system: "meeting-guide", area: "Georgia Al-Anon",       url: "https://www.ga-al-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "alanon-pa", fellowship: "Al-Anon", system: "meeting-guide", area: "Pennsylvania Al-Anon",  url: "https://pa-al-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  // CANDIDATES — confirmed TSML (12_step_meeting_list meta tag) but WAF/robots-blocked
  // from the sandbox; pull fine from CI. DA source is DC-area (double-down bonus).
  { id: "da-dc",           fellowship: "DA",       system: "meeting-guide", area: "Capital Area Debtors Anonymous (Washington DC)", url: "https://debtorsanonymousdc.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "ua-national",     fellowship: "UA",       system: "meeting-guide", area: "Underearners Anonymous (national)",              url: "https://www.underearnersanonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aca-az",          fellowship: "ACA",      system: "meeting-guide", area: "ACA Arizona Intergroup",                         url: "https://aca-arizona.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "naranon-national",fellowship: "Nar-Anon", system: "meeting-guide", area: "Nar-Anon Family Groups (national)",             url: "https://nar-anon.org/wp-admin/admin-ajax.php?action=meetings" },
];
