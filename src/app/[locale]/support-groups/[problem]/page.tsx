import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { PROBLEMS, getProblems, getProblem, type Route } from "@/lib/problems";
import { fellowshipName, fellowshipColor } from "@/lib/fellowships";
import { fellowshipSlug } from "@/lib/cities";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problem: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; problem: string }> }): Promise<Metadata> {
  const { locale, problem } = await params;
  const p = getProblem(problem, locale);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: alts(locale, `/support-groups/${p.slug}`),
    openGraph: { title: p.title, description: p.description, url: `/support-groups/${p.slug}`, type: "website" },
  };
}

function RouteCards({ routes }: { routes: Route[] }) {
  return (
    <div className="route-cards">
      {routes.map((r) => {
        const name = fellowshipName(r.code);
        return (
          <Link key={r.code} className="route-card" href={`/${fellowshipSlug(r.code)}`}>
            <span className="route-dot" style={{ background: fellowshipColor(r.code) }} aria-hidden />
            <span className="route-text">
              <b>{name} <span className="route-code">({r.code})</span></b>
              <small>{r.note}</small>
            </span>
            <Icon name="chevron" size={20} className="route-chev" />
          </Link>
        );
      })}
    </div>
  );
}

export default async function ProblemPage({ params }: { params: Promise<{ locale: string; problem: string }> }) {
  const { locale, problem } = await params;
  setRequestLocale(locale);
  const p = getProblem(problem, locale);
  if (!p) notFound();
  const t = await getTranslations("problem");

  const others = getProblems(locale).filter((x) => x.slug !== p.slug);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: p.h1,
        description: p.description,
        url: `https://fellow.space/support-groups/${p.slug}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Support by problem", item: "https://fellow.space/support-groups" },
          { "@type": "ListItem", position: 3, name: p.h1, item: `https://fellow.space/support-groups/${p.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">{t("backHome")}</Link> · <Link href="/support-groups" className="back">{t("supportByFacing")}</Link>
      </p>
      <h1>{p.h1}</h1>
      <p>{p.lede}</p>

      {p.self.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{p.affected && p.affected.length ? t("ifAboutYou") : t("whereToStart")}</h2>
          <RouteCards routes={p.self} />
        </>
      ) : null}

      {p.affected && p.affected.length ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{t("ifAboutSomeone")}</h2>
          <p style={{ margin: "0 0 10px", color: "var(--ink-soft)", fontSize: 14.5 }}>
            {t("someoneSub")}
          </p>
          <RouteCards routes={p.affected} />
        </>
      ) : null}

      <p style={{ margin: "22px 0 6px" }}>
        <Link href="/" className="city-chip city-chip-all">{t("searchNearYou")}</Link>
      </p>

      <p className="safety-note" style={{ marginTop: 18 }}>
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>{t("safetyNote")}</span>
      </p>

      <h2 style={{ fontSize: 20, marginTop: 28 }}>{t("exploreMore")}</h2>
      <div className="city-chips">
        {others.map((x) => (
          <Link key={x.slug} href={`/support-groups/${x.slug}`} className="city-chip">{x.short ?? x.h1.replace(/ support groups$/i, "")}</Link>
        ))}
      </div>

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote")}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
