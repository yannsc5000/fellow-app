import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCoverage } from "@/lib/coverage";
import { getFellowshipHub, fellowshipSlug } from "@/lib/cities";
import { fellowshipName, BY_CODE, fellowshipColor, FELLOWSHIPS } from "@/lib/fellowships";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");
const searchHref = (code: string) => `/?q=${encodeURIComponent(fellowshipName(code))}`;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCoverage();
  const names = c.fellowships.slice(0, 4).map(fellowshipName).join(", ");
  const title = "Recovery fellowships — AA, NA & more | Fellow";
  const description = `Browse recovery meetings by fellowship: ${names} and more. ${fmt(c.placed)} in-person meetings across ${c.fellowships.length} fellowships — free, with no sign-up, on Fellow.`;
  return {
    title,
    description,
    alternates: { canonical: "/fellowships" },
    openGraph: { title, description, url: "/fellowships", type: "website" },
  };
}

export default async function FellowshipsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fellowshipsHub");
  const tc = await getTranslations("common");
  const [c, hub] = await Promise.all([getCoverage(), getFellowshipHub()]);
  // List EVERY fellowship: the ones we index (biggest in-person first), then the rest of the
  // taxonomy (seeded pages, "coverage coming"), so the hub covers the whole family.
  const indexed = c.fellowships;
  const seeded = FELLOWSHIPS.map((f) => f.code).filter((code) => !indexed.includes(code));
  const list = [...indexed, ...seeded];

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Recovery fellowships on Fellow",
        url: "https://fellow.space/fellowships",
        description: `Recovery meetings by fellowship across the US — ${list.map(fellowshipName).join(", ")}.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Fellowships", item: "https://fellow.space/fellowships" },
        ],
      },
    ],
  };

  return (
    <main className="app" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <header className="brand">
        <Link href="/" className="brand-link" aria-label={t("backAria")}>
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">{tc("tagline")}</div>
          </div>
        </Link>
      </header>

      <section className="cov-head">
        <h2>{t("h2")}</h2>
        <p>
          {t.rich("lead", { list: list.length, indexed: indexed.length, b: (ch) => <strong>{ch}</strong> })}
        </p>
        <p style={{ margin: "10px 0 0" }}>
          <Link href="/support-groups" className="city-chip city-chip-all">{t("notSureCta")}</Link>
        </p>
      </section>

      <div className="fh-list">
        {list.map((code) => {
          const cities = (hub[code] || []).slice(0, 10);
          const total = c.inPerson[code] || 0;
          const group = BY_CODE[code]?.group;
          const name = fellowshipName(code);
          const isSeeded = !indexed.includes(code);
          return (
            <section className={"fh-card" + (isSeeded ? " fh-card-seeded" : "")} key={code}>
              <Link href={`/${fellowshipSlug(code)}`} className="fh-top fh-top-link">
                <span className="fh-dot" style={{ background: fellowshipColor(code) }} aria-hidden />
                <h3 className="fh-name">{name} <span className="fh-code">{code}</span></h3>
                {isSeeded
                  ? <span className="fh-count fh-count-soon">{t("coverageComing")}</span>
                  : <span className="fh-count">{fmt(total)}<span className="fh-count-l">{t("meetingsLabel")}</span></span>}
              </Link>
              {group && <p className="fh-group">{group}</p>}
              {isSeeded ? (
                <p className="fh-cities"><span className="fh-cities-l">{t("notIndexedLabel")}</span>{t("notIndexedRest", { code })}</p>
              ) : cities.length > 0 ? (
                <p className="fh-cities">
                  <span className="fh-cities-l">{t("topCities")}</span>{" "}
                  {cities.map((ct, i) => (
                    <span key={ct.slug}>
                      {i > 0 ? " · " : ""}
                      <Link href={`/${fellowshipSlug(code)}/${ct.slug}`}>{ct.city}, {ct.state}</Link>
                    </span>
                  ))}
                </p>
              ) : (
                <p className="fh-cities"><span className="fh-cities-l">{t("nationwideLabel")}</span>{t("nationwideRest")}</p>
              )}
              <p className="fh-actions">
                {isSeeded
                  ? <Link href={`/${fellowshipSlug(code)}`} className="fh-search">{t("openPage", { code })}</Link>
                  : <Link href={searchHref(code)} className="fh-search">{t("searchMeetings", { code })}</Link>}
              </p>
            </section>
          );
        })}
      </div>

      <section className="cov-foot-note">
        <p>
          {t.rich("footNote", { em: (ch) => <em>{ch}</em>, a: (ch) => <Link href="/support-groups">{ch}</Link> })}
        </p>
        <p style={{ margin: "20px 0" }}><Link href="/" className="back">{t("backToFellow")}</Link></p>
      </section>

      <SiteFooter />
    </main>
  );
}
