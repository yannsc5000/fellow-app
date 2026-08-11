import type { Metadata } from "next";
import Link from "next/link";
import { getDataHealth, type Severity, type Recommendation } from "@/lib/studio";
import { Mark } from "@/components/Mark";

// Internal-only data-health dashboard. noindex/nofollow + disallowed in robots + absent from the
// sitemap — this page is for the team, not for search. Everything shown is computed at build from
// the committed dataset (see lib/studio.ts); no live calls, no fabricated numbers.
export const metadata: Metadata = {
  title: "Fellow Studio — data health (internal)",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const pctStr = (n: number) => `${n}%`;

const SEV: Record<Severity, { label: string; glyph: string; cls: string }> = {
  serious: { label: "Act now", glyph: "▲", cls: "sv-serious" },
  warning: { label: "Watch", glyph: "●", cls: "sv-warning" },
  info: { label: "Note", glyph: "◆", cls: "sv-info" },
  good: { label: "Healthy", glyph: "✓", cls: "sv-good" },
};

function Kpi({ n, label, sub, accent }: { n: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className="st-kpi">
      <div className={"st-kpi-n" + (accent ? " st-kpi-accent" : "")}>{n}</div>
      <div className="st-kpi-l">{label}</div>
      {sub ? <div className="st-kpi-sub">{sub}</div> : null}
    </div>
  );
}

function RecRow({ r }: { r: Recommendation }) {
  const s = SEV[r.severity];
  return (
    <div className={"st-rec " + s.cls}>
      <span className="st-rec-sev" aria-hidden>{s.glyph}</span>
      <div className="st-rec-body">
        <div className="st-rec-head">
          <span className="st-rec-badge">{s.label}</span>
          <span className="st-rec-title">{r.title}</span>
          {r.metric ? <span className="st-rec-metric">{r.metric}</span> : null}
        </div>
        <p className="st-rec-detail">{r.detail}</p>
      </div>
    </div>
  );
}

export default async function StudioPage() {
  const h = await getDataHealth();

  const datedPct = (n: number) => (h.datedTotal ? Math.round((n / h.datedTotal) * 100) : 0);
  const maxState = h.topStates[0]?.total || 1;
  const maxFel = h.fellowships[0]?.total || 1;

  return (
    <main className="studio" id="main-content">
      <header className="st-head">
        <div className="st-brand">
          <div className="mark" aria-hidden><Mark size={40} logo /></div>
          <div>
            <div className="st-title">Fellow Studio</div>
            <div className="st-sub">Meeting-data health · internal</div>
          </div>
        </div>
        <div className="st-head-meta">
          <span className={"st-fresh-badge " + (h.daysSinceIngest >= 90 ? "sv-serious" : h.daysSinceIngest >= 30 ? "sv-warning" : "sv-good")}>
            Ingested {h.refDate || "—"} · {h.daysSinceIngest}d ago
          </span>
          <Link href="/" className="st-exit">← Fellow</Link>
        </div>
      </header>

      <p className="st-note">
        Internal view — not indexed, not linked publicly. Figures are computed at build from the last
        ingest ({h.refDate || "unknown date"}); freshness is measured relative to that ingest, not live.
      </p>

      {/* KPIs */}
      <section className="st-kpis">
        <Kpi n={fmt(h.total)} label="Listings indexed" sub={`${fmt(h.inPerson)} in-person · ${fmt(h.online)} online`} />
        <Kpi n={fmt(h.placed)} label="Placed on the map" sub={`${h.unplaceable ? fmt(h.unplaceable) + " unplaceable" : "all placed"}`} />
        <Kpi n={`${h.statesCovered}/51`} label="States + DC covered" accent />
        <Kpi n={`${h.indexedFellowships}/${h.taxonomyFellowships}`} label="Fellowships with a feed" sub={`${h.taxonomyFellowships - h.indexedFellowships} seeded, awaiting data`} />
        <Kpi n={pctStr(h.datedTotal ? Math.round(((h.fresh + h.aging) / h.datedTotal) * 100) : 0)} label="Dated < 12 months" sub={`of ${fmt(h.datedTotal)} timestamped`} />
      </section>

      {/* Recommendations engine */}
      <section className="st-panel st-panel-wide">
        <div className="st-panel-head">
          <h2>Recommendations</h2>
          <span className="st-panel-tag">rules-based engine</span>
        </div>
        <p className="st-panel-lede">
          Deterministic rules over the metrics below — each suggestion traces to a visible number. Ranked by urgency.
        </p>
        <div className="st-recs">
          {h.recommendations.map((r, i) => <RecRow key={i} r={r} />)}
        </div>
      </section>

      <div className="st-grid">
        {/* Freshness */}
        <section className="st-panel">
          <div className="st-panel-head"><h2>Freshness</h2></div>
          <p className="st-panel-lede">Age of each listing at last ingest, for the {fmt(h.datedTotal)} that carry a source timestamp.</p>
          <div className="st-fresh-bar" role="img" aria-label={`Fresh ${h.fresh}, aging ${h.aging}, stale ${h.stale}`}>
            <span className="sf-seg sf-fresh" style={{ width: `${datedPct(h.fresh)}%` }} />
            <span className="sf-seg sf-aging" style={{ width: `${datedPct(h.aging)}%` }} />
            <span className="sf-seg sf-stale" style={{ width: `${datedPct(h.stale)}%` }} />
          </div>
          <ul className="st-legend">
            <li><span className="lg-dot sf-fresh" /> Fresh <em>&lt; 90d</em><b>{fmt(h.fresh)}</b><span className="lg-pct">{datedPct(h.fresh)}%</span></li>
            <li><span className="lg-dot sf-aging" /> Aging <em>90–365d</em><b>{fmt(h.aging)}</b><span className="lg-pct">{datedPct(h.aging)}%</span></li>
            <li><span className="lg-dot sf-stale" /> Stale <em>&gt; 365d</em><b>{fmt(h.stale)}</b><span className="lg-pct">{datedPct(h.stale)}%</span></li>
          </ul>
          <p className="st-foot">{pctStr(h.total ? Math.round((h.datedTotal / h.total) * 100) : 0)} of all listings carry a timestamp — the rest can't be aged.</p>
        </section>

        {/* Completeness */}
        <section className="st-panel">
          <div className="st-panel-head"><h2>Completeness</h2></div>
          <p className="st-panel-lede">Field fill rates. Scope noted per row — some fields only apply to part of the set.</p>
          <div className="st-fills">
            {h.fill.map((f) => (
              <div className="st-fill" key={f.key}>
                <div className="st-fill-top">
                  <span className="st-fill-l">{f.label} <em>({f.scope})</em></span>
                  <span className="st-fill-pct">{f.pct}%</span>
                </div>
                <div className="st-fill-track"><span className="st-fill-bar" style={{ width: `${f.pct}%` }} /></div>
                <div className="st-fill-sub">{fmt(f.have)} of {fmt(f.of)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* By fellowship */}
        <section className="st-panel st-panel-wide">
          <div className="st-panel-head"><h2>By fellowship</h2></div>
          <div className="st-table">
            <div className="st-tr st-th">
              <span>Fellowship</span><span className="ta-r">Listings</span><span className="ta-r">In-person</span><span className="ta-r">Online</span><span className="ta-r">Stale</span><span className="st-bar-h">Share</span>
            </div>
            {h.fellowships.map((f) => (
              <div className="st-tr" key={f.code}>
                <span className="st-fel"><span className="st-fel-dot" style={{ background: f.color }} /> {f.name} <em>{f.code}</em></span>
                <span className="ta-r">{fmt(f.total)}</span>
                <span className="ta-r">{fmt(f.inPerson)}</span>
                <span className="ta-r">{fmt(f.online)}</span>
                <span className="ta-r">{f.stalePct == null ? <span className="st-na" title="No source timestamps for this feed">n/a</span> : `${f.stalePct}%`}</span>
                <span className="st-bar-cell"><span className="st-bar" style={{ width: `${Math.round((f.total / maxFel) * 100)}%`, background: f.color }} /></span>
              </div>
            ))}
          </div>
        </section>

        {/* Geo */}
        <section className="st-panel">
          <div className="st-panel-head"><h2>Top states</h2></div>
          <div className="st-states">
            {h.topStates.map((s) => (
              <div className="st-state" key={s.st}>
                <span className="st-state-n">{s.name}</span>
                <span className="st-state-track"><span className="st-state-bar" style={{ width: `${Math.round((s.total / maxState) * 100)}%` }} /></span>
                <span className="st-state-v">{fmt(s.total)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="st-panel">
          <div className="st-panel-head"><h2>Thinnest coverage</h2></div>
          <p className="st-panel-lede">Covered states with the fewest in-person meetings — the fastest wins.</p>
          <div className="st-chips">
            {h.thinStates.map((s) => (
              <span className="st-chip" key={s.st}>{s.st} <b>{fmt(s.total)}</b></span>
            ))}
          </div>
          <p className="st-foot">{h.unplaceable ? `${fmt(h.unplaceable)} in-person listings can't be placed to a state and are excluded here.` : "Every in-person listing placed to a state."}</p>
        </section>

        {/* Sources */}
        <section className="st-panel">
          <div className="st-panel-head"><h2>Sources</h2></div>
          <div className="st-sources">
            {h.sources.map((s) => (
              <div className="st-source" key={s.source}>
                <span className="st-source-l">{s.label}</span>
                <span className="st-source-v">{fmt(s.total)}</span>
                <span className={"st-source-ts " + (s.datedPct === 0 ? "sv-serious" : s.datedPct >= 90 ? "sv-good" : "sv-warning")}>
                  {s.datedPct}% timestamped
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Growth */}
        <section className="st-panel">
          <div className="st-panel-head"><h2>Growth</h2></div>
          {h.growth.length >= 2 ? (
            <GrowthChart points={h.growth} />
          ) : (
            <div className="st-empty">
              <p><b>Baseline established.</b> One ingest recorded so far ({h.growth[0]?.date || h.refDate}, {fmt(h.total)} listings).</p>
              <p className="st-foot">Each future ingest appends a point to <code>data-history.json</code>; this becomes a trend line after the next refresh.</p>
            </div>
          )}
        </section>

        {/* Search Console */}
        <section className="st-panel st-panel-wide">
          <div className="st-panel-head">
            <h2>Search performance</h2>
            <span className={"st-panel-tag " + (h.search.connected ? "sv-good" : "sv-info")}>{h.search.connected ? "Search Console" : "not connected"}</span>
          </div>
          {h.search.connected ? (
            <>
              <div className="st-sc-kpis">
                <div className="st-sc-kpi"><div className="st-sc-n">{fmt(h.search.clicks)}</div><div className="st-sc-l">Clicks</div></div>
                <div className="st-sc-kpi"><div className="st-sc-n">{fmt(h.search.impressions)}</div><div className="st-sc-l">Impressions</div></div>
                <div className="st-sc-kpi"><div className="st-sc-n">{(h.search.ctr * 100).toFixed(1)}%</div><div className="st-sc-l">CTR</div></div>
                <div className="st-sc-kpi"><div className="st-sc-n">{h.search.position.toFixed(1)}</div><div className="st-sc-l">Avg position</div></div>
              </div>
              {h.search.topQueries.length > 0 && (
                <div className="st-table st-sc-table">
                  <div className="st-tr st-th"><span>Top query</span><span className="ta-r">Clicks</span><span className="ta-r">Impr.</span><span className="ta-r">Pos.</span></div>
                  {h.search.topQueries.map((q, i) => (
                    <div className="st-tr" key={i}><span>{q.query}</span><span className="ta-r">{fmt(q.clicks)}</span><span className="ta-r">{fmt(q.impressions)}</span><span className="ta-r">{q.position.toFixed(1)}</span></div>
                  ))}
                </div>
              )}
              <p className="st-foot">Search Console export · {h.search.range}.</p>
            </>
          ) : (
            <div className="st-empty">
              <p><b>Search Console isn&apos;t wired up yet.</b> Once connected, this panel shows what people actually search, which pages rank where, and which seeded pages already pull impressions — and the recommendations engine folds that demand in, so a low-ranking page with real traffic jumps the priority queue ahead of a quiet one.</p>
              <p className="st-foot">
                To connect: drop a periodic Search Console export at <code>src/lib/search-console.json</code>
                {" "}(<code>{`{ clicks, impressions, ctr, position, topQueries[], opportunities[] }`}</code>). The build reads it — no live auth, no fabricated numbers. Until then the engine skips demand-based rules.
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="st-footer">
        Fellow Studio · generated at build from the {h.refDate || "latest"} ingest · internal, not indexed.
      </footer>
    </main>
  );
}

// Minimal inline line chart for the growth series (no client JS). Draws total-listings over time
// as an SVG polyline with dot markers; area fill under it for weight. Grows into a real trend as
// ingests accumulate.
function GrowthChart({ points }: { points: { date: string; total: number; inPerson: number; online: number }[] }) {
  const W = 640, H = 180, PAD = 28;
  const xs = points.map((_, i) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1));
  const vals = points.map((p) => p.total);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const line = points.map((p, i) => `${xs[i]},${y(p.total)}`).join(" ");
  const area = `${xs[0]},${H - PAD} ${line} ${xs[xs.length - 1]},${H - PAD}`;
  const last = points[points.length - 1], first = points[0];
  const delta = last.total - first.total;
  return (
    <div className="st-growth">
      <svg viewBox={`0 0 ${W} ${H}`} className="st-growth-svg" preserveAspectRatio="none" role="img" aria-label="Total listings over time">
        <polygon points={area} className="st-growth-area" />
        <polyline points={line} className="st-growth-line" />
        {points.map((p, i) => <circle key={i} cx={xs[i]} cy={y(p.total)} r={3.5} className="st-growth-dot" />)}
      </svg>
      <div className="st-growth-foot">
        <span>{first.date}</span>
        <span className={delta >= 0 ? "sv-good" : "sv-serious"}>{delta >= 0 ? "+" : ""}{fmt(delta)} listings</span>
        <span>{last.date}</span>
      </div>
    </div>
  );
}
