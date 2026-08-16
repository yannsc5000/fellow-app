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

  // Build guard: a gutted or missing data file (see the Aug-15 coverage + sitemap incident) collapses
  // this sitemap from ~4,300 URLs to a few dozen, which then ships to search engines and tanks
  // discovery. Fail the build rather than deploy a near-empty sitemap. The floor sits far below the
  // real count and far above any collapsed build; override with SITEMAP_MIN_URLS if coverage is ever
  // intentionally reduced.
  const MIN_URLS = Number(process.env.SITEMAP_MIN_URLS ?? 500);
  if (entries.length < MIN_URLS) {
    throw new Error(
      `sitemap.ts: only ${entries.length} URLs generated (floor ${MIN_URLS}). This almost always means ` +
      `public/data/meetings.json.gz is gutted or missing — refusing to build a near-empty sitemap. ` +
      `If this reduction is intentional, set SITEMAP_MIN_URLS lower.`,
    );
  }

  return entries.map((e) => ({ ...e, alternates: { languages: { es: esUrl(e.url) } } }));
}
