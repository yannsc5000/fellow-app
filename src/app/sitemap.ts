import type { MetadataRoute } from "next";
import { getCities, getFellowshipCityParams, getStateParams } from "@/lib/cities";
import { getCoverage } from "@/lib/coverage";
import { fellowshipSlug } from "@/lib/cities";

// Generates /sitemap.xml — the map search engines follow to discover pages. Includes the
// home + about pages, every city landing page (/meetings/[slug]) and every fellowship×city
// page (/[fellowship]/[slug]).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fellow.space";
  const now = new Date();
  const [cities, fc, states, cov] = await Promise.all([
    getCities(), getFellowshipCityParams(), getStateParams(), getCoverage(),
  ]);
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/meetings`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/fellowships`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/coverage`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...cov.fellowships.map((code) => ({
      url: `${base}/${fellowshipSlug(code)}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...cov.fellowships.map((code) => ({
      url: `${base}/${fellowshipSlug(code)}/all`,
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
}
