import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { meetingSheetHref } from "@/lib/meetingHref";
import { getFellowshipCityParams, getFellowshipCity } from "@/lib/cities";
import { SiteFooter } from "@/components/SiteFooter";
import { CityWeekCalendar, type CalDay } from "@/components/CityWeekCalendar";

// Same compact week shape as the city page — but every meeting here is the page's one fellowship,
// so we stamp its code on each item (the row then hides the redundant label; the dot keeps the color).
const CAL_BANDS: [string, number, number][] = [
  ["Morning", 0, 720], ["Midday", 720, 1020], ["Evening", 1020, 1260], ["Late", 1260, 1440],
];
const calMins = (t: string) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
function buildWeek(meetings: { id: string; name: string; day: number; time: string; place: string; address: string }[], code: string): CalDay[] {
  const byDow: Record<number, typeof meetings> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const m of meetings) if (byDow[m.day]) byDow[m.day].push(m);
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const list = byDow[dow];
    const hours = new Array(17).fill(0);
    for (const m of list) { const h = Math.floor(calMins(m.time) / 60); if (h >= 6 && h <= 22) hours[h - 6]++; }
    const bands = CAL_BANDS.map(([label, a, b]) => {
      const inb = list.filter((m) => { const t = calMins(m.time); return t >= a && t < b; });
      return { label, total: inb.length, items: inb.slice(0, 3).map((m) => ({ name: m.name, fellowship: code, time: m.time, href: meetingSheetHref({ ...m, fellowship: code }) })) };
    });
    return { bands, hours };
  });
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
  const tc = await getTranslations("city");
  const week = buildWeek(fc.meetings, fc.code);
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

      <h2 style={{ fontSize: 20, marginTop: 22 }}>{tc("weekPreview")}</h2>
      <CityWeekCalendar week={week} allHref={liveSearch} hideFellowship />
      <p style={{ margin: "16px 0 0" }}>
        <Link href={liveSearch} className="city-chip city-chip-all">{t("seeAllFilters")}</Link>
      </p>

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote", { name: fc.name })}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href={`/meetings/${fc.citySlug}`} className="back">{t("backAllInCity", { city: fc.city })}</Link></p>
      <SiteFooter />
    </main>
  );
}
