import type { MetadataRoute } from "next";
import { getCities } from "@/lib/cities";

// Generates /sitemap.xml — the map search engines follow to discover pages. Includes the
// home + about pages plus every city landing page under /meetings/[slug].
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fellow.space";
  const now = new Date();
  const cities = await getCities();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/meetings`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...cities.map((c) => ({
      url: `${base}/meetings/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
