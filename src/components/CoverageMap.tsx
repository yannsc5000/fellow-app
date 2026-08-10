"use client";
import { useMemo, useState } from "react";
import type { Coverage } from "@/lib/coverage";
import { fellowshipName } from "@/lib/fellowships";

// geofacet-style US tile grid: state -> [row, col] (1-indexed, 8 rows x 11 cols)
const GRID: Record<string, [number, number]> = {
  AK: [1, 1], ME: [1, 11], WI: [2, 6], VT: [2, 10], NH: [2, 11],
  WA: [3, 1], ID: [3, 2], MT: [3, 3], ND: [3, 4], MN: [3, 5], IL: [3, 6], MI: [3, 7], NY: [3, 9], MA: [3, 10], RI: [3, 11],
  OR: [4, 1], NV: [4, 2], WY: [4, 3], SD: [4, 4], IA: [4, 5], IN: [4, 6], OH: [4, 7], PA: [4, 8], NJ: [4, 9], CT: [4, 10],
  CA: [5, 1], UT: [5, 2], CO: [5, 3], NE: [5, 4], MO: [5, 5], KY: [5, 6], WV: [5, 7], VA: [5, 8], MD: [5, 9], DE: [5, 10],
  AZ: [6, 2], NM: [6, 3], KS: [6, 4], AR: [6, 5], TN: [6, 6], NC: [6, 7], SC: [6, 8], DC: [6, 9],
  OK: [7, 4], LA: [7, 5], MS: [7, 6], AL: [7, 7], GA: [7, 8],
  HI: [8, 1], TX: [8, 4], FL: [8, 9],
};
const NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "Washington, D.C.",
};
const STATES = Object.keys(GRID);
const fmt = (n: number) => n.toLocaleString("en-US");
const short = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n));

export default function CoverageMap({ data }: { data: Coverage }) {
  const [sel, setSel] = useState<string>("__all");
  const [tip, setTip] = useState<{ st: string; x: number; y: number } | null>(null);

  const countFor = (st: string) => {
    const o = data.byState[st];
    if (!o) return 0;
    return sel === "__all" ? o.__all || 0 : o[sel] || 0;
  };

  // 6 levels via log scale, relative to the selected view's busiest state.
  const { levels, max, covered } = useMemo(() => {
    let max = 0;
    for (const st of STATES) max = Math.max(max, countFor(st));
    const denom = Math.log(max + 1) || 1;
    const levels: Record<string, number> = {};
    let covered = 0;
    for (const st of STATES) {
      const c = countFor(st);
      if (c > 0) covered++;
      levels[st] = c <= 0 ? 0 : Math.min(6, Math.max(1, Math.ceil((Math.log(c + 1) / denom) * 6)));
    }
    return { levels, max, covered };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const label = sel === "__all" ? "all fellowships" : fellowshipName(sel);
  const chips: [string, string][] = [["__all", "All"], ...data.fellowships.map((f) => [f, f] as [string, string])];

  return (
    <div className="cov">
      <div className="cov-fells" role="group" aria-label="Choose a fellowship">
        {chips.map(([key, lab]) => (
          <button key={key} className="cov-fell" aria-pressed={sel === key} onClick={() => setSel(key)}>
            {lab} <span className="cov-c">{fmt(key === "__all" ? data.placed : data.inPerson[key] || 0)}</span>
          </button>
        ))}
      </div>
      <p className="cov-hint">
        Showing {label} — <strong>{fmt(sel === "__all" ? data.placed : data.inPerson[sel] || 0)}</strong> in-person
        meetings across {covered} states.
      </p>

      <div className="cov-mapcard">
        <div className="cov-grid" role="img" aria-label={`U.S. map of ${label} meeting counts by state`}>
          {STATES.map((st) => {
            const [r, c] = GRID[st];
            const n = countFor(st);
            const lvl = levels[st];
            return (
              <div
                key={st}
                className={"cov-cell" + (lvl === 0 ? " cov-empty" : "")}
                data-lvl={lvl}
                style={{ gridRow: r, gridColumn: c }}
                onMouseMove={(e) => setTip({ st, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTip(null)}
              >
                <span className="cov-ab">{st}</span>
                <span className="cov-cn">{short(n)}</span>
              </div>
            );
          })}
        </div>
        <div className="cov-legend">
          <span className="cov-lab">fewer</span>
          <span className="cov-ramp" aria-hidden />
          <span className="cov-lab">{max ? `more · up to ${fmt(max)}` : "more"}</span>
          <span className="cov-emp"><i aria-hidden /> none indexed</span>
        </div>
      </div>

      {tip && (() => {
        const o = data.byState[tip.st] || {};
        const n = countFor(tip.st);
        return (
          <div className="cov-tip" style={{ left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 232), top: tip.y + 14 }}>
            <div className="cov-tip-t">{NAME[tip.st]}</div>
            <div className="cov-tip-r"><span>{label}</span><b>{fmt(n)}</b></div>
            {sel === "__all"
              ? <div className="cov-tip-r"><span>AA / NA</span><b>{fmt(o.AA || 0)} / {fmt(o.NA || 0)}</b></div>
              : <div className="cov-tip-r"><span>all fellowships</span><b>{fmt(o.__all || 0)}</b></div>}
          </div>
        );
      })()}
    </div>
  );
}
