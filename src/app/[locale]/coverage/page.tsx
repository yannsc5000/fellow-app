import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { getCoverage } from "@/lib/coverage";
import { Mark } from "@/components/Mark";
import CoverageMap from "@/components/CoverageMap";
import { SiteFooter } from "@/components/SiteFooter";
import stats from "@/lib/fellowship-stats.json";

const fmt = (n: number) => n.toLocaleString("en-US");
// Honest freshness date from the ingest run that produced the committed dataset.
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtStamp(iso: string): string {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${MON[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : "";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const c = await getCoverage();
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("coverageTitle", { placed: c.placed });
  const description = t("coverageDesc", { total: c.total, placed: c.placed, online: c.online });
  return {
    title,
    description,
    alternates: alts(locale, "/coverage"),
    openGraph: { title, description, url: "/coverage", type: "website" },
  };
}

export default async function CoveragePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("coverage");
  const tc = await getTranslations("common");
  const c = await getCoverage();
  const refreshed = fmtStamp((stats as { generatedAt?: string }).generatedAt || "");

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "U.S. recovery meeting coverage",
        url: "https://fellow.space/coverage",
        description: `Coverage of ${fmt(c.total)} recovery meetings across all 50 US states and DC, by state and fellowship.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Coverage", item: "https://fellow.space/coverage" },
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
          {refreshed
            ? t.rich("introWithDate", { total: fmt(c.total), date: refreshed, b: (ch) => <strong>{ch}</strong> })
            : t.rich("intro", { total: fmt(c.total), b: (ch) => <strong>{ch}</strong> })}
        </p>
      </section>

      <div className="cov-stats">
        <div className="cov-stat"><div className="n">{fmt(c.total)}</div><div className="l">{t("statMeetings")}</div></div>
        <div className="cov-stat"><div className="n">{fmt(c.placed)}</div><div className="l">{t("statInPerson")}</div></div>
        <div className="cov-stat"><div className="n">{fmt(c.online)}</div><div className="l">{t("statOnline")}</div></div>
        <div className="cov-stat"><div className="n n-accent">{c.statesCovered}/51</div><div className="l">{t("statStates")}</div></div>
      </div>
      {refreshed ? <p className="cov-fresh">{t("freshNote", { date: refreshed })}</p> : null}

      <CoverageMap data={c} />

      <section className="cov-foot-note">
        <p>{t("footNote")}</p>
      </section>
      <SiteFooter />
    </main>
  );
}
