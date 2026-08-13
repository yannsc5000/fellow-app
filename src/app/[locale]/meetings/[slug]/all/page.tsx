import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { meetingSheetHref } from "@/lib/meetingHref";
import { getCities, getCity, fellowshipLabel, CITY_MAX_PER_DAY } from "@/lib/cities";
import { fellowshipColor } from "@/lib/fellowships";
import { MeetingDayList, type DayRow } from "@/components/MeetingDayList";
import { SiteFooter } from "@/components/SiteFooter";

// The full listing for a city — every meeting Fellow lists there, organized and labelled by
// day of the week, chronologically within each day. The city page links here after its short
// preview.
export const dynamicParams = false;

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getCity(slug);
  if (!c) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("cityAllTitle", { city: c.city, state: c.state });
  const description = t("cityAllDesc", { count: c.count, city: c.city, stateName: c.stateName });
  return {
    title, description,
    alternates: alts(locale, `/meetings/${c.slug}/all`),
    openGraph: { title, description, url: `/meetings/${c.slug}/all`, type: "website" },
  };
}

export default async function CityAllPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = await getCity(slug);
  if (!c) notFound();
  const t = await getTranslations("city");

  const rows: DayRow[] = c.meetings.map((m) => ({
    id: m.id, name: m.name, day: m.day, time: m.time, dot: fellowshipColor(m.fellowship),
    href: meetingSheetHref(m),
    meta: [fellowshipLabel(m.fellowship), m.place || m.address].filter(Boolean).join(" · "),
  }));
  const liveSearch = `/?q=${encodeURIComponent(c.city)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `All recovery meetings in ${c.city}, ${c.stateName}`,
        url: `https://fellow.space/meetings/${c.slug}/all`,
        description: `Every one of Fellow's ${c.count} in-person recovery meetings in ${c.city}, ${c.stateName}, by day.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
          { "@type": "ListItem", position: 3, name: `${c.city}, ${c.state}`, item: `https://fellow.space/meetings/${c.slug}` },
          { "@type": "ListItem", position: 4, name: "All meetings", item: `https://fellow.space/meetings/${c.slug}/all` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href={`/meetings/${c.slug}`} className="back">{t("backCityMeetings", { city: c.city })}</Link> ·{" "}
        <Link href="/meetings" className="back">{t("allCities")}</Link>
      </p>
      <h1>{t("allH1", { city: c.city, stateName: c.stateName })}</h1>
      <p>
        {t.rich("allLead", { city: c.city, count: c.count.toLocaleString(), b: (ch) => <strong>{ch}</strong> })}
        <Link href={liveSearch}>{t("searchCity", { city: c.city })}</Link>
      </p>

      <MeetingDayList rows={rows} maxPerDay={CITY_MAX_PER_DAY} liveHref={liveSearch} liveLabel={t("liveLabel", { city: c.city })} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote")}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
