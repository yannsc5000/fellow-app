import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import HomeExperience from "@/components/HomeExperience";
import { CoveragePromo } from "@/components/CoveragePromo";
import { SiteFooter } from "@/components/SiteFooter";
import { getCoverage } from "@/lib/coverage";
import { getCities } from "@/lib/cities";

// Biggest metros by meeting count — visible entry points to the /meetings/[city] pages.
// Rule: this list only ever shows cities Fellow actually has meetings for. We filter the
// curated set below against the live city index at build time, so a city without a real page
// can never appear here. Displayed alphabetically. (Full list lives at /meetings.)
const POPULAR_CITIES = [
  { name: "New York, NY", slug: "new-york-ny" }, { name: "Las Vegas, NV", slug: "las-vegas-nv" },
  { name: "Phoenix, AZ", slug: "phoenix-az" }, { name: "Philadelphia, PA", slug: "philadelphia-pa" },
  { name: "San Antonio, TX", slug: "san-antonio-tx" }, { name: "San Diego, CA", slug: "san-diego-ca" },
  { name: "Seattle, WA", slug: "seattle-wa" }, { name: "Denver, CO", slug: "denver-co" },
  { name: "Atlanta, GA", slug: "atlanta-ga" }, { name: "Washington, DC", slug: "washington-dc" },
  { name: "Minneapolis, MN", slug: "minneapolis-mn" }, { name: "Nashville, TN", slug: "nashville-tn" },
  { name: "Indianapolis, IN", slug: "indianapolis-in" }, { name: "Cincinnati, OH", slug: "cincinnati-oh" },
  { name: "Columbus, OH", slug: "columbus-oh" }, { name: "Oklahoma City, OK", slug: "oklahoma-city-ok" },
  { name: "Jacksonville, FL", slug: "jacksonville-fl" }, { name: "Louisville, KY", slug: "louisville-ky" },
  { name: "Tucson, AZ", slug: "tucson-az" }, { name: "Raleigh, NC", slug: "raleigh-nc" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("homeTitle");
  const description = t("homeDesc");
  return {
    title,
    description,
    alternates: alts(locale, "/"),
    openGraph: { title, description, url: locale === "es" ? "/es" : "/", type: "website" },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const [coverage, cities] = await Promise.all([getCoverage(), getCities()]);
  // Enforce the rule: only cities with a live meetings page (≥ the min-meetings threshold),
  // then show them alphabetically.
  const liveSlugs = new Set(cities.map((c) => c.slug));
  const popular = POPULAR_CITIES
    .filter((c) => liveSlugs.has(c.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="app" id="main-content" tabIndex={-1}>
      <HomeExperience />

      {/* Server-rendered, entity-rich intro so Google and AI search have real on-page copy about
          what Fellow is (the interactive widget above is client-only and not crawlable). */}
      <section className="home-intro" aria-labelledby="home-intro-h">
        <h2 id="home-intro-h">{t("introHeading")}</h2>
        <p>
          {t.rich("introBody", {
            b: (chunks) => <strong>{chunks}</strong>,
            cov: (chunks) => <Link href="/coverage">{chunks}</Link>,
          })}
        </p>
        <ul className="home-intro-chips">
          {(["introChipFree", "introChipNoAccount", "introChipNoTracking", "introChipInPersonOnline", "introChipStates"] as const).map((k) => (
            <li key={k} className="home-intro-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12l5 5L20 6" />
              </svg>
              {t(k)}
            </li>
          ))}
        </ul>
        <Link href="/support-groups" className="sg-promo" aria-label={`${t("introCtaKicker")} ${t("introCtaAction")}`}>
          <span className="sg-promo-tile" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v3M12 19v3" />
              <path d="M6 5h9l3 2.5L15 10H6z" />
              <path d="M18 12H8l-3 2.5L8 17h10z" opacity=".55" />
            </svg>
          </span>
          <span className="sg-promo-txt">
            <span className="sg-promo-k">{t("introCtaKicker")}</span>
            <span className="sg-promo-m">{t("introCtaAction")}</span>
          </span>
          <svg className="sg-promo-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </section>

      <CoveragePromo data={coverage} />

      <section className="city-browse" aria-labelledby="city-browse-h">
        <h2 id="city-browse-h">{t("cityBrowseHeading")}</h2>
        <div className="city-chips">
          {popular.map((c) => (
            <Link key={c.slug} href={`/meetings/${c.slug}`} className="city-chip">{c.name}</Link>
          ))}
          <Link href="/meetings" className="city-chip city-chip-all">{t("allCities")}</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
