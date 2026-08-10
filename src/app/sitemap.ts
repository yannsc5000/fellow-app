import type { MetadataRoute } from "next";

// Generates /sitemap.xml — the map search engines follow to discover pages.
// Fellow's real content is the client-side search, so the crawlable surface is small
// (home + about); this is the base to grow from as we add city/fellowship landing pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fellow.space";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
