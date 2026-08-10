# Fellow

A free, accessible, non-commercial finder for 12-step recovery meetings. Two ways in:
**Search** (natural-language + filters) and **Ask Fellow** (a chat assistant). Not affiliated
with any fellowship. See the in-app **/about** page for data provenance, privacy, and anonymity.

## Features
- **Natural-language search** — type a place, ZIP, group, fellowship, or a phrase like
  “Sunday morning AA near me.” Day, time-of-day, ZIP, and “near me” are parsed into filters;
  the rest is full-text. (`src/lib/parseQuery.ts`)
- **Ask Fellow chat** — describe what you need in plain words (“my partner’s drinking is a
  problem”); an LLM maps it to the right fellowship and searches the real index. It can only
  surface meetings the search tool returns — it never invents one. (`src/app/api/chat/route.ts`)
- **Filters** — fellowship (color-coded), Today/Tomorrow, **Starts soon** (next ~90 min),
  Open / Accessible / Online. Location via “near me” or a ZIP, results within ~50 mi.
- **Per-meeting** — map + Street View, real nearest rail station with official line colors
  (where GTFS station data is generated), add-to-calendar (weekly recurring), share, and a
  “Suggest a correction” link.
- **Accessible & mobile-first** — large targets, WCAG-AA contrast (incl. the fellowship color
  system), keyboard/Escape support, light/dark.

## Stack
- **Next.js (App Router, TS)** — mobile-web/PWA shell; `/api/chat` route handler.
- **Typesense** (Cloud or self-hosted) — instant geo search + typo tolerance.
- **react-instantsearch** + **typesense-instantsearch-adapter** — headless search UI.
- **MapLibre GL + MapTiler/OpenStreetMap** — free multi-pin results map.
- **Google Maps Embed API** (optional) — inline map + Street View on the detail sheet.
- **@anthropic-ai/sdk** (Claude Haiku) — powers Ask Fellow.

## Layout
```
src/app/            layout, page (Search/Chat tabs), about/ (about + privacy), api/chat/ (LLM route)
src/components/     Finder.tsx (search UI + detail sheet), Chat.tsx (assistant), MapView.tsx, DetailMap.tsx, Icon.tsx
src/lib/            schema.ts, typesense.ts (browser adapter), serverSearch.ts (chat tool),
                    parseQuery.ts (NL parsing), fellowships.ts (taxonomy + colors), config.ts
scripts/ingest.mjs  fetch every registry feed -> normalize -> public/data/meetings.json
scripts/index.mjs   (re)create the Typesense collection + import (with an anti-regression guard)
scripts/build-stations.mjs  one-time: GTFS -> compact rail-station files (scripts/lib/stations/*.json)
scripts/lib/        registry.mjs (sources), normalize.mjs, stations.mjs, gtfs.mjs, fellowships.mjs
```

## Environment variables
Copy `.env.example`. For local dev the Typesense defaults (`localhost:8108`, key `devkey`) work.

| Var | Where | Purpose |
|---|---|---|
| `TYPESENSE_HOST` / `PORT` / `PROTOCOL` | scripts | index + server search |
| `TYPESENSE_ADMIN_API_KEY` | scripts (server) | indexing |
| `NEXT_PUBLIC_TYPESENSE_*` | browser | search-only key + host |
| `NEXT_PUBLIC_MAPTILER_KEY` | browser | vector map tiles (falls back to OSM) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | browser | inline map + Street View (optional) |
| `ANTHROPIC_API_KEY` | server (Vercel) | Ask Fellow chat; unset → chat 503s, Search still works |
| `ANTHROPIC_MODEL` | server | default `claude-haiku-4-5` |

## Data pipeline
```bash
npm run ingest        # pull every source in scripts/lib/registry.mjs -> public/data/meetings.json
npm run index         # (re)create the Typesense collection + import
```
- Many intergroup feeds sit behind Cloudflare/JS challenges. Run the browser pass to include
  them: `npm install playwright && npx playwright install chromium` then
  `USE_BROWSER=1 npm run ingest`. Some feeds only answer a residential IP, so an occasional
  ingest from a personal machine gives the fullest coverage.
- `index.mjs` refuses to replace a much larger live index with a tiny one (a blocked run),
  guarding against accidental coverage loss. Override with `FORCE_INDEX=1`.
- **Automated freshness:** `.github/workflows/ingest.yml` runs the ingest+index daily (with the
  browser pass) against Typesense Cloud secrets.
- **Real transit:** `node scripts/build-stations.mjs` downloads major rail agencies’ GTFS and
  writes compact station files; commit them and re-ingest to light up nearest-station + line
  colors beyond DC (DC/WMATA is always bundled).

## Adding feeds
Edit `scripts/lib/registry.mjs`: `{ id, fellowship, system, url, area }` where `system` is
`meeting-guide` (TSML: AA, Al-Anon, SLAA, CMA, …) or `bmlt` (NA + others). Re-run ingest + index.

## Coverage (today)
- **AA:** ~70+ metro intergroup feeds nationwide. **NA:** the BMLT aggregator (national).
- **Others with data:** CMA, MA, CoDA, HA, SLAA, EDA, Al-Anon, DA, UA, ACA, Nar-Anon.
- Only AA and NA publish broad *national* open data; other fellowships are a patchwork of
  regional intergroups, and some (e.g. Clutterers Anonymous) publish no open feed at all.
  See `claude/fellow-fellowship-feed-coverage.md` in the project for the full map.

## Deploy
- **App:** push to GitHub → Vercel builds. Set the env vars above in Vercel (Production +
  Preview). The chat needs `ANTHROPIC_API_KEY`.
- **Data:** runs against Typesense Cloud via the GitHub Action or a manual `ingest`/`index`.

## Known limitations
- Time-of-day (“tonight”, “morning”) is filtered client-side over fetched results; in a very
  dense metro a late meeting can occasionally fall outside the batch (server-side time filter is
  a straightforward follow-up).
- Ask Fellow is MVP (no streaming yet; relies on the Anthropic monthly spend cap rather than
  per-user rate limiting).

## Runbooks (in the attached project)
- `claude/fellow-refresh-runbook.md` — how to refresh data & deploy.
- `claude/fellow-phase2-chatbot-scope.md` — chatbot scope.
- `claude/fellow-fellowship-feed-coverage.md` — which fellowships have open feeds.
