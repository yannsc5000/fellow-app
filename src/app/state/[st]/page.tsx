import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getState, getStateParams, fellowshipSlug } from "@/lib/cities";
import { fellowshipName, fellowshipColor } from "@/lib/fellowships";
import { SoberActivities } from "@/components/SoberActivities";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

export const dynamicParams = false;

export async function generateStaticParams() {
  return getStateParams();
}

export async function generateMetadata({ params }: { params: Promise<{ st: string }> }): Promise<Metadata> {
  const { st } = await params;
  const s = await getState(st);
  if (!s) return {};
  const fell = s.fellowships.map(fellowshipName).slice(0, 3).join(", ");
  const title = `Recovery meetings in ${s.stateName} — AA, NA & more | Fellow`;
  const description = `${fmt(s.count)} in-person recovery meetings across ${s.cities.length} ${s.stateName} cities: ${fell}${s.fellowships.length > 3 ? " and more" : ""}. Find AA, NA and other meetings near you, free on Fellow.`;
  return {
    title, description,
    alternates: { canonical: `/state/${st.toLowerCase()}` },
    openGraph: { title, description, url: `/state/${st.toLowerCase()}`, type: "website" },
  };
}

export default async function StatePage({ params }: { params: Promise<{ st: string }> }) {
  const { st } = await params;
  const s = await getState(st);
  if (!s) notFound();
  const liveSearch = `/?q=${encodeURIComponent(s.stateName)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Recovery meetings in ${s.stateName}`,
        url: `https://fellow.space/state/${st.toLowerCase()}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Coverage", item: "https://fellow.space/coverage" },
          { "@type": "ListItem", position: 3, name: s.stateName, item: `https://fellow.space/state/${st.toLowerCase()}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">← Fellow home</Link> · <Link href="/coverage" className="back">Coverage map</Link> ·{" "}
        <Link href="/meetings" className="back">All cities</Link>
      </p>
      <h1>Recovery meetings in {s.stateName}</h1>
      <p>
        Fellow lists <strong>{fmt(s.count)}</strong> in-person recovery meetings across {s.stateName}
        {s.cities.length ? <> — in {s.cities.length} cit{s.cities.length === 1 ? "y" : "ies"}</> : null}.
        For online meetings, maps and live day/time filters, <Link href={liveSearch}>search {s.stateName} on Fellow →</Link>
      </p>

      {s.fellowships.length > 0 && (
        <p style={{ margin: "8px 0 4px" }}>
          <strong>Fellowships here:</strong>{" "}
          {s.fellowships.map((code, i) => (
            <span key={code}>
              {i > 0 ? " · " : ""}
              <Link href={`/${fellowshipSlug(code)}`}>
                <span className="fh-dot" style={{ background: fellowshipColor(code), display: "inline-block", width: 9, height: 9, borderRadius: "50%", marginRight: 5, verticalAlign: "middle" }} aria-hidden />
                {code}
              </Link>
            </span>
          ))}
        </p>
      )}

      {s.cities.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 22 }}>Cities in {s.stateName}</h2>
          <div className="city-chips">
            {s.cities.map((ct) => (
              <Link key={ct.slug} href={`/meetings/${ct.slug}`} className="city-chip">
                {ct.city} <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>({ct.count})</span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p style={{ marginTop: 16 }}>
          Meetings in {s.stateName} are best found by live search right now. <Link href={liveSearch}>Search {s.stateName} →</Link>
        </p>
      )}

      <SoberActivities stateName={s.stateName} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent, non-commercial meeting finder — not affiliated with any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
