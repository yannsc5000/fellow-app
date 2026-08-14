import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";

// Shared full-listing renderer for the "view all" pages (/meetings/[slug]/all and
// /[fellowship]/all): groups meetings by day of the week, chronologically within each day.
// Rows are precomputed by the caller (href + meta), so this component stays presentational.

function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

export type DayRow = { id: string; name: string; day: number; time: string; href: string; meta?: string; online?: boolean; dot?: string };

export async function MeetingDayList({
  rows, maxPerDay = 0, liveHref, liveLabel,
}: { rows: DayRow[]; maxPerDay?: number; liveHref: string; liveLabel?: string }) {
  const t = await getTranslations("meetingDayList");
  const DAYS = t("days").split(",");
  const byDay: Record<number, DayRow[]> = {};
  for (const r of rows) (byDay[r.day] ||= []).push(r);

  return (
    <>
      {DAYS.map((dayName, d) => {
        const all = byDay[d];
        if (!all || !all.length) return null;
        const shown = maxPerDay > 0 ? all.slice(0, maxPerDay) : all;
        return (
          <section key={d} className="va-day">
            <h2 className="va-dayhead">
              {dayName} <span className="va-count">— {t("count", { n: all.length })}</span>
            </h2>
            <ul className="va-list">
              {shown.map((r) => (
                <li key={r.id}>
                  <Link className="mtg-row" href={r.href}>
                    <span className="mtg-body">
                      {r.dot ? <span className="mtg-dot" style={{ background: r.dot }} aria-hidden /> : null}
                      <strong>{to12(r.time)}</strong> — {r.name}
                      {r.online ? <span className="va-badge">{t("online")}</span> : null}
                      {r.meta ? <span className="mtg-meta"> · {r.meta}</span> : null}
                    </span>
                    <Icon name="chevron" size={20} className="mtg-chev" />
                  </Link>
                </li>
              ))}
            </ul>
            {all.length > shown.length && (
              <p className="va-more">
                {t("moreOn", { n: (all.length - shown.length).toLocaleString(), day: dayName })}
                <Link href={liveHref}>{liveLabel || t("seeAllLive")}</Link>
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
