# Generated rail-station data

Per-city rail station files (`<system>.json`) consumed by `scripts/lib/stations.mjs`
to give each meeting its nearest real station, distance, and official line colors.

These are **generated** — do not hand-edit. Create/refresh them on a networked machine:

```
node scripts/build-stations.mjs
```

Then commit the resulting `*.json` files. DC (WMATA) is always bundled separately in
`scripts/lib/wmata-stations.js`, so it works even before you generate anything here.

Each file is an array of: `{ name, lat, lng, colors: ["#rrggbb"], routes: ["Red", ...], k }`
where `k` is `metro` | `train` | `tram`.
