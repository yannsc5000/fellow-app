import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCities } from "@/lib/cities";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Recovery meetings by city — browse AA, NA & more | Fellow",
  description: "Browse recovery meetings by city across the US. Find AA, NA, and other 12-step and peer-support meetings near you, free on Fellow.",
  alternates: { canonical: "/meetings" },
  openGraph: {
    title: "Recovery meetings by city | Fellow",
    description: "Browse in-person recovery meetings by city across the US — AA, NA and more, free on Fellow.",
    url: "/meetings",
    type: "website",
  },
};

export default async function MeetingsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("meetingsIndex");
  const cities = await getCities();
  // Group by state (getCities already sorts by stateName, then count).
  const byState: Record<string, typeof cities> = {};
  for (const c of cities) (byState[c.stateName] ||= []).push(c);
  const states = Object.keys(byState).sort();
  const total = cities.reduce((n, c) => n + c.count, 0);

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Recovery meetings by city",
        url: "https://fellow.space/meetings",
        description: `Browse in-person recovery meetings across ${states.length} states and ${cities.length} cities on Fellow.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}><Link href="/" className="back">{t("backHome")}</Link></p>
      <h1>{t("h1")}</h1>
      <p>
        {t.rich("lead", {
          states: states.length,
          cities: cities.length.toLocaleString(),
          total: total.toLocaleString(),
          s: (ch) => <Link href="/">{ch}</Link>,
        })}
      </p>

      {states.map((st) => (
        <section key={st} style={{ margin: "18px 0" }}>
          <h2 style={{ fontSize: 20 }}>
            <Link href={`/state/${byState[st][0].state.toLowerCase()}`}>{st}</Link>
          </h2>
          <p style={{ margin: 0, lineHeight: 2 }}>
            {byState[st].map((c, i) => (
              <span key={c.slug}>
                {i > 0 ? " · " : ""}
                <Link href={`/meetings/${c.slug}`}>{c.city}</Link>{" "}
                <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>({c.count})</span>
              </span>
            ))}
          </p>
        </section>
      ))}

      <p style={{ margin: "28px 0" }}><Link href="/" className="back">{t("backToFellow")}</Link></p>
      <SiteFooter />
    </main>
  );
}
