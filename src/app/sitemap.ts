import type { MetadataRoute } from "next";
import { getCities, getFellowshipCityParams, getStateParams, getSeededFellowships, getFellowshipAllParams, fellowshipSlug } from "@/lib/cities";
import { PROBLEMS } from "@/lib/problems";
import stats from "@/lib/fellowship-stats.json";

// Generates /sitemap.xml — the map search engines follow to discover pages. Includes the
// home + about pages, every fellowship landing page (/[fellowship], including seeded ones),
// every city landing page (/meetings/[slug]) and every fellowship×city page (/[fellowship]/[slug]).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fellow.space";
  // <lastmod> = the date the meeting dataset was last refreshed, NOT the build time. Deriving it
  // from the committed data (fellowship-stats.json) means a redeploy that doesn't change the data
  // leaves every <lastmod> untouched — so we don't falsely tell search engines all ~8,770 pages
  // changed on every deploy. Falls back to now only if the stamp is missing.
  const generatedAt = (stats as { generatedAt?: string }).generatedAt;
  const stamp = generatedAt ? new Date(generatedAt) : new Date();
  const now = Number.isNaN(stamp.getTime()) ? new Date() : stamp;
  const [cities, fc, states, seeded, allParams] = await Promise.all([
    getCities(), getFellowshipCityParams(), getStateParams(), getSeededFellowships(), getFellowshipAllParams(),
  ]);
  // Each URL also advertises its Spanish counterpart via hreflang alternates (/es/…), so search
  // engines index and serve the right language. (next-intl's middleware adds Link-header alternates
  // too; declaring them in the sitemap is the belt-and-suspenders SEO signal.)
  const esUrl = (url: string) => (url === `${base}/` ? `${base}/es` : url.replace(base, `${base}/es`));
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/meetings`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/fellowships`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/coverage`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    // Crawlable reference page — indexable and in the sitemap, but deliberately NOT linked from nav/footer.
    { url: `${base}/taxonomy`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/support-groups`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...PROBLEMS.map((p) => ({
      url: `${base}/support-groups/${p.slug}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...seeded.map((code) => ({
      url: `${base}/${fellowshipSlug(code)}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...allParams.map((p) => ({
      url: `${base}/${p.fellowship}/all`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.6,
    })),
    ...states.map((s) => ({
      url: `${base}/state/${s.st}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...cities.map((c) => ({
      url: `${base}/meetings/${c.slug}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...cities.map((c) => ({
      url: `${base}/meetings/${c.slug}/all`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.6,
    })),
    ...fc.map((x) => ({
      url: `${base}/${x.fellowship}/${x.slug}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.6,
    })),
  ];
  return entries.map((e) => ({ ...e, alternates: { languages: { es: esUrl(e.url) } } }));
}
