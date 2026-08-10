import type { MetadataRoute } from "next";

// Generates /robots.txt — lets search engines crawl everything except the API,
// and points them at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: "https://fellow.space/sitemap.xml",
    host: "https://fellow.space",
  };
}
