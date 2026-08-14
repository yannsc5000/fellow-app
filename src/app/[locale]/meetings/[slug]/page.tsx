import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { meetingSheetHref } from "@/lib/meetingHref";
import { getCities, getCity, fellowshipLabel, cityFellowshipLinks } from "@/lib/cities";
import { SoberActivities } from "@/components/SoberActivities";
import { SiteFooter } from "@/components/SiteFooter";
import { CityWeekCalendar, type CalDay } from "@/components/CityWeekCalendar";

// Group a city's (day-then-time sorted) meetings into the week Calendar's compact shape: per day,
// the four day-part bands (up to 3 sample meetings each + the band's true total) plus an hourly
// histogram for the sparkline. Small payload — the long tail lives behind "View all".
const CAL_BANDS: [string, number, number][] = [
  ["Morning", 0, 720], ["Midday", 720, 1020], ["Evening", 1020, 1260], ["Late", 1260, 1440],
];
const calMins = (t: string) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
function buildWeek(meetings: { id: string; name: string; fellowship: string; day: number; time: string; place: string; address: string }[]): CalDay[] {
  const byDow: Record<number, typeof meetings> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const m of meetings) if (byDow[m.day]) byDow[m.day].push(m);
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const list = byDow[dow];
    const hours = new Array(17).fill(0);
    for (const m of list) { const h = Math.floor(calMins(m.time) / 60); if (h >= 6 && h <= 22) hours[h - 6]++; }
    const bands = CAL_BANDS.map(([label, a, b]) => {
      const inb = list.filter((m) => { const t = calMins(m.time); return t >= a && t < b; });
      return { label, total: inb.length, items: inb.slice(0, 3).map((m) => ({ name: m.name, fellowship: m.fellowship, time: m.time, href: meetingSheetHref(m) })) };
    });
    return { bands, hours };
  });
}

// Only pre-built city slugs are valid; anything else 404s.
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
  const fells = c.fellowships.map(fellowshipLabel).slice(0, 3).join(", ");
  const more = c.fellowships.length > 3 ? t("andMore") : "";
  const title = t("cityTitle", { city: c.city, state: c.state });
  const description = t("cityDesc", { count: c.count, city: c.city, state: c.state, fells, more });
  return {
    title,
    description,
    alternates: alts(locale, `/meetings/${c.slug}`),
    openGraph: { title, description, url: `/meetings/${c.slug}`, type: "website" },
  };
}

export default async function CityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = await getCity(slug);
  if (!c) notFound();
  const t = await getTranslations("city");
  // The week Calendar (swim-lanes on desktop, day-picker on mobile) built from this city's
  // meetings; the full day-by-day listing lives on /meetings/[slug]/all.
  const week = buildWeek(c.meetings);
  const fellNames = c.fellowships.map(fellowshipLabel);
  const fellowshipLinks = cityFellowshipLinks(c);
  const liveSearch = `/?q=${encodeURIComponent(c.city)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Recovery meetings in ${c.city}, ${c.stateName}`,
        url: `https://fellow.space/meetings/${c.slug}`,
        about: fellNames,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
          { "@type": "ListItem", position: 3, name: `${c.city}, ${c.state}`, item: `https://fellow.space/meetings/${c.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">{t("backHome")}</Link> · <Link href="/meetings" className="back">{t("allCities")}</Link>
      </p>
      <h1>{t("h1", { city: c.city, stateName: c.stateName })}</h1>
      <p>
        {t.rich("lead", {
          city: c.city,
          count: c.count.toLocaleString(),
          fells: fellNames.join(", "),
          b: (ch) => <strong>{ch}</strong>,
        })}
        <Link href={liveSearch}>{t("searchCity", { city: c.city })}</Link>
      </p>

      {fellowshipLinks.length > 1 && (
        <p style={{ margin: "4px 0 8px" }}>
          <strong>{t("byFellowship")}</strong>{" "}
          {fellowshipLinks.map((f, i) => (
            <span key={f.fslug}>
              {i > 0 ? " · " : ""}
              <Link href={`/${f.fslug}/${c.slug}`}>{t("inCity", { code: f.code, city: c.city })}</Link>
            </span>
          ))}
        </p>
      )}

      <h2 style={{ fontSize: 20, marginTop: 22 }}>{t("weekPreview")}</h2>
      <CityWeekCalendar week={week} allHref={`/meetings/${c.slug}/all`} />
      <p style={{ margin: "16px 0 0" }}>
        <Link href={`/meetings/${c.slug}/all`} className="city-chip city-chip-all">
          {t("viewAll", { count: c.count.toLocaleString(), city: c.city })}
        </Link>
      </p>

      <SoberActivities city={c.city} state={c.state} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote")}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href="/" className="back">{t("backToFellow")}</Link></p>
      <SiteFooter />
    </main>
  );
}
