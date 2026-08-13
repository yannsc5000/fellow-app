import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { meetingSheetHref } from "@/lib/meetingHref";
import { getCities, getCity, fellowshipLabel, cityFellowshipLinks, CITY_PREVIEW } from "@/lib/cities";
import { fellowshipColor } from "@/lib/fellowships";
import { Icon } from "@/components/Icon";
import { SoberActivities } from "@/components/SoberActivities";
import { SiteFooter } from "@/components/SiteFooter";

function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
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
  const dayAbbr = t("dayAbbr").split(",");

  // Short preview on the city page itself (meetings are pre-sorted by day then time); the full
  // day-by-day listing lives on /meetings/[slug]/all.
  const preview = c.meetings.slice(0, CITY_PREVIEW);
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
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {preview.map((m) => (
          <li key={m.id}>
            <Link className="mtg-row" href={meetingSheetHref(m)}>
              <span className="mtg-dot" style={{ background: fellowshipColor(m.fellowship) }} aria-hidden />
              <span className="mtg-body">
                <strong>{dayAbbr[m.day]} · {to12(m.time)}</strong> — {m.name}
                <span className="mtg-meta">
                  {" "}· {fellowshipLabel(m.fellowship)}{m.place ? ` · ${m.place}` : ""}
                </span>
              </span>
              <Icon name="chevron" size={20} className="mtg-chev" />
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ margin: "14px 0 0" }}>
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
