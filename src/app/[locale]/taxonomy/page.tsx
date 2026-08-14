import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { fellowshipSlug } from "@/lib/cities";
import { FELLOWSHIPS } from "@/lib/fellowships";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

// The recovery-fellowship taxonomy — our simple, refinable index: every fellowship as a plain text
// link ("CODE — Name"), grouped by what it addresses. Diverged from /fellowships (which keeps the
// richer card layout via FellowshipTaxonomy). noindex + absent from the sitemap: a sandbox, not a
// second indexable copy. Reachable by direct URL; NOT linked from nav/footer.

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
    robots: { index: false, follow: true },
    alternates: alts(locale, "/taxonomy"),
    openGraph: { title, description, url: "/taxonomy", type: "website" },
  };
}

export default async function TaxonomyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("taxonomy");
  const tc = await getTranslations("common");

  const byGroup: Record<string, typeof FELLOWSHIPS> = {};
  for (const f of FELLOWSHIPS) (byGroup[f.group] ||= []).push(f);
  for (const g of Object.keys(byGroup)) byGroup[g].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="app" id="main-content">
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
        <p>{t("metaDesc")}</p>
      </section>

      {GROUP_ORDER.map((grp) => {
        const list = byGroup[grp] || [];
        if (!list.length) return null;
        return (
          <section key={grp} style={{ margin: "24px 0 0" }}>
            <h2 style={{ fontSize: 18, fontWeight: 850, letterSpacing: "-.01em", margin: "0 0 8px" }}>{t(`group.${GROUP_KEY[grp]}`)}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, lineHeight: 1.7 }}>
              {list.map((f) => (
                <Link key={f.code} href={`/${fellowshipSlug(f.code)}`} style={{ color: "var(--brand-ink)", fontWeight: 750, textDecoration: "none", width: "fit-content" }}>
                  {f.code} — {f.name}
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="cov-foot-note" style={{ marginTop: 28 }}>
        <p style={{ margin: "20px 0" }}><Link href="/" className="back">{t("backToFellow")}</Link></p>
      </section>
      <SiteFooter />
    </main>
  );
}
