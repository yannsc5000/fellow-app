import type { Metadata } from "next";
import Link from "next/link";
import { getCoverage } from "@/lib/coverage";
import { getFellowshipHub, fellowshipSlug } from "@/lib/cities";
import { fellowshipName, BY_CODE, fellowshipColor, FELLOWSHIPS } from "@/lib/fellowships";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");
const searchHref = (code: string) => `/?q=${encodeURIComponent(fellowshipName(code))}`;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCoverage();
  const names = c.fellowships.slice(0, 4).map(fellowshipName).join(", ");
  const title = "Recovery fellowships — AA, NA & more | Fellow";
  const description = `Browse recovery meetings by fellowship: ${names} and more. ${fmt(c.placed)} in-person meetings across ${c.fellowships.length} fellowships — free, with no sign-up, on Fellow.`;
  return {
    title,
    description,
    alternates: { canonical: "/fellowships" },
    openGraph: { title, description, url: "/fellowships", type: "website" },
  };
}

export default async function FellowshipsPage() {
  const [c, hub] = await Promise.all([getCoverage(), getFellowshipHub()]);
  // List EVERY fellowship: the ones we index (biggest in-person first), then the rest of the
  // taxonomy (seeded pages, "coverage coming"), so the hub covers the whole family.
  const indexed = c.fellowships;
  const seeded = FELLOWSHIPS.map((f) => f.code).filter((code) => !indexed.includes(code));
  const list = [...indexed, ...seeded];

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Recovery fellowships on Fellow",
        url: "https://fellow.space/fellowships",
        description: `Recovery meetings by fellowship across the US — ${list.map(fellowshipName).join(", ")}.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Fellowships", item: "https://fellow.space/fellowships" },
        ],
      },
    ],
  };

  return (
    <main className="app" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <header className="brand">
        <Link href="/" className="brand-link" aria-label="Fellow — back to home">
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">Find your people</div>
          </div>
        </Link>
      </header>

      <section className="cov-head">
        <h2>Recovery fellowships</h2>
        <p>
          Fellow covers <strong>{list.length}</strong> recovery fellowships — 12-step programs and related
          peer-support paths — with live meetings indexed for <strong>{indexed.length}</strong> of them and an
          overview page for every one. Pick a fellowship to see where it meets, or search any by name.
        </p>
        <p style={{ margin: "10px 0 0" }}>
          <Link href="/support-groups" className="city-chip city-chip-all">Not sure which fits? Find support by what you're facing →</Link>
        </p>
      </section>

      <div className="fh-list">
        {list.map((code) => {
          const cities = (hub[code] || []).slice(0, 10);
          const total = c.inPerson[code] || 0;
          const group = BY_CODE[code]?.group;
          const name = fellowshipName(code);
          const isSeeded = !indexed.includes(code);
          return (
            <section className={"fh-card" + (isSeeded ? " fh-card-seeded" : "")} key={code}>
              <Link href={`/${fellowshipSlug(code)}`} className="fh-top fh-top-link">
                <span className="fh-dot" style={{ background: fellowshipColor(code) }} aria-hidden />
                <h3 className="fh-name">{name} <span className="fh-code">{code}</span></h3>
                {isSeeded
                  ? <span className="fh-count fh-count-soon">Coverage coming</span>
                  : <span className="fh-count">{fmt(total)}<span className="fh-count-l"> meetings</span></span>}
              </Link>
              {group && <p className="fh-group">{group}</p>}
              {isSeeded ? (
                <p className="fh-cities"><span className="fh-cities-l">Not indexed yet</span> — the page has an overview and the official {code} finder.</p>
              ) : cities.length > 0 ? (
                <p className="fh-cities">
                  <span className="fh-cities-l">Top cities:</span>{" "}
                  {cities.map((ct, i) => (
                    <span key={ct.slug}>
                      {i > 0 ? " · " : ""}
                      <Link href={`/${fellowshipSlug(code)}/${ct.slug}`}>{ct.city}, {ct.state}</Link>
                    </span>
                  ))}
                </p>
              ) : (
                <p className="fh-cities"><span className="fh-cities-l">Nationwide</span> — including online meetings.</p>
              )}
              <p className="fh-actions">
                {isSeeded
                  ? <Link href={`/${fellowshipSlug(code)}`} className="fh-search">Open the {code} page →</Link>
                  : <Link href={searchHref(code)} className="fh-search">Search {code} meetings →</Link>}
              </p>
            </section>
          );
        })}
      </div>

      <section className="cov-foot-note">
        <p>
          Fellowships marked <em>coverage coming</em> aren&apos;t in an open, shareable meeting directory yet — their
          page carries an overview and a link to the official finder, and we add live meetings as feeds become
          available. Not sure which fellowship fits? <Link href="/support-groups">Find support by what you&apos;re facing →</Link>
        </p>
        <p style={{ margin: "20px 0" }}><Link href="/" className="back">← Back to Fellow</Link></p>
      </section>

      <SiteFooter />
    </main>
  );
}
