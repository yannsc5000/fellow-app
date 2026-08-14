"use client";
import { useState, useEffect, Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { fellowshipColor } from "@/lib/fellowships";

// The week Calendar as it appears on the static city / fellowship landing pages. Same look as the
// Browse Calendar (swim-lanes on desktop, a day-picker + agenda on mobile) but fed from precomputed,
// server-rendered data instead of the live Typesense index — so every meeting is a real crawlable
// <a> in the swim-lane (which is always in the DOM; CSS just hides it on mobile). There is no week
// stepper here: a city page is a static snapshot of the recurring weekly schedule, and "View all"
// is the deeper dive. Dates + the "today" marker are filled in on the client after mount, so the
// statically-built page never ships a stale date.

export type CalItem = { name: string; fellowship: string; time: string; href: string };
export type CalBand = { label: string; total: number; items: CalItem[] };
export type CalDay = { bands: CalBand[]; hours: number[] };

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function fmtTime(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "a" : "p"; const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")}${ap}`;
}

// hideFellowship: on single-fellowship pages (a fellowship×city page) every row shares one
// fellowship, so the per-row code is redundant noise — the colored dot still carries it.
export function CityWeekCalendar({ week, allHref, hideFellowship = false }: { week: CalDay[]; allHref: string; hideFellowship?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [selDow, setSelDow] = useState(0);
  const [wd, setWd] = useState<Date[] | null>(null); // this week's dates, client-computed post-mount
  const [todayDow, setTodayDow] = useState(-1);
  useEffect(() => {
    const now = new Date(); const sun = new Date(now); sun.setDate(now.getDate() - now.getDay());
    setWd(DOW.map((_, i) => { const d = new Date(sun); d.setDate(sun.getDate() + i); return d; }));
    setTodayDow(now.getDay()); setSelDow(now.getDay()); setMounted(true);
  }, []);

  const max = Math.max(1, ...week.flatMap((d) => d.hours));
  const spark = (dow: number) => (
    <span className="cal-spark" aria-hidden>
      {week[dow].hours.map((n, i) => (
        <i key={i} style={{ height: `${Math.max(2, (n / max) * 14)}px`, background: "var(--brand)", opacity: n ? 0.35 + 0.65 * Math.min(1, n / max) : 0.14 }} />
      ))}
    </span>
  );
  const Row = (it: CalItem, i: number) => (
    <Link key={i} href={it.href} className="cal-mrow" style={{ ["--fc" as any]: fellowshipColor(it.fellowship) }}
      title={`${it.name} · ${it.fellowship}`}>
      <span className="cal-dot" aria-hidden />
      <span className="cal-mtime">{fmtTime(it.time)}</span>
      <span className="cal-mname">{it.name}</span>
      {!hideFellowship && <span className="cal-mfel">{it.fellowship}</span>}
    </Link>
  );
  const dayEmpty = (dow: number) => week[dow].bands.every((b) => !b.items.length);

  return (
    <div className="cal city-cal">
      {/* Desktop swim-lane — always rendered (crawlable), hidden on mobile via CSS. */}
      <div className="cal-desk">
        <div className="cal-lane">
          <div className="cal-corner" aria-hidden />
          {DOW.map((dn, d) => (
            <div key={d} className={`cal-lhead${mounted && d === todayDow ? " is-today" : ""}`}>
              <span className="cal-d">{dn}</span>{wd && <span className="cal-n">{wd[d].getDate()}</span>}{spark(d)}
            </div>
          ))}
          {[0, 1, 2, 3].map((bi) => (
            <Fragment key={bi}>
              <div className="cal-llabel">{week[0].bands[bi].label}</div>
              {DOW.map((_, d) => {
                const band = week[d].bands[bi];
                const isToday = mounted && d === todayDow;
                if (!band.items.length) return <div key={d} className={`cal-cell is-empty${isToday ? " is-today" : ""}`} aria-hidden />;
                const more = band.total - band.items.length;
                return (
                  <div key={d} className={`cal-cell${isToday ? " is-today" : ""}`}>
                    {band.items.map(Row)}
                    {more > 0 && <Link href={allHref} className="cal-more">+{more} more →</Link>}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: pick a day → that day's meetings, in the same bands. */}
      <div className="cal-phone">
        <div className="cal-daypick" role="tablist" aria-label="Pick a day">
          {DOW.map((dn, d) => {
            const sel = d === selDow, isToday = mounted && d === todayDow;
            return (
              <button key={d} role="tab" aria-selected={sel} type="button"
                className={`cal-dp${sel ? " is-sel" : ""}${isToday ? " is-today" : ""}`} onClick={() => setSelDow(d)}>
                <span className="cal-dd">{dn.slice(0, 2)}</span>{wd && <span className="cal-nn">{wd[d].getDate()}</span>}{spark(d)}
              </button>
            );
          })}
        </div>
        <div className="cal-mtitle">
          {FULL[selDow]}{wd ? `, ${wd[selDow].toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
          {mounted && selDow === todayDow ? <span className="cal-todaytag">Today</span> : null}
        </div>
        <div className="cal-mcard">
          {dayEmpty(selDow)
            ? <div className="cal-mempty">No meetings listed for this day.</div>
            : week[selDow].bands.map((b, bi) => b.items.length ? (
                <Fragment key={bi}>
                  <div className="cal-mband">{b.label}</div>
                  {b.items.map(Row)}
                  {b.total > b.items.length && <Link href={allHref} className="cal-more cal-more-m">+{b.total - b.items.length} more →</Link>}
                </Fragment>
              ) : null)}
        </div>
      </div>
    </div>
  );
}
