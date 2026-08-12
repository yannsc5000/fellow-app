// Locale-aware canonical + hreflang alternates for generateMetadata.
// With localePrefix "as-needed", English lives at the unprefixed path and Spanish under /es.
// The canonical must point at the CURRENT locale's URL (a common bug is emitting the English
// canonical on the /es page), and languages: {} advertises the hreflang pair to search engines.
export function alts(locale: string, path: string) {
  const en = path;
  const es = path === "/" ? "/es" : `/es${path}`;
  return {
    canonical: locale === "es" ? es : en,
    languages: { en, es, "x-default": en } as Record<string, string>,
  };
}
