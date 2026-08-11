import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PROBLEMS } from "@/lib/problems";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Which Support Group Is Right for Me? | Fellow",
  description: "Not sure which recovery group fits? Start from what you're facing — alcohol, drugs, gambling, food, relationships, family of someone struggling — and we'll point you to the right fellowship and real meetings.",
  alternates: { canonical: "/support-groups" },
  openGraph: {
    title: "Which Support Group Is Right for Me? | Fellow",
    description: "Start from what you're facing and find the right recovery fellowship and meetings.",
    url: "/support-groups",
    type: "website",
  },
};

export default async function SupportGroupsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supportGroups");
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Find recovery support by what you're facing",
        description: "Problem-first directory routing people to the right recovery fellowship and meetings.",
        url: "https://fellow.space/support-groups",
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Support by problem", item: "https://fellow.space/support-groups" },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">{t("back")}</Link> · <Link href="/fellowships" className="back">{t("allFellowships")}</Link>
      </p>
      <h1>{t("h1")}</h1>
      <p>{t("lede")}</p>

      <div className="route-cards" style={{ marginTop: 18 }}>
        {PROBLEMS.map((p) => (
          <Link key={p.slug} className="route-card" href={`/support-groups/${p.slug}`}>
            <span className="route-text" style={{ marginLeft: 2 }}>
              <b>{p.h1}</b>
              <small>{p.lede.split(". ")[0]}.</small>
            </span>
            <Icon name="chevron" size={20} className="route-chev" />
          </Link>
        ))}
      </div>

      <p style={{ margin: "26px 0 6px" }}>
        <Link href="/" className="city-chip city-chip-all">{t("searchNearYou")}</Link>
      </p>

      <p style={{ margin: "24px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote")} <Link href="/about">{t("aboutSources")}</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
