import Link from "next/link";
import type { Coverage } from "@/lib/coverage";

// Compact, non-interactive teaser of the live coverage choropleth — a smaller version of the
// real map on /coverage, colored from the same per-state totals. Links to the full map.
const GRID: Record<string, [number, number]> = {
  AK: [1, 1], ME: [1, 11], WI: [2, 6], VT: [2, 10], NH: [2, 11],
  WA: [3, 1], ID: [3, 2], MT: [3, 3], ND: [3, 4], MN: [3, 5], IL: [3, 6], MI: [3, 7], NY: [3, 9], MA: [3, 10], RI: [3, 11],
  OR: [4, 1], NV: [4, 2], WY: [4, 3], SD: [4, 4], IA: [4, 5], IN: [4, 6], OH: [4, 7], PA: [4, 8], NJ: [4, 9], CT: [4, 10],
  CA: [5, 1], UT: [5, 2], CO: [5, 3], NE: [5, 4], MO: [5, 5], KY: [5, 6], WV: [5, 7], VA: [5, 8], MD: [5, 9], DE: [5, 10],
  AZ: [6, 2], NM: [6, 3], KS: [6, 4], AR: [6, 5], TN: [6, 6], NC: [6, 7], SC: [6, 8], DC: [6, 9],
  OK: [7, 4], LA: [7, 5], MS: [7, 6], AL: [7, 7], GA: [7, 8],
  HI: [8, 1], TX: [8, 4], FL: [8, 9],
};

export function CoveragePromo({ data }: { data: Coverage }) {
  const totals = Object.keys(GRID).map((st) => data.byState[st]?.__all || 0);
  const max = Math.max(1, ...totals);
  const lvl = (n: number) => (n <= 0 ? 0 : n < max * 0.15 ? 1 : n < max * 0.4 ? 2 : n < max * 0.7 ? 3 : 4);
  return (
    <Link
      href="/coverage"
      className="cov-promo"
      aria-label={`Coverage map — ${data.total.toLocaleString()} meetings across ${data.statesCovered} states. Open the full map.`}
    >
      <div className="cov-promo-map" aria-hidden>
        {Object.entries(GRID).map(([st, [r, c]]) => (
          <span key={st} className="cov-promo-cell" data-lvl={lvl(data.byState[st]?.__all || 0)}
            style={{ gridRow: r, gridColumn: c }} />
        ))}
      </div>
      <div className="cov-promo-text">
        <span className="cov-promo-kicker">Coverage map</span>
        <span className="cov-promo-title">{data.total.toLocaleString()} meetings across {data.statesCovered} states</span>
        <span className="cov-promo-cta">Explore the map →</span>
      </div>
    </Link>
  );
}
