import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { getCoverage } from "@/lib/coverage";
import { fellowshipSlug } from "@/lib/cities";
import { FELLOWSHIPS, BY_CODE, fellowshipName, fellowshipColor, fellowshipDesc } from "@/lib/fellowships";
import { getProblems } from "@/lib/problems";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

// Living, crawlable reference of the whole recovery-fellowship taxonomy — every fellowship grouped
// by what it addresses, plus the problem→fellowship router. Data-driven from FELLOWSHIPS + coverage
// stats + PROBLEMS, so it can't drift. Indexable (unlike /studio); deliberately NOT linked from the
// nav or footer — an orphan reference page search engines reach via the sitemap.

const fmt = (n: number) => n.toLocaleString("en-US");

// The 6 taxonomy groups in display order, mapped to clean i18n keys (the raw group strings on each
// fellowship carry "&"/spaces, so we translate through a stable key instead).
const GROUP_ORDER = ["Alcohol & drugs", "Food & eating", "Sex & relationships", "Money & work", "Emotional & behavioral", "Family & friends"] as const;
const GROUP_KEY: Record<string, string> = {
  "Alcohol & drugs": "alcoholDrugs", "Food & eating": "food", "Sex & relationships": "sex",
  "Money & work": "money", "Emotional & behavioral": "emotional", "Family & friends": "family",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "taxonomy" });
  const title = t("metaTitle");
  const description = t("metaDesc");
  return {
    title,
    description,
    alternates: alts(locale, "/taxonomy"),
    openGraph: { title, description, url: "/taxonomy", type: "website" },
  };
}

export default async function TaxonomyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("taxonomy");
  const tc = await getTranslations("common");
  const c = await getCoverage();
  const indexed = new Set(c.fellowships);
  const problems = getProblems(locale);

  const byGroup: Record<string, typeof FELLOWSHIPS> = {};
  for (const f of FELLOWSHIPS) (byGroup[f.group] ||= []).push(f);
  for (const g of Object.keys(byGroup)) byGroup[g].sort((a, b) => a.name.localeCompare(b.name));

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: t("h1"),
        url: "https://fellow.space/taxonomy",
        description: t("metaDesc"),
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "DefinedTermSet",
        name: "Recovery fellowships",
        hasDefinedTerm: FELLOWSHIPS.map((f) => ({
          "@type": "DefinedTerm",
          name: `${f.name} (${f.code})`,
          inDefinedTermSet: "https://fellow.space/taxonomy",
          description: fellowshipDesc(f.code, "en") || undefined,
          url: `https://fellow.space/${fellowshipSlug(f.code)}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: t("h1"), item: "https://fellow.space/taxonomy" },
        ],
      },
    ],
  };

  return (
    <main className="app" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <header className="brand">
        <Link href="/" className="brand-link" aria-label={tc("tagline")}>
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">{tc("tagline")}</div>
          </div>
        </Link>
      </header>

      <section className="cov-head">
        <h2>{t("h1")}</h2>
        <p>{t("intro", { indexed: indexed.size, total: FELLOWSHIPS.length })}</p>
      </section>

      {GROUP_ORDER.map((grp) => {
        const list = byGroup[grp] || [];
        if (!list.length) return null;
        return (
          <section key={grp} style={{ margin: "26px 0 0" }}>
            <h2 style={{ fontSize: 19, fontWeight: 850, letterSpacing: "-.01em", margin: "0 0 12px" }}>{t(`group.${GROUP_KEY[grp]}`)}</h2>
            <div className="fh-list">
              {list.map((f) => {
                const code = f.code;
                const total = c.inPerson[code] || 0;
                const isSeeded = !indexed.has(code);
                const desc = fellowshipDesc(code, locale);
                return (
                  <section className={"fh-card" + (isSeeded ? " fh-card-seeded" : "")} key={code}>
                    <Link href={`/${fellowshipSlug(code)}`} className="fh-top fh-top-link">
                      <span className="fh-dot" style={{ background: fellowshipColor(code) }} aria-hidden />
                      <h3 className="fh-name">{f.name} <span className="fh-code">{code}</span></h3>
                      {isSeeded
                        ? <span className="fh-count fh-count-soon">{t("coverageComing")}</span>
                        : <span className="fh-count">{fmt(total)}<span className="fh-count-l">{t("meetingsLabel")}</span></span>}
                    </Link>
                    {desc && <p style={{ margin: "8px 0 0", color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.55 }}>{desc}</p>}
                    <p className="fh-actions" style={{ marginTop: 12 }}>
                      <Link href={`/${fellowshipSlug(code)}`} className="fh-search">
                        {isSeeded ? t("openPage", { code }) : t("searchMeetings", { code })}
                      </Link>
                    </p>
                  </section>
                );
              })}
            </div>
          </section>
        );
      })}

      <section style={{ margin: "34px 0 0" }}>
        <h2 style={{ fontSize: 19, fontWeight: 850, letterSpacing: "-.01em", margin: "0 0 4px" }}>{t("facingH2")}</h2>
        <p style={{ margin: "0 0 14px", color: "var(--ink-soft)" }}>{t("facingLead")}</p>
        <div className="fh-list">
          {problems.map((p) => (
            <section className="fh-card" key={p.slug}>
              <Link href={`/support-groups/${p.slug}`} className="fh-top fh-top-link">
                <h3 className="fh-name">{p.short ?? p.h1}</h3>
              </Link>
              {p.self.length > 0 && (
                <p className="fh-cities">
                  <span className="fh-cities-l">{t("forYou")}</span>{" "}
                  {p.self.map((r, i) => (
                    <span key={r.code}>{i > 0 ? " · " : ""}<Link href={`/${fellowshipSlug(r.code)}`}>{fellowshipName(r.code)} <span style={{ color: "var(--ink-soft)" }}>({r.code})</span></Link></span>
                  ))}
                </p>
              )}
              {p.affected && p.affected.length > 0 && (
                <p className="fh-cities">
                  <span className="fh-cities-l">{t("forLovedOne")}</span>{" "}
                  {p.affected.map((r, i) => (
                    <span key={r.code}>{i > 0 ? " · " : ""}<Link href={`/${fellowshipSlug(r.code)}`}>{fellowshipName(r.code)} <span style={{ color: "var(--ink-soft)" }}>({r.code})</span></Link></span>
                  ))}
                </p>
              )}
            </section>
          ))}
        </div>
      </section>

      <section className="cov-foot-note" style={{ marginTop: 30 }}>
        <p style={{ margin: "20px 0" }}><Link href="/" className="back">{t("backToFellow")}</Link></p>
      </section>
      <SiteFooter />
    </main>
  );
}
