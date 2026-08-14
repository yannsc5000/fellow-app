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
  // DC METRO double-down (2026-08-13): full-metro coverage now spans two feeds —
  //   • WAIA (aa-dc, above) = DC proper + MD suburbs (Montgomery/Prince George's; VERIFIED via
  //     aa-dc.org?tsml-region=maryland) + close-in VA (Arlington/Alexandria).
  //   • Northern Virginia Intergroup (aa-nova, below) = outer VA (Fairfax/Loudoun/Prince William).
  // dedupe() drops the close-in VA overlap between the two. That's the whole DMV.
  { id: "aa-nova", fellowship: "AA", system: "meeting-guide", area: "Northern Virginia Intergroup (Fairfax/Arlington/Alexandria/Loudoun/Prince William)", url: "https://nvintergroup.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE: ~300 mtgs; dedupes against WAIA's close-in VA. Verify on next ingest (USE_BROWSER=1 if WAF-blocked).
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
  { id: "aa-nashville",    fellowship: "AA", system: "meeting-guide", area: "Nashville TN",                 url: "https://aanashville.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-memphis",      fellowship: "AA", system: "meeting-guide", area: "Memphis TN",                   url: "https://www.memphis-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-charlotte",    fellowship: "AA", system: "meeting-guide", area: "Charlotte NC",                 url: "https://charlotteaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-raleigh",      fellowship: "AA", system: "meeting-guide", area: "Raleigh/Durham NC",           url: "https://raleighaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tampa",        fellowship: "AA", system: "meeting-guide", area: "Tampa/St. Petersburg FL",     url: "https://meetings.aatampa-area.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-orlando",      fellowship: "AA", system: "meeting-guide", area: "Orlando FL",                   url: "https://cflintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-jacksonville", fellowship: "AA", system: "meeting-guide", area: "Jacksonville FL",             url: "https://neflaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-south-palm-beach", fellowship: "AA", system: "meeting-guide", area: "South Palm Beach County FL (Delray/Boca)", url: "https://www.aainpalmbeach.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-palm-beach",   fellowship: "AA", system: "meeting-guide", area: "Palm Beach County FL",         url: "https://aa-palmbeachcounty.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-birmingham",   fellowship: "AA", system: "meeting-guide", area: "Birmingham AL",               url: "https://birminghamaa.org/wp/wp-admin/admin-ajax.php?action=meetings" },
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

  // ---- State deep-coverage pass (CA, OR, WA, CO, AZ, TX). Mostly TSML intergroup/
  // central-office feeds; several are CANDIDATE (confirmed TSML via meta tag but WAF-blocked
  // to a plain fetch — USE_BROWSER=1 pulls them). Some are regional/statewide and overlap
  // city feeds; dedupe() removes exact duplicates. ----
  // California
  { id: "aa-la-southbay",   fellowship: "AA", system: "meeting-guide", area: "South Bay LA / Torrance CA",       url: "https://asbco.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-longbeach",     fellowship: "AA", system: "meeting-guide", area: "Long Beach / Harbor Area CA",       url: "https://hacoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-oc",            fellowship: "AA", system: "meeting-guide", area: "Orange County CA",                  url: "https://www.oc-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-inland-empire", fellowship: "AA", system: "meeting-guide", area: "Inland Empire CA",                  url: "https://aainlandempire.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-ventura",       fellowship: "AA", system: "meeting-guide", area: "Ventura County CA",                 url: "https://aaventuracounty.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-santa-barbara", fellowship: "AA", system: "meeting-guide", area: "Santa Barbara CA",                  url: "https://santabarbaraaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-santa-maria",   fellowship: "AA", system: "meeting-guide", area: "Santa Maria CA",                    url: "https://aa52centraloffice.org/wp/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-slo",           fellowship: "AA", system: "meeting-guide", area: "San Luis Obispo CA",               url: "https://sloaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-eastbay",       fellowship: "AA", system: "meeting-guide", area: "East Bay / Oakland CA",            url: "https://eastbayaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sanjose",       fellowship: "AA", system: "meeting-guide", area: "San Jose / Santa Clara CA",        url: "https://aasanjose.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sanmateo",      fellowship: "AA", system: "meeting-guide", area: "San Mateo / Peninsula CA",         url: "https://aa-san-mateo.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sonoma",        fellowship: "AA", system: "meeting-guide", area: "Sonoma County CA",                 url: "https://sonomacountyaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-solano-north",  fellowship: "AA", system: "meeting-guide", area: "North Solano County CA",           url: "https://aasolanonorth.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-fresno",        fellowship: "AA", system: "meeting-guide", area: "Fresno CA",                        url: "https://www.fresnoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tulare",        fellowship: "AA", system: "meeting-guide", area: "Tulare County CA",                 url: "https://aa-tulareco.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-bakersfield",   fellowship: "AA", system: "meeting-guide", area: "Bakersfield / Kern County CA",     url: "https://kerncountyaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-central-valley",fellowship: "AA", system: "meeting-guide", area: "Modesto / Central Valley CA",      url: "https://cviaa.org/aa/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-desert",        fellowship: "AA", system: "meeting-guide", area: "Palm Springs / Desert CA",         url: "https://aainthedesert.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-humboldt",      fellowship: "AA", system: "meeting-guide", area: "Humboldt / North Coast CA",        url: "https://aahumboldtdelnorte.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-monterey",      fellowship: "AA", system: "meeting-guide", area: "Monterey Bay CA",                  url: "https://www.aamonterey.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-salinas",       fellowship: "AA", system: "meeting-guide", area: "Salinas Valley CA",               url: "https://aasalinas.org/wp-admin/admin-ajax.php?action=meetings" },
  // Oregon
  { id: "aa-oregon",        fellowship: "AA", system: "meeting-guide", area: "Oregon (Area 58, statewide)",      url: "https://aa-oregon.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-eugene",        fellowship: "AA", system: "meeting-guide", area: "Eugene OR",                        url: "https://eviaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-salem",         fellowship: "AA", system: "meeting-guide", area: "Salem OR",                         url: "https://aasalem.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-bend",          fellowship: "AA", system: "meeting-guide", area: "Bend / Central Oregon",            url: "https://coigaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-medford",       fellowship: "AA", system: "meeting-guide", area: "Medford / Jackson County OR",      url: "https://jccoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-corvallis",     fellowship: "AA", system: "meeting-guide", area: "Corvallis / Mid-Willamette OR",    url: "https://aaoregon-district21.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-oregon-coast",  fellowship: "AA", system: "meeting-guide", area: "Oregon Coast (District 8)",        url: "https://aaoregondistrict8.com/wp-admin/admin-ajax.php?action=meetings" },
  // Washington
  { id: "aa-wa-area72",     fellowship: "AA", system: "meeting-guide", area: "Western WA (Area 72: Tacoma/Everett/Snohomish)", url: "https://area72aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-olympia",       fellowship: "AA", system: "meeting-guide", area: "Olympia / South Sound WA",         url: "https://aadistrict8.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-grays-harbor",  fellowship: "AA", system: "meeting-guide", area: "Grays Harbor WA",                  url: "https://aa21.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-nc-wa",         fellowship: "AA", system: "meeting-guide", area: "North Central WA (Wenatchee, Area 92)", url: "https://area92aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-vancouver-wa",  fellowship: "AA", system: "meeting-guide", area: "Vancouver WA",                     url: "https://vancouveraa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-sw-wa-coast",   fellowship: "AA", system: "meeting-guide", area: "SW WA Coast (District 27)",        url: "https://district27area72aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tri-cities",    fellowship: "AA", system: "meeting-guide", area: "Tri-Cities WA",                    url: "https://3citiesaa.org/wp-admin/admin-ajax.php?action=meetings" },
  // Colorado
  { id: "aa-boulder",       fellowship: "AA", system: "meeting-guide", area: "Boulder County CO",                url: "https://bouldercountyaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-noco",          fellowship: "AA", system: "meeting-guide", area: "Fort Collins / Northern CO",       url: "https://nocoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-pueblo",        fellowship: "AA", system: "meeting-guide", area: "Pueblo / Southern CO",             url: "https://www.puebloaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-western-co",    fellowship: "AA", system: "meeting-guide", area: "Grand Junction / Western Slope CO", url: "https://aa-westerncolorado.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-summit-co",     fellowship: "AA", system: "meeting-guide", area: "Summit County CO (District 17)",   url: "https://district17coloradoaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-eagle-vail",    fellowship: "AA", system: "meeting-guide", area: "Eagle / Vail CO (District 14)",    url: "https://coaadistrict14.org/wp-admin/admin-ajax.php?action=meetings" },
  // Arizona
  { id: "aa-az-area03",     fellowship: "AA", system: "meeting-guide", area: "Arizona (Area 03, statewide)",     url: "https://area03.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-east-valley",   fellowship: "AA", system: "meeting-guide", area: "East Valley / Mesa AZ",            url: "https://aamesaaz.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-flagstaff",     fellowship: "AA", system: "meeting-guide", area: "Flagstaff / Northern AZ",          url: "https://flagstaffaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-prescott",      fellowship: "AA", system: "meeting-guide", area: "Prescott AZ",                      url: "https://prescottaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-verde-valley",  fellowship: "AA", system: "meeting-guide", area: "Verde Valley AZ (Sedona/Cottonwood)", url: "https://centralmountain.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-yuma",          fellowship: "AA", system: "meeting-guide", area: "Yuma AZ",                          url: "https://aayuma.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-pinal",         fellowship: "AA", system: "meeting-guide", area: "Casa Grande / Pinal County AZ",    url: "https://aapinalcounty.org/wp-admin/admin-ajax.php?action=meetings" },
  // Texas
  { id: "aa-nw-texas",      fellowship: "AA", system: "meeting-guide", area: "NW Texas Area 66 (El Paso/Lubbock/Amarillo/Midland)", url: "https://nwta66.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-corpus",        fellowship: "AA", system: "meeting-guide", area: "Corpus Christi TX",                url: "https://www.cbiaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-rgv",           fellowship: "AA", system: "meeting-guide", area: "Rio Grande Valley TX (McAllen)",   url: "https://aargvdist10.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-abilene",       fellowship: "AA", system: "meeting-guide", area: "Abilene TX (District 71)",         url: "https://district71.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-centex",        fellowship: "AA", system: "meeting-guide", area: "Waco / Killeen TX",                url: "https://centexintergroup.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tyler",         fellowship: "AA", system: "meeting-guide", area: "Tyler / East Texas TX",            url: "https://www.tyler-aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-brazos-valley", fellowship: "AA", system: "meeting-guide", area: "College Station / Bryan TX",       url: "https://bvig.org/wp-admin/admin-ajax.php?action=meetings" },

  // ---- Metro-coverage expansion (2026-08-10): gap metros + two previously-uncovered states.
  // VERIFIED = confirmed TSML; CANDIDATE (state feeds + a few) = 12_step_meeting_list meta tag /
  // tsml-* patterns confirmed but endpoint bot-blocked from research — USE_BROWSER=1 pulls them. ----
  // South / Gulf
  { id: "aa-baton-rouge",   fellowship: "AA", system: "meeting-guide", area: "Baton Rouge LA",                    url: "https://aabatonrouge.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-huntsville",    fellowship: "AA", system: "meeting-guide", area: "Huntsville AL",                     url: "https://aahuntsvilleal.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-mobile",        fellowship: "AA", system: "meeting-guide", area: "Mobile AL (SW Alabama)",            url: "https://mobileaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-mississippi",   fellowship: "AA", system: "meeting-guide", area: "Mississippi (statewide, covers Jackson)", url: "https://aa-mississippi.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE — Jackson intergroup is PDF-only; statewide TSML instead
  // Midwest
  { id: "aa-grand-rapids",  fellowship: "AA", system: "meeting-guide", area: "Grand Rapids MI (Kent County)",     url: "https://www.grandrapidsaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-dayton",        fellowship: "AA", system: "meeting-guide", area: "Dayton OH",                         url: "https://aadaytononline.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-lexington",     fellowship: "AA", system: "meeting-guide", area: "Lexington KY (Bluegrass)",          url: "https://www.bluegrassintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-kansas",        fellowship: "AA", system: "meeting-guide", area: "Kansas Area 25 (statewide, covers Wichita)", url: "https://ks-aa.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE — Wichita central office is legacy static; statewide TSML instead
  // Southeast
  { id: "aa-knoxville",     fellowship: "AA", system: "meeting-guide", area: "Knoxville TN (East Tennessee)",     url: "https://www.etiaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-chattanooga",   fellowship: "AA", system: "meeting-guide", area: "Chattanooga TN",                    url: "https://chattanooga-aa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-greensboro",    fellowship: "AA", system: "meeting-guide", area: "Greensboro NC (District 23)",       url: "https://nc23.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-winston-salem", fellowship: "AA", system: "meeting-guide", area: "Winston-Salem NC (NW Piedmont)",    url: "https://nwpi.net/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-asheville",     fellowship: "AA", system: "meeting-guide", area: "Asheville NC (District 70)",        url: "https://ashevilleaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-greenville-sc", fellowship: "AA", system: "meeting-guide", area: "Greenville SC (Upstate)",           url: "https://www.upstateintergroup.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-savannah",      fellowship: "AA", system: "meeting-guide", area: "Savannah GA",                       url: "https://savannahaa.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-fort-myers",    fellowship: "AA", system: "meeting-guide", area: "Fort Myers FL (Lee County)",        url: "https://leecountyaa.org/wp-admin/admin-ajax.php?action=meetings" },
  // Northeast
  { id: "aa-syracuse",      fellowship: "AA", system: "meeting-guide", area: "Syracuse NY (Central New York)",    url: "https://www.aasyracuse.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-western-mass",  fellowship: "AA", system: "meeting-guide", area: "Western Massachusetts (Springfield)", url: "https://westernmassaa.net/wp-admin/admin-ajax.php?action=meetings" }, // feed lives on .net, not the .org front site
  { id: "aa-lehigh-valley", fellowship: "AA", system: "meeting-guide", area: "Lehigh Valley PA (Allentown / ABE)", url: "https://www.aalv.org/wp-admin/admin-ajax.php?action=meetings" },

  // ---- Metro expansion round 2 (2026-08-10): new states VT/ND/SD + more metros, all TSML
  // VERIFIED via 12_step_meeting_list meta tag. Statewide "Area" feeds used where no metro
  // intergroup runs TSML; dedupe() removes overlap with existing metro feeds. ----
  { id: "aa-vermont",       fellowship: "AA", system: "meeting-guide", area: "Vermont (Area 70, statewide, covers Burlington)",      url: "https://aavt.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-north-dakota",  fellowship: "AA", system: "meeting-guide", area: "North Dakota (Area 78, statewide, covers Fargo)",       url: "https://aanorthdakota.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-south-dakota",  fellowship: "AA", system: "meeting-guide", area: "South Dakota (Area 63, statewide, covers Sioux Falls)", url: "https://area63aa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-green-bay",     fellowship: "AA", system: "meeting-guide", area: "Green Bay / Appleton WI (Fox Valley)",                  url: "https://www.greenbayaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-minnesota",     fellowship: "AA", system: "meeting-guide", area: "Minnesota (Area 35, statewide, covers Duluth + outstate)", url: "https://aaminnesota.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-lincoln",       fellowship: "AA", system: "meeting-guide", area: "Lincoln NE",                                            url: "https://lincaa.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-roanoke",       fellowship: "AA", system: "meeting-guide", area: "Roanoke VA (Roanoke Valley)",                           url: "https://aaroanoke.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-tallahassee",   fellowship: "AA", system: "meeting-guide", area: "Tallahassee FL (Big Bend, Intergroup 5)",              url: "https://intergroup5.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "aa-montgomery",    fellowship: "AA", system: "meeting-guide", area: "Montgomery AL (Central Alabama)",                       url: "https://centralalaa.org/wp-admin/admin-ajax.php?action=meetings" },

  // ---- Intergroup scan pass (2026-08-13): gap metros not yet covered. Confirmed the
  // intergroup runs TSML where a plain fetch succeeded (VERIFIED); the rest are CANDIDATE
  // (modern intergroup TSML site, but robots/WAF-blocked from the sandbox — ingest skips any
  // that don't return a JSON array, and USE_BROWSER=1 pulls the bot-blocked ones). ----
  { id: "aa-new-orleans",  fellowship: "AA", system: "meeting-guide", area: "New Orleans LA (Greater New Orleans)",       url: "https://aaneworleans.org/wp-admin/admin-ajax.php?action=meetings" }, // VERIFIED: TSML meeting finder (tsml-day/tsml-region)
  { id: "aa-delaware",     fellowship: "AA", system: "meeting-guide", area: "Wilmington DE (Northern Delaware Intergroup)", url: "https://ndiaa.org/wp-admin/admin-ajax.php?action=meetings" }, // VERIFIED: 12_step_meeting_list 3.19.16
  { id: "aa-pittsburgh",   fellowship: "AA", system: "meeting-guide", area: "Pittsburgh PA (Area Central Office)",          url: "https://www.pghaa.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE: robots-blocked; pghaa.org/meetings is a TSML finder
  { id: "aa-broward",      fellowship: "AA", system: "meeting-guide", area: "Fort Lauderdale FL (Broward County Intergroup)", url: "https://aabroward.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE
  { id: "aa-suffolk-ny",   fellowship: "AA", system: "meeting-guide", area: "Suffolk County NY (east Long Island)",         url: "https://suffolkny-aa.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE: complements Nassau (aa-longisland)
  { id: "aa-fairfield-ct", fellowship: "AA", system: "meeting-guide", area: "Fairfield County CT (Stamford/Norwalk, SW CT)", url: "https://www.iafc-aa.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE: complements Hartford (aa-ct)
  { id: "aa-new-mexico",   fellowship: "AA", system: "meeting-guide", area: "New Mexico (Area 46, statewide, covers Santa Fe)", url: "https://nm-aa.org/wp-admin/admin-ajax.php?action=meetings" }, // CANDIDATE: statewide; dedupes vs Albuquerque; Santa Fe city site is PDF-only
  // Checked but NOT TSML (need a custom adapter, tracked for later): Milwaukee (aamilwaukee.com,
  // legacy index.php CMS), Northern NJ (nnjaa.org, cgi-bin/Perl), Worcester MA (aaworcester.org,
  // ASP.NET AAStarterKit). Westchester/Putnam NY already covered inside the NY Intergroup feed.

  // ---- Other fellowships — many are on BMLT (add their root servers from awesome-bmlt)
  // or publish Meeting Guide feeds. Add per-fellowship national sources here. ----
  // CMA — Crystal Meth Anonymous. Regional TSML feeds (verified: returned meeting JSON).
  { id: "cma-la",  fellowship: "CMA", system: "meeting-guide", area: "CMA Los Angeles",  url: "https://cmainla.com/wp-admin/admin-ajax.php?action=meetings" },
  { id: "cma-az",  fellowship: "CMA", system: "meeting-guide", area: "CMA Arizona",      url: "https://cmaaz.org/wp-admin/admin-ajax.php?action=meetings" },
  // MA — Marijuana Anonymous. National site confirmed running TSML (12_step_meeting_list
  // plugin); WAF blocks the sandbox fetcher but it serves JSON from CI / a real server.
  { id: "ma-national", fellowship: "MA", system: "meeting-guide", area: "Marijuana Anonymous (national)", url: "https://marijuana-anonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // RD — Recovery Dharma (Buddhist-inspired). National site runs TSML (12_step_meeting_list
  // 3.19.16); endpoint verified returning meeting JSON with lat/lng + Zoom links.
  { id: "rd-national", fellowship: "RD", system: "meeting-guide", area: "Recovery Dharma (national)", url: "https://recoverydharma.org/wp-admin/admin-ajax.php?action=meetings" },
  // CANDIDATES — endpoint responded behind a WAF/JS challenge from the sandbox (403 /
  // JS redirect), consistent with a TSML site. ingest() skips any that don't return a
  // usable JSON array, so these are safe to include; verify counts from the CI run.
  // CoDA migrated off TSML to The Events Calendar (verified 2026-08-14: page exposes tec-api, no
  // 12_step_meeting_list) — the old admin-ajax URL is dead. Pull via the Tribe Events REST API instead.
  { id: "coda-national", fellowship: "CoDA", system: "tribe-events", area: "Co-Dependents Anonymous (national)", url: "https://coda.org/wp-json/tribe/events/v1/events" },
  { id: "ha-national",   fellowship: "HA",   system: "meeting-guide", area: "Heroin Anonymous (national)",        url: "https://heroinanonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // SLAA — Sex & Love Addicts Anonymous. No single open national feed (the FWS site uses
  // a custom portal), but regional intergroups run TSML. Greater Delaware Valley VERIFIED
  // (~150 meetings) and conveniently covers PA/NJ/DE/MD/VA/DC. NY is a candidate.
  { id: "slaa-dvi", fellowship: "SLAA", system: "meeting-guide", area: "SLAA Greater Delaware Valley (PA/NJ/DE/MD/VA/DC)", url: "https://slaadvi.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "slaa-ny",  fellowship: "SLAA", system: "meeting-guide", area: "SLAA New York",                                 url: "https://www.slaany.org/wp-admin/admin-ajax.php?action=meetings" },
  // EDA — Eating Disorders Anonymous. National TSML feed VERIFIED (~100 meetings).
  { id: "eda-national", fellowship: "EDA", system: "meeting-guide", area: "Eating Disorders Anonymous (national)", url: "https://eatingdisordersanonymous.org/wp-admin/admin-ajax.php?action=meetings" },
  // Al-Anon — national site (al-anon.org) runs its own meeting-search portal, not an open TSML
  // feed, so we aggregate the state/area intergroups that DO run TSML. Alateen meetings are
  // included within these feeds (tagged), so they surface under Al-Anon rather than as a separate
  // source (avoids double-pull dupes). Many big-state areas (TX, NY, …) just point to the national
  // search and self-host nothing, so coverage grows area by area.
  // VERIFIED TSML 3.19.16, root install (2026-08-14): GA, PA, MD, OH-Cleveland.
  { id: "alanon-ga",           fellowship: "Al-Anon", system: "meeting-guide", area: "Georgia Al-Anon",              url: "https://www.ga-al-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "alanon-pa",           fellowship: "Al-Anon", system: "meeting-guide", area: "Pennsylvania Al-Anon",         url: "https://pa-al-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "alanon-md",           fellowship: "Al-Anon", system: "meeting-guide", area: "Maryland Al-Anon",             url: "https://alanon-maryland.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "alanon-oh-cleveland", fellowship: "Al-Anon", system: "meeting-guide", area: "Cleveland Al-Anon (Ohio)",     url: "https://www.clevelandal-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  // CANDIDATES — confirmed TSML 3.19.16 but the admin-ajax path is unverified. N.CA serves its
  // meetings under /blog/, so WordPress is likely installed there (root fallback if this returns 0);
  // NC District 6 matched the TSML "Meetings Archive" pattern but wasn't fetched directly.
  { id: "alanon-ca-north",     fellowship: "Al-Anon", system: "meeting-guide", area: "Northern California Al-Anon (NCWSA)", url: "https://northernca-al-anon.org/blog/wp-admin/admin-ajax.php?action=meetings" },
  { id: "alanon-nc-d6",        fellowship: "Al-Anon", system: "meeting-guide", area: "North Carolina Al-Anon (District 6)", url: "https://alanonalateen6nc.org/wp-admin/admin-ajax.php?action=meetings" },
  // CANDIDATES — confirmed TSML (12_step_meeting_list meta tag) but WAF/robots-blocked
  // from the sandbox; pull fine from CI. DA source is DC-area (double-down bonus).
  // DA-DC: verified 2026-08-14 still valid TSML 3.19.16 (also runs The Events Calendar for "events",
  // but meetings are TSML) — so its 0 count is a WAF block, not a stale feed; recovers on a
  // browser-enabled ingest (CI USE_BROWSER=1 or a residential-IP run).
  { id: "da-dc",           fellowship: "DA",       system: "meeting-guide", area: "Capital Area Debtors Anonymous (Washington DC)", url: "https://debtorsanonymousdc.org/wp-admin/admin-ajax.php?action=meetings" },
  // UA: migrated off TSML to The Events Calendar (verified 2026-08-14, same as CoDA) — old admin-ajax
  // URL was dead. Repointed to the Tribe Events REST API (see the tribe-events adapter).
  { id: "ua-national",     fellowship: "UA",       system: "tribe-events", area: "Underearners Anonymous (national)",              url: "https://www.underearnersanonymous.org/wp-json/tribe/events/v1/events" },
  { id: "aca-az",          fellowship: "ACA",      system: "meeting-guide", area: "ACA Arizona Intergroup",                         url: "https://aca-arizona.org/wp-admin/admin-ajax.php?action=meetings" },
  { id: "naranon-national",fellowship: "Nar-Anon", system: "meeting-guide", area: "Nar-Anon Family Groups (national)",             url: "https://nar-anon.org/wp-admin/admin-ajax.php?action=meetings" },
  // SIA — Survivors of Incest Anonymous. National TSML feed VERIFIED (live JSON array with
  // name/day/time/formatted_address/conference_url/types; 12_step_meeting_list 3.19.15).
  { id: "sia-national", fellowship: "SIA", system: "meeting-guide", area: "Survivors of Incest Anonymous (national)", url: "https://siawso.org/wp-admin/admin-ajax.php?action=meetings" },
  // SCA — Sexual Compulsives Anonymous. National site runs TSML (12_step_meeting_list 3.19.16
  // meta tag + tsml-region/tsml-day patterns); WordPress install is in the /WP/ subdirectory.
  { id: "sca-national", fellowship: "SCA", system: "meeting-guide", area: "Sexual Compulsives Anonymous (national)", url: "https://sca-recovery.org/WP/wp-admin/admin-ajax.php?action=meetings" },
];
