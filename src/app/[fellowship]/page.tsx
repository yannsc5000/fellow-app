import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCoverage } from "@/lib/coverage";
import { getFellowshipHub, fellowshipSlug, stateSlug, STATE_NAMES } from "@/lib/cities";
import { fellowshipName, BY_CODE, fellowshipColor } from "@/lib/fellowships";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

export const dynamicParams = false;

export async function generateStaticParams() {
  const c = await getCoverage();
  return c.fellowships.map((code) => ({ fellowship: fellowshipSlug(code) }));
}

async function resolve(fellowship: string) {
  const c = await getCoverage();
  const code = c.fellowships.find((f) => fellowshipSlug(f) === fellowship);
  return code ? { c, code } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ fellowship: string }> }): Promise<Metadata> {
  const { fellowship } = await params;
  const r = await resolve(fellowship);
  if (!r) return {};
  const name = fellowshipName(r.code);
  const total = r.c.inPerson[r.code] || 0;
  const title = `${name} (${r.code}) meetings | Fellow`;
  const description = `Find ${name} (${r.code}) meetings across the US — ${fmt(total)} in-person, plus online. Browse by city or search live, free and anonymous on Fellow.`;
  return {
    title, description,
    alternates: { canonical: `/${fellowship}` },
    openGraph: { title, description, url: `/${fellowship}`, type: "website" },
  };
}

export default async function FellowshipPage({ params }: { params: Promise<{ fellowship: string }> }) {
  const { fellowship } = await params;
  const r = await resolve(fellowship);
  if (!r) notFound();
  const { c, code } = r;
  const name = fellowshipName(code);
  const total = c.inPerson[code] || 0;
  const group = BY_CODE[code]?.group;
  const hub = await getFellowshipHub();
  const cities = hub[code] || [];
  const liveSearch = `/?q=${encodeURIComponent(name)}`;

  // group this fellowship's city pages by state
  const byState: Record<string, { slug: string; city: string; count: number }[]> = {};
  for (const ct of cities) (byState[ct.state] ||= []).push({ slug: ct.slug, city: ct.city, count: ct.count });
  const states = Object.keys(byState).sort((a, b) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b));

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${name} (${code}) meetings`,
        url: `https://fellow.space/${fellowship}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Fellowships", item: "https://fellow.space/fellowships" },
          { "@type": "ListItem", position: 3, name: `${code}`, item: `https://fellow.space/${fellowship}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">← Fellow home</Link> · <Link href="/fellowships" className="back">All fellowships</Link>
      </p>
      <h1>
        <span className="fh-dot" style={{ background: fellowshipColor(code), display: "inline-block", width: 14, height: 14, borderRadius: "50%", marginRight: 10, verticalAlign: "middle" }} aria-hidden />
        {name} ({code}) meetings
      </h1>
      <p>
        Fellow lists <strong>{fmt(total)}</strong> in-person {name} ({code}) meetings across the US{group ? `, plus online meetings` : ""}.
        {" "}Details change often — confirm with the group before you go. For online {code} meetings and live day/time
        filters, <Link href={liveSearch}>search {code} meetings →</Link>
      </p>

      {states.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{code} meetings by city</h2>
          {states.map((abbr) => {
            const list = byState[abbr].sort((a, b) => b.count - a.count);
            return (
              <section key={abbr} style={{ margin: "14px 0" }}>
                <h3 style={{ fontSize: 16, margin: "0 0 8px" }}>
                  <Link href={`/state/${stateSlug(abbr)}`}>{STATE_NAMES[abbr] || abbr}</Link>
                </h3>
                <div className="city-chips">
                  {list.map((ct) => (
                    <Link key={ct.slug} href={`/${fellowship}/${ct.slug}`} className="city-chip">
                      {ct.city} <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>({ct.count})</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : (
        <p style={{ marginTop: 16 }}>
          {name} meetings are available across the US, including online. <Link href={liveSearch}>Search {code} meetings live →</Link>
        </p>
      )}

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with {name} or any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
