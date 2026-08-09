# Fellow — National-first rollout plan

Goal: a **national** live MVP (all fellowships, US-wide), then hone into DC.
The UI is done; "national" is a **data-aggregation + infra** effort. Here's the path.

## Why Typesense (not client-side) for national
A national dataset is 100k+ meetings. That's too large to ship to the browser as a
static file, so search runs server-side. Typesense gives instant geo-search + typo
tolerance and is already wired (`src/lib/typesense.ts`, `scripts/index.mjs`).
(The self-contained prototype's client-side search stays our design reference and is
fine for a single metro, but the national app uses Typesense.)

## The data sources (verified)
- **NA + other BMLT fellowships → BMLT "tomato" aggregator.** Federates root servers
  nationwide from one host: `https://tomato.bmlt.app/main_server/client_interface/json/?switcher=GetSearchResults`.
  Ingest pulls per-US-state (already implemented in `ingest.mjs`) to keep responses sane.
  Root-server registry: github.com/bmlt-enabled/awesome-bmlt.
- **AA → Meeting Guide intergroup feeds.** No single national endpoint; the official app
  aggregates ~400+ intergroup feeds. Each is a JSON feed (often `…/wp-admin/admin-ajax.php?action=meetings`)
  discoverable via `<link rel="alternate" type="application/json">` in the site's HTML head.
  Populate `scripts/lib/registry.mjs` — start with the largest metros (cover most of the
  population), then grow the long tail.
- **Other fellowships (OA, GA, SLAA, CoDA, Al-Anon, …):** many run BMLT (add their root
  servers) or publish Meeting Guide feeds or their own national online directories. Add per
  fellowship. Online-only meetings are national by nature.
- **Missing coordinates → US Census geocoder** (free, no key): `GEOCODE=1 npm run ingest`
  (`scripts/lib/geocode.mjs`). Needed because some feeds omit lat/lng.

## Phased plan
**Phase 0 — infra (½ day):** create a Typesense Cloud cluster (free tier to start);
set `TYPESENSE_*` + `NEXT_PUBLIC_TYPESENSE_*`; deploy the Next app to Vercel.

**Phase 1 — national breadth (the real work):**
1. NA nationwide via tomato (works today): `npm run ingest && npm run index`.
2. AA: add top ~50 metro intergroup feeds to the registry → majority of AA meetings.
3. Add other fellowships' national/aggregated sources as available.
4. `GEOCODE=1` to fill coordinate gaps.
5. Dedupe (already in ingest) across overlapping sources.

**Phase 2 — freshness:** schedule ingest+index (GitHub Action / cron / serverless).
Meeting Guide refreshes ~twice daily; run daily or twice-daily. Make it incremental.

**Phase 3 — hone into DC:** partner with WAIA + CPRNA for authoritative local data,
add DC transit line colors via GTFS (`GTFS_DIR=…`, already supported), tune ranking so
"near me" + soonest surfaces the best local options.

## Discovery helper (AA feed enumeration)
To grow the AA registry quickly, crawl candidate intergroup sites for the feed `<link>` tag:
```
fetch(siteUrl) → parse <link rel="alternate" type="application/json" href=…>
```
Seed from AA.org's intergroup directory; store discovered feeds in the registry.

## Cost (rough)
Typesense Cloud small cluster + Vercel hobby/pro + a scheduled job = low monthly.
All data sources are free/open. No per-map-load fees (MapLibre + OSM).

## Open questions
- Attribution/traditions per fellowship (non-affiliation, anonymity) — keep the five
  governance principles; confirm any per-fellowship naming/marks constraints.
- Dedup strategy across AA intergroup overlaps + online directories (key on name+day+time+addr; refine).
