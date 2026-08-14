import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchClient } from "@/components/SearchClient";
import { parseSearchState, isEmptyState, type SearchState } from "@/lib/searchState";
import { CODE_BY_SLUG, fellowshipName } from "@/lib/fellowships";

// The live-search route. This is the interactive tool + the stable landing surface for shared links
// and paid search — NOT an organic SEO page: every variant is `noindex, follow` and canonicals to
// the nearest static content page, so faceted-filter permutations can't spawn thin, near-duplicate
// indexable URLs (see fellow-browse-route-sem-scope.md). The Finder (client) self-seeds all filters
// from the URL; the small server-rendered header below gives ads/AI immediate message-matched,
// crawlable-but-noindexed context and a fast first paint while the tool hydrates.

export const dynamicParams = true; // any location/fellowship combo resolves; content is client-side

// slug → "Washington, DC" (or "ZIP 78701"); pure formatting, no data lookup needed.
function locationName(slug: string): string {
  if (/^\d{5}$/.test(slug)) return `ZIP ${slug}`;
  const parts = slug.split("-");
  const st = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
  const city = parts.slice(0, parts.length > 1 ? -1 : undefined)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return st ? `${city}, ${st}` : city;
}
function fellowshipLabelFromSlug(slug: string): string {
  const code = CODE_BY_SLUG[slug];
  return code ? fellowshipName(code) : slug.toUpperCase();
}

// A human, message-matched heading built from the filter state (for ad relevance + AI/first paint).
function describe(s: SearchState): { h1: string; sub: string } {
  const lead = s.format === "online" ? "Online " : s.format === "in-person" ? "In-person " : "";
  const fell = s.fellowship ? fellowshipLabelFromSlug(s.fellowship) : "Recovery";
  const where = s.near ? ` in ${locationName(s.near)}` : " near you";
  const whenWord = s.when.includes("tonight") ? " — tonight"
    : s.when.includes("today") ? " — today"
    : s.when.includes("tomorrow") ? " — tomorrow" : "";
  const h1 = `${lead}${fell} meetings${where}${whenWord}`.replace(/\s+/g, " ").trim();
  return { h1, sub: "Free, independent meeting finder — in-person and online. Live results below." };
}

// Where a `/search` state canonicals to: the most specific *static* page that exists for it.
function canonicalFor(s: SearchState): string {
  if (s.near && s.fellowship) return `/${s.fellowship}/${s.near}`;   // /aa/washington-dc
  if (s.near) return `/meetings/${s.near}`;                          // /meetings/washington-dc
  if (s.fellowship) return `/${s.fellowship}`;                       // /aa
  return "/";
}

// Reconstruct a query string from Next's searchParams (values may be string | string[]).
function toQueryString(sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ locale: string; slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp = await searchParams;
  // Parse both path and query so the title reflects query filters (format/when/type) too,
  // matching the on-page <h1> — better message-match for shared links and paid-search ads.
  const s = parseSearchState(`/search/${(slug || []).join("/")}`, toQueryString(sp));
  const { h1 } = describe(s);
  const canonical = canonicalFor(s);
  return {
    title: `${h1} · Fellow`,
    description: "Search in-person and online recovery meetings with live day, time, format and accessibility filters.",
    // The tool is intentionally kept out of the index; organic lives on the static pages it points to.
    robots: { index: false, follow: true },
    alternates: { canonical: locale === "es" ? `/es${canonical}` : canonical },
  };
}

export default async function SearchPage({ params, searchParams }: {
  params: Promise<{ locale: string; slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const s = parseSearchState(`/search/${(slug || []).join("/")}`, toQueryString(sp));
  const { h1, sub } = describe(s);

  return (
    <main className="app" id="main-content" tabIndex={-1}>
      <header className="brand">
        <Link href="/" className="brand-link" aria-label="Fellow — home">
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 850, letterSpacing: "-.02em", margin: 0 }}>Fellow</h1>
            <div className="tagline">Find a recovery meeting near you</div>
          </div>
        </Link>
      </header>

      {/* Server-rendered, message-matched header — crawlable context + fast first paint. */}
      <section className="search-head">
        <h2 className="search-h1">{h1}</h2>
        <p className="search-sub">{sub}</p>
      </section>

      <SearchClient />

      {isEmptyState(s) ? null : (
        <p className="search-back"><Link href="/" className="back">← Fellow home</Link></p>
      )}
      <SiteFooter />
    </main>
  );
}
