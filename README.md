# Fellow — web app (Next.js + Typesense + MapLibre + InstantSearch)

Production scaffold for the Fellow meeting finder. Turns the DC data spike into a
real app: aggregated feeds → Typesense index → InstantSearch UI with a MapLibre map.

## Stack
- **Next.js (App Router, TS)** — mobile-web/PWA-ready shell.
- **Typesense** (self-hosted, free) — instant geo search, typo tolerance.
- **InstantSearch** (`react-instantsearch`) via **typesense-instantsearch-adapter** — search UI wired with hooks (headless-friendly, so you control markup + a11y).
- **MapLibre GL + OpenStreetMap** — free map, no per-load billing.
- Design tokens ported from the prototype (chunky, accessible, light/dark).

## Quick start
```bash
cp .env.example .env.local          # then export the same vars for the scripts
npm install
npm run typesense:up                # start Typesense (Docker)
npm run ingest -- --local           # build public/data/meetings.json from bundled DC snapshot
#   or: npm run ingest               # LIVE fetch (AA live; set NA_BMLT_URL for NA)
npm run index                       # create collection + import into Typesense
npm run dev                         # http://localhost:3000
```
`npm run bootstrap` chains up + ingest(live) + index.

## Layout
```
src/app/            layout, page (client Finder), globals.css (design tokens)
src/components/     Finder.tsx (InstantSearch + hooks), MapView.tsx (MapLibre)
src/lib/            schema.ts (Meeting type + Typesense schema), typesense.ts (adapter)
scripts/ingest.mjs  fetch feeds -> normalize -> public/data/meetings.json
scripts/index.mjs   create collection + import docs
scripts/lib/        the normalizer (shared with the spike)
```

## Status / verified
- ✅ `npm install`, `next build` (compile + TypeScript + lint + static export) all pass.
- ✅ `ingest --local` produces 19 DC meetings (16 AA + 3 NA) via the registry.
- ✅ Indexing transform verified (valid `_geoloc` geopoints, transit/parking JSON, facet fields).
- ⏳ Live Typesense query path not run in the build sandbox (no Docker daemon there). Locally: `npm run typesense:up` then `npm run index` and it's wired.

## First run (zero-config, local)
With **Docker Desktop running**:
```bash
npm install
npm run bootstrap:local   # starts Typesense, ingests the bundled DC data, indexes it
npm run dev               # http://localhost:3000
```
That's it — no `.env` needed for local dev (defaults: host `localhost:8108`, key `devkey`).
Use `npm run bootstrap` instead of `bootstrap:local` to pull the **live** feeds.

**Expected result:** the finder loads with DC meetings, search filters instantly, "Near me"
switches to the map, and each meeting's detail shows transit/parking with walking distance.

### No Docker? Use Typesense Cloud (free tier)
1. Create a cluster at cloud.typesense.org and copy its host + admin API key.
2. Put them in `.env.local` (`TYPESENSE_*` for scripts, `NEXT_PUBLIC_TYPESENSE_*` for the browser).
3. `npm run ingest -- --local && npm run index && npm run dev` (skip `typesense:up`).

## Real line colors + nearest transit (GTFS)
Point ingest at any agency's unzipped GTFS feed to replace the demo transit data
with the real nearest rail stop and its **official line colors** (`route_color`):
```bash
GTFS_DIR=/path/to/wmata-gtfs npm run ingest   # then npm run index
```
Works for any US agency that publishes GTFS (most do). Tested in `scripts/lib/gtfs.test.mjs`.

## Adding feeds
Edit `scripts/lib/registry.mjs` and add a source `{ id, fellowship, system, url, area }`.
`system` is `meeting-guide` (AA/Al-Anon/SLAA/most TSML) or `bmlt` (NA). Re-run `ingest` + `index`.

## Design decisions baked in
- **List is the default view**; tapping **Near me** grabs geolocation and switches to the map (spatial context when you want it). Flip the default in `Finder.tsx` (`useState("list")` → `"map"`).
- Geo: docs carry `_geoloc:[lat,lng]`; the adapter uses `aroundLatLng` (set by Near me) to sort by distance. Tune `sort_by`/`query_by` in `src/lib/typesense.ts`.
- Transit/parking travel as JSON on each doc (`transit_json`/`parking_json`) so the detail sheet renders Maps links without extra queries.

## Next
- Add feeds to the registry (more AA intergroups, SLAA, Al-Anon) — one adapter each in `scripts/lib/normalize.mjs`.
- Swap the embedded WMATA station list for full GTFS; add GBFS for live bikeshare docks.
- Scope a search-only Typesense API key for the browser (don't ship the admin key).
- Add PWA manifest + service worker; deploy Typesense (Typesense Cloud or your host).
