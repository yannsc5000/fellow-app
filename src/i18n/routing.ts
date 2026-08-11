import { defineRouting } from "next-intl/routing";

// English is the default and stays UNPREFIXED (/, /about, /meetings/...) so every existing URL and
// its SEO equity is preserved. Spanish lives under /es (/es, /es/about, …). 'as-needed' = no /en.
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
