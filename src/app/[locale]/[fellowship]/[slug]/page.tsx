import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { meetingSheetHref } from "@/lib/meetingHref";
import { getFellowshipCityParams, getFellowshipCity, CITY_MAX_PER_DAY } from "@/lib/cities";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getFellowshipCityParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; fellowship: string; slug: string }> }): Promise<Metadata> {
  const { locale, fellowship, slug } = await params;
  const fc = await getFellowshipCity(fellowship, slug);
  if (!fc) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("fcTitle", { code: fc.code, city: fc.city, state: fc.state, name: fc.name });
  const description = t("fcDesc", { count: fc.count, name: fc.name, code: fc.code, city: fc.city, state: fc.state });
  return {
    title,
    description,
    alternates: alts(locale, `/${fc.fslug}/${fc.citySlug}`),
    openGraph: { title, description, url: `/${fc.fslug}/${fc.citySlug}`, type: "website" },
  };
}

export default async function FellowshipCityPage({ params }: { params: Promise<{ locale: string; fellowship: string; slug: string }> }) {
  const { locale, fellowship, slug } = await params;
  setRequestLocale(locale);
  const fc = await getFellowshipCity(fellowship, slug);
  if (!fc) notFound();
  const t = await getTranslations("fellowshipCity");
  const td = await getTranslations("meetingDayList");
  const DAYS = td("days").split(",");

  const byDay: Record<number, typeof fc.meetings> = {};
  for (const m of fc.meetings) (byDay[m.day] ||= []).push(m);
  let shown = 0;
  for (let d = 0; d < 7; d++) if (byDay[d]) shown += Math.min(byDay[d].length, CITY_MAX_PER_DAY);
  const liveSearch = `/?q=${encodeURIComponent(`${fc.code} in ${fc.city}`)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${fc.name} meetings in ${fc.city}, ${fc.stateName}`,
        url: `https://fellow.space/${fc.fslug}/${fc.citySlug}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
          { "@type": "ListItem", position: 3, name: `${fc.city}, ${fc.state}`, item: `https://fellow.space/meetings/${fc.citySlug}` },
          { "@type": "ListItem", position: 4, name: `${fc.code} in ${fc.city}`, item: `https://fellow.space/${fc.fslug}/${fc.citySlug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">{t("backHome")}</Link> ·{" "}
        <Link href={`/meetings/${fc.citySlug}`} className="back">{t("allInCity", { city: fc.city })}</Link>
      </p>
      <h1>{t("h1", { name: fc.name, code: fc.code, city: fc.city, stateName: fc.stateName })}</h1>
      <p>
        {t.rich("lead", { count: fc.count.toLocaleString(), name: fc.name, code: fc.code, city: fc.city, b: (ch) => <strong>{ch}</strong> })}
        <Link href={liveSearch}>{t("searchInCity", { code: fc.code, city: fc.city })}</Link>
      </p>

      {DAYS.map((dayName, d) => {
        const all = byDay[d];
        if (!all || !all.length) return null;
        const rows = all.slice(0, CITY_MAX_PER_DAY);
        return (
          <section key={d} style={{ margin: "18px 0" }}>
            <h2 style={{ fontSize: 20 }}>{dayName} — {td("count", { n: all.length })}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rows.map((m) => (
                <li key={m.id}>
                  <Link className="mtg-row" href={meetingSheetHref({ ...m, fellowship: fc.code })}>
                    <span className="mtg-body">
                      <strong>{to12(m.time)}</strong> — {m.name}
                      {m.place || m.address ? <span className="mtg-meta"> · {m.place || m.address}</span> : null}
                    </span>
                    <Icon name="chevron" size={20} className="mtg-chev" />
                  </Link>
                </li>
              ))}
            </ul>
            {all.length > rows.length && (
              <p style={{ margin: "8px 0 0", color: "var(--ink-soft)", fontSize: 14 }}>
                {td("moreOn", { n: all.length - rows.length, day: dayName })}<Link href={liveSearch}>{td("seeAllLive")}</Link>
              </p>
            )}
          </section>
        );
      })}

      {fc.count > shown && (
        <p style={{ marginTop: 16 }}>
          {t("showing", { shown, count: fc.count.toLocaleString(), code: fc.code, city: fc.city })}
          <Link href={liveSearch}>{t("seeAllFilters")}</Link>
        </p>
      )}

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote", { name: fc.name })}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href={`/meetings/${fc.citySlug}`} className="back">{t("backAllInCity", { city: fc.city })}</Link></p>
      <SiteFooter />
    </main>
  );
}
