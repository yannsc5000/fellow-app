import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Detects the locale (URL prefix → cookie → Accept-Language) and rewrites accordingly.
export default createMiddleware(routing);

export const config = {
  // Run on everything except API routes, Next internals, and files with an extension (assets,
  // sitemap.xml, robots.txt, llms.txt, manifest, images).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
