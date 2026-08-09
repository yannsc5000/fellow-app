# Fellow — Phase 0: deploy (Typesense Cloud + Vercel + scheduled ingest)

Goal: a live national app with a managed search backend and auto-refreshing data —
no servers to babysit. ~30–45 minutes.

## 1. Typesense Cloud (managed search — no server to run)
1. Sign up at cloud.typesense.org and create a cluster (nearest region; free/dev tier is fine to start).
2. From the cluster dashboard, note:
   - **Host** (e.g. `xxxx.a1.typesense.net`), **Port** `443`, **Protocol** `https`
   - **Admin API key** (server-side only) and a **Search-only API key** (create one; browser-safe)
3. Collection name: `meetings`.

## 2. First index (from your machine or CI)
```bash
export TYPESENSE_HOST=xxxx.a1.typesense.net TYPESENSE_PORT=443 TYPESENSE_PROTOCOL=https
export TYPESENSE_ADMIN_API_KEY=<admin-key> NEXT_PUBLIC_TYPESENSE_COLLECTION=meetings
npm ci
npm run ingest          # national pull (NA via BMLT aggregator + AA metro feeds)
GEOCODE=1 npm run ingest # (optional) also fill missing coordinates
npm run index           # creates the collection + imports into Typesense Cloud
```

## 3. Deploy the app (Vercel)
1. Push this repo to GitHub, then "New Project" in Vercel and import it.
2. Set Environment Variables (Production):
   - `NEXT_PUBLIC_TYPESENSE_HOST` = your host
   - `NEXT_PUBLIC_TYPESENSE_PORT` = `443`
   - `NEXT_PUBLIC_TYPESENSE_PROTOCOL` = `https`
   - `NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY` = **search-only** key (never the admin key)
   - `NEXT_PUBLIC_TYPESENSE_COLLECTION` = `meetings`
3. Deploy. The app is now live and queries Typesense Cloud directly.

## 4. Keep data fresh (scheduled ingest) — already wired
Two CI options are included; use the one for your host:
- **GitLab** (`.gitlab-ci.yml`): add CI/CD **variables** (Settings → CI/CD → Variables, masked):
  `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_ADMIN_API_KEY`, `TYPESENSE_COLLECTION`.
  Then create a schedule: Build → Pipeline schedules → New schedule (e.g. twice daily). Run once to verify.
- **GitHub** (`.github/workflows/ingest.yml`): add the same as repo **secrets** (Settings → Secrets → Actions),
  then Actions → "Ingest & index meetings" → Run workflow.

## Verify after indexing (one command)
```bash
TYPESENSE_HOST=xxxx.a1.typesense.net TYPESENSE_PORT=443 TYPESENSE_PROTOCOL=https \
TYPESENSE_ADMIN_API_KEY=<key> NEXT_PUBLIC_TYPESENSE_COLLECTION=meetings \
npm run smoke
```
Checks health, document count, keyword + synonym + geo search. Exits non-zero if anything fails.

## 5. Map tiles (MapTiler)
Get a free key at maptiler.com and set `NEXT_PUBLIC_MAPTILER_KEY` in Vercel env vars.
Without it, the app falls back to OpenStreetMap raster tiles (dev only).

## Security notes
- The browser only ever gets the **search-only** key. Keep the **admin** key in CI/server env.
- Consider scoping the search key to the `meetings` collection in the Typesense dashboard.

## After Phase 0
- Grow the AA registry (`scripts/lib/registry.mjs`) toward the full ~400 intergroups.
- Add more fellowships (BMLT root servers from awesome-bmlt; other Meeting Guide feeds).
- Then hone into DC (partner data + GTFS line colors via `GTFS_DIR`).
