// Server-only: the product KPI scorecard. Reads the MVP targets (kpi-targets.json), computes each
// KPI's current value from the data-health engine + Search Console + chatbot analytics, and derives
// a status (met / approaching / on-track / at-risk) against its goal. This is the single source of
// truth for both the /studio scorecard and the scripts/kpi-alerts.mjs email engine (which mirrors
// the same thresholds). Nothing is fabricated: a KPI whose source isn't connected reads "awaiting".
import "server-only";
import { getDataHealth } from "@/lib/studio";
import targets from "@/lib/kpi-targets.json";
import chatbot from "@/lib/chatbot-analytics.json";

export type KpiStatus = "met" | "approaching" | "on_track" | "at_risk" | "na";
export type KpiDef = {
  id: string; group: string; label: string; unit: "count" | "pct" | "pos";
  dir: "up" | "down"; target: number; warn: number; near: number; source: "data" | "gsc" | "chatbot"; why: string;
};
export type Kpi = KpiDef & {
  value: number | null;
  status: KpiStatus;
  progress: number;          // 0..1 toward target
  trend: number | null;      // delta vs previous ingest snapshot, where known
  awaiting: boolean;         // source not connected yet
};
export type KpiGroup = { group: string; kpis: Kpi[] };

const DEFS = (targets as { kpis: KpiDef[] }).kpis;

// Status against target with a good-side "approaching" band and a bad-side "warn" band.
export function statusOf(d: KpiDef, v: number): KpiStatus {
  if (d.dir === "up") {
    if (v >= d.target) return "met";
    if (v <= d.warn) return "at_risk";
    if (v >= d.near * d.target) return "approaching";
    return "on_track";
  } else {
    if (v <= d.target) return "met";
    if (v >= d.warn) return "at_risk";
    if (v <= d.target * d.near) return "approaching";
    return "on_track";
  }
}
function progressOf(d: KpiDef, v: number): number {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  return d.dir === "up" ? clamp(v / d.target) : (v <= d.target ? 1 : clamp(d.target / v));
}

export async function getKpis(): Promise<{ kpis: Kpi[]; groups: KpiGroup[] }> {
  const h = await getDataHealth();
  const cb = chatbot as { connected?: boolean; totals?: { conversations: number; foundMeeting: number } };

  // Current value per KPI id. null = source not connected / not measurable yet.
  const freshnessPct = h.datedTotal ? Math.round(((h.fresh + h.aging) / h.datedTotal) * 100) : null;
  const joinPct = h.fill.find((f) => f.key === "join")?.pct ?? null;
  const thinCount = h.states.filter((s) => s.total < 50).length;
  const cbConns = cb.connected ? (cb.totals?.conversations ?? 0) : null;
  const cbHit = cb.connected && (cb.totals?.conversations ?? 0) > 0
    ? Math.round(((cb.totals?.foundMeeting ?? 0) / (cb.totals!.conversations)) * 100) : (cb.connected ? 0 : null);

  const values: Record<string, number | null> = {
    meetings: h.total,
    states: h.statesCovered,
    fellowships: h.indexedFellowships,
    thin_states: thinCount,
    freshness: freshnessPct,
    joinlink: joinPct,
    impressions: h.search.connected ? h.search.impressions : null,
    clicks: h.search.connected ? h.search.clicks : null,
    position: h.search.connected ? h.search.position : null,
    chat_queries: cbConns,
    chat_hit: cbHit,
  };

  // Trend for the meetings KPI comes from the growth history (previous ingest → latest).
  const g = h.growth;
  const meetingsTrend = g.length >= 2 ? g[g.length - 1].total - g[g.length - 2].total : null;

  const kpis: Kpi[] = DEFS.map((d) => {
    const v = values[d.id] ?? null;
    const awaiting = v == null;
    return {
      ...d,
      value: v,
      status: awaiting ? "na" : statusOf(d, v),
      progress: awaiting ? 0 : progressOf(d, v),
      trend: d.id === "meetings" ? meetingsTrend : null,
      awaiting,
    };
  });

  const order = ["Coverage", "Quality", "Demand", "Engagement"];
  const groups: KpiGroup[] = order
    .map((group) => ({ group, kpis: kpis.filter((k) => k.group === group) }))
    .filter((g) => g.kpis.length > 0);

  return { kpis, groups };
}

// KPI statuses as recommendation rules — the "first set of actual rules". At-risk and met KPIs
// become actionable/celebratory items; approaching is a positive nudge. On-track and awaiting are
// left off the list (nothing to do). Ranked by urgency by the caller.
export type KpiRec = { severity: "serious" | "warning" | "info" | "good"; title: string; detail: string; metric: string };
export function kpiRecommendations(kpis: Kpi[]): KpiRec[] {
  const out: KpiRec[] = [];
  const show = (k: Kpi) => fmtVal(k.unit, k.value) + " / " + fmtVal(k.unit, k.target);
  for (const k of kpis) {
    if (k.status === "at_risk") {
      out.push({ severity: "warning", title: `${k.label} is off target`, metric: show(k),
        detail: `${k.why} Now at ${fmtVal(k.unit, k.value)} against a ${fmtVal(k.unit, k.target)} goal — past the ${fmtVal(k.unit, k.warn)} warning line. This is a scorecard priority.` });
    } else if (k.status === "met") {
      out.push({ severity: "good", title: `${k.label} — goal met`, metric: show(k),
        detail: `Hit the ${fmtVal(k.unit, k.target)} target (currently ${fmtVal(k.unit, k.value)}). Consider raising the bar in kpi-targets.json.` });
    } else if (k.status === "approaching") {
      out.push({ severity: "info", title: `${k.label} is close`, metric: show(k),
        detail: `${fmtVal(k.unit, k.value)} against a ${fmtVal(k.unit, k.target)} goal — nearly there. A small push closes it out.` });
    }
  }
  const rank = { serious: 0, warning: 1, info: 2, good: 3 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function fmtVal(unit: "count" | "pct" | "pos", v: number | null): string {
  if (v == null) return "—";
  if (unit === "pct") return `${Math.round(v)}%`;
  if (unit === "pos") return v.toFixed(1);
  return v.toLocaleString("en-US");
}
