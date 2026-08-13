import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fellowshipColor, fellowshipName } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { CONTACT_EMAIL } from "@/lib/config";
import { getMeetingById } from "@/lib/serverSearch";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { DetailMap } from "@/components/DetailMap";
import { SiteFooter } from "@/components/SiteFooter";

// The canonical page for a single meeting (fellow.space/m?id=…&n=…). A shared link lands here
// directly on the full meeting detail — the MeetingSheet as its own URL — with a live OG card
// (see generateMetadata → /api/share-card) so the link also unfurls in Messages/Slack.
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  const ap = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}`;
}
const SCHEMA_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Format the source "updated" timestamp ("2025-10-10 14:38:29") to a friendly date. No Date()
// parsing — just the visible parts — so it's a plain, honest "last updated" signal.
function fmtDate(s: string): string {
  const mm = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!mm) return "";
  return `${MON[Number(mm[2]) - 1] || ""} ${Number(mm[3])}, ${mm[1]}`;
}
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

// Best-effort meeting from URL params, used for metadata and as a fallback when the live
// lookup is unavailable.
function paramsMeeting(sp: SP) {
  return {
    id: "", name: one(sp.n) || "Recovery meeting", fellowship: one(sp.f),
    day: Number(one(sp.d)), time: one(sp.t), place: one(sp.p), address: one(sp.a),
    online: one(sp.o) === "1", lat: null as number | null, lng: null as number | null,
    website: "", notes: "", types: [] as string[], conference_url: "", conference_phone: "", updated: "",
  };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const p = paramsMeeting(sp);
  const when = Number.isInteger(p.day) && p.day >= 0 && p.day <= 6 ? `${DAYS[p.day]}${p.time ? `, ${to12(p.time)}` : ""}` : "";
  const where = p.online ? "Online meeting" : [p.place, p.address].filter(Boolean).join(" · ");
  const qs = new URLSearchParams();
  for (const k of ["n", "f", "d", "t", "p", "a", "o"]) { const v = one(sp[k]); if (v) qs.set(k, v); }
  const img = `/api/share-card?${qs.toString()}`;
  const title = `${p.name}${p.fellowship ? ` — ${fellowshipName(p.fellowship)}` : ""} | Fellow`;
  const description = [when, where].filter(Boolean).join(" · ") || "A recovery meeting on Fellow.";
  return {
    title, description,
    openGraph: { title, description, images: [{ url: img, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [img] },
    robots: { index: false, follow: true },
  };
}

export default async function SharedMeeting({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shared");
  const tc = await getTranslations("common");
  const td = await getTranslations("meetingDayList");
  const LDAYS = td("days").split(",");
  const sp = await searchParams;
  const id = one(sp.id);
  // Prefer the live record (full detail: map, website, notes); fall back to the link's params.
  const m = (id ? await getMeetingById(id) : null) || (paramsMeeting(sp) as any);

  const code = m.fellowship || "";
  const fc = code ? fellowshipColor(code) : "var(--brand)";
  const when = Number.isInteger(m.day) && m.day >= 0 && m.day <= 6 ? `${LDAYS[m.day]}, ${to12(m.time)}` : "";
  const mapsAddr = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((m.place ? m.place + ", " : "") + (m.address || ""))}`;
  const finder = officialFinder(code);
  const hasLinks = m.website || finder;
  const updatedStr = m.updated ? fmtDate(String(m.updated)) : "";

  // A prefilled "report a change" email — the report-a-change path the AI/data guidance asks for.
  const correctionHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Fellow correction: " + m.name)}&body=${encodeURIComponent(`I'd like to report a change to this meeting on Fellow.\n\nMeeting: ${m.name}\n${when}\n${m.online ? "Online" : (m.place || m.address || "")}\n\nWhat's changed:\n`)}`;

  // Event structured data — only for a real, verified record (not the params fallback), described
  // as a weekly recurring schedule so the markup accurately matches the visible meeting details.
  const isReal = !!(id && m.id);
  const validDay = Number.isInteger(m.day) && m.day >= 0 && m.day <= 6;
  const eventLd = isReal && validDay && m.time ? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: m.name,
    description: [when, m.online ? "Online meeting" : (m.place || m.address)].filter(Boolean).join(" · "),
    eventAttendanceMode: m.online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    inLanguage: "en",
    eventSchedule: {
      "@type": "Schedule",
      repeatFrequency: "P1W",
      byDay: `https://schema.org/${SCHEMA_DAY[m.day]}`,
      startTime: m.time,
      ...(m.end ? { endTime: m.end } : {}),
    },
    ...(code ? { organizer: { "@type": "Organization", name: fellowshipName(code) } } : {}),
    location: m.online
      ? { "@type": "VirtualLocation", url: m.conference_url || m.website || "https://fellow.space/" }
      : {
          "@type": "Place",
          ...(m.place ? { name: m.place } : {}),
          ...(m.address ? { address: m.address } : {}),
          ...(m.lat != null && m.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: m.lat, longitude: m.lng } } : {}),
        },
  } : null;

  return (
    <main className="app" id="main-content" tabIndex={-1}>
      {eventLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} /> : null}
      <header className="brand">
        <Link href="/" className="brand-link" aria-label={t("backAria")}>
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div><h1>Fellow</h1><div className="tagline">{tc("tagline")}</div></div>
        </Link>
      </header>

      <div className="share-card" style={{ ["--fc" as any]: fc }}>
        <div className="sheet-hero">
          <h2 className="sheet-title">{m.name}</h2>
          {code ? <p className="sheet-fellowship">{fellowshipName(code)}</p> : null}
        </div>
        <div className="sheet-body">
          <div className="sheet-facts">
            {when ? (
              <div className="fact">
                <span className="fact-ico"><Icon name="calmonth" size={18} /></span>
                <span className="fact-body"><span className="fact-main">{when}</span></span>
              </div>
            ) : null}
            <div className="fact">
              <span className="fact-ico"><Icon name={m.online ? "video" : "pin"} size={18} /></span>
              <span className="fact-body">
                {m.online
                  ? <span className="fact-main">{t("onlineMeeting")}</span>
                  : m.place
                    ? <>
                        <span className="fact-main">{m.place}</span>
                        {m.address ? <a className="fact-sub fact-link" href={mapsAddr} target="_blank" rel="noopener">{m.address} <Icon name="external" size={12} className="fl-ext" /></a> : null}
                      </>
                    : m.address
                      ? <a className="fact-main fact-link" href={mapsAddr} target="_blank" rel="noopener">{m.address} <Icon name="external" size={13} className="fl-ext" /></a>
                      : <span className="fact-main">{t("seeDetails")}</span>}
              </span>
            </div>
          </div>

          {(m.types || []).length > 0 && (
            <div className="sheet-tags">
              {(m.types || []).map((x: string) => <span key={x} className="tag">{x}</span>)}
            </div>
          )}

          {m.notes ? (
            <>
              <hr className="sheet-divider" />
              <div className="sheet-notes">
                <p className="notes-label">{t("meetingNotes")}</p>
                <p className="notes-text">{m.notes}</p>
              </div>
            </>
          ) : null}

          {hasLinks ? (
            <>
              <hr className="sheet-divider" />
              <div className="lx-cards">
                <Link className="lx-card" href={`/?q=${encodeURIComponent(m.name)}`}>
                  <span className="lx-cico"><Icon name="calmonth" size={17} /></span>
                  <span className="lx-ctext"><b>{t("allSessionsGroup")}</b><small>{t("otherDaysTimes")}</small></span>
                  <Icon name="chevron" size={18} className="lx-chev" />
                </Link>
                {!m.online && m.place ? (
                  <Link className="lx-card" href={`/?q=${encodeURIComponent(m.place)}`}>
                    <span className="lx-cico"><Icon name="pin" size={17} /></span>
                    <span className="lx-ctext"><b>{t("allSessionsLocation")}</b><small>{t("everythingVenue")}</small></span>
                    <Icon name="chevron" size={18} className="lx-chev" />
                  </Link>
                ) : null}
                {m.website ? (
                  <a className="lx-card" href={m.website} target="_blank" rel="noopener">
                    <span className="lx-cico"><Icon name="globe" size={17} /></span>
                    <span className="lx-ctext"><b>{t("groupWebsite")}</b><small>{t("opensNewTab")}</small></span>
                    <Icon name="external" size={16} className="lx-ext" />
                  </a>
                ) : null}
                {finder ? (
                  <a className="lx-card" href={finder.url} target="_blank" rel="noopener">
                    <span className="lx-cico"><Icon name="list" size={17} /></span>
                    <span className="lx-ctext"><b>{finder.label}</b><small>{t("officialDirectory")}</small></span>
                    <Icon name="external" size={16} className="lx-ext" />
                  </a>
                ) : null}
              </div>
            </>
          ) : null}

          {!m.online && m.lat != null && m.lng != null ? <DetailMap m={m} defaultMode="map" /> : null}

          <div className="sheet-actions">
            {m.online
              ? (m.conference_url
                  ? <a className="btn btn-fc" href={m.conference_url} target="_blank" rel="noopener" style={{ ["--fc" as any]: fc }}><Icon name="video" size={18} /> {t("joinOnline")}</a>
                  : <Link className="btn btn-fc" href={`/?q=${encodeURIComponent(m.name)}`} style={{ ["--fc" as any]: fc }}><Icon name="search" size={18} /> {t("findThisMeeting")}</Link>)
              : <a className="btn btn-fc" href={mapsAddr} target="_blank" rel="noopener" style={{ ["--fc" as any]: fc }}><Icon name="route" size={18} /> {t("directions")}</a>}
          </div>
          <p className="share-note">{t("shareNote")}</p>
          <p className="share-note share-meta">
            {updatedStr ? t("lastUpdated", { date: updatedStr }) : null}
            <a href={correctionHref} className="report-inline">{t("reportChange")}</a>
          </p>
        </div>
      </div>

      <p className="share-explore"><Link href="/">{t("findMore")}</Link></p>
      <SiteFooter />
    </main>
  );
}
