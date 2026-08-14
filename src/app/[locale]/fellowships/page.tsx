import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { alts } from "@/lib/meta";
import { getCoverage } from "@/lib/coverage";
import { fellowshipName } from "@/lib/fellowships";
import { FellowshipTaxonomy } from "@/components/FellowshipTaxonomy";

// /fellowships renders the shared FellowshipTaxonomy body (identical to /taxonomy for now — /taxonomy
// is where we iterate on the design). Keeps its own metadata so its established SEO title/description
// and canonical stay intact.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const c = await getCoverage();
  const t = await getTranslations({ locale, namespace: "meta" });
  const names = c.fellowships.slice(0, 4).map(fellowshipName).join(", ");
  const title = t("fellowshipsTitle");
  const description = t("fellowshipsDesc", { names, placed: c.placed, n: c.fellowships.length });
  return {
    title,
    description,
    alternates: alts(locale, "/fellowships"),
    openGraph: { title, description, url: "/fellowships", type: "website" },
  };
}

export default async function FellowshipsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FellowshipTaxonomy locale={locale} canonicalPath="/fellowships" />;
}
