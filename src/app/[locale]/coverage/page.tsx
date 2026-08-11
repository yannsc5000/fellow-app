import type { Metadata } from "next";
import Link from "next/link";
import { getCoverage } from "@/lib/coverage";
import { fellowshipName } from "@/lib/fellowships";
import { Mark } from "@/components/Mark";
import CoverageMap from "@/components/CoverageMap";
import { SiteFooter } from "@/components/SiteFooter";
import stats from "@/lib/fellowship-stats.json";

const fmt = (n: number) => n.toLocaleString("en-US");
// Honest freshness date from the ingest run that produced the committed dataset.
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtStamp(iso: string): string {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${MON[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : "";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCoverage();
  const title = `U.S. meeting coverage — ${fmt(c.placed)} recovery meetings mapped | Fellow`;
  const description = `Fellow indexes ${fmt(c.total)} AA, NA and other recovery meetings across all 50 states + DC — ${fmt(c.placed)} in-person meetings mapped and ${fmt(c.online)} online. See coverage by state and by fellowship.`;
  return {
    title,
    description,
    alternates: { canonical: "/coverage" },
    openGraph: { title, description, url: "/coverage", type: "website" },
  };
}

export default async function CoveragePage() {
  const c = await getCoverage();
  const topFellowships = c.fellowships.map((f) => `${fellowshipName(f)} (${fmt(c.inPerson[f])})`);
  const refreshed = fmtStamp((stats as { generatedAt?: string }).generatedAt || "");

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "U.S. recovery meeting coverage",
        url: "https://fellow.space/coverage",
        description: `Coverage of ${fmt(c.total)} recovery meetings across all 50 US states and DC, by state and fellowship.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Coverage", item: "https://fellow.space/coverage" },
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
        <h2>U.S. meeting coverage</h2>
        <p>
          Fellow indexes <strong>{fmt(c.total)}</strong> recovery meetings across all 50 states and DC — pulled from
          public intergroup feeds{refreshed ? <>, last refreshed <strong>{refreshed}</strong></> : ""}. Here&apos;s where
          they are, by state and by fellowship. Tap any state to open its page.
        </p>
      </section>

      <div className="cov-stats">
        <div className="cov-stat"><div className="n">{fmt(c.total)}</div><div className="l">meetings indexed</div></div>
        <div className="cov-stat"><div className="n">{fmt(c.placed)}</div><div className="l">in person</div></div>
        <div className="cov-stat"><div className="n">{fmt(c.online)}</div><div className="l">online (nationwide)</div></div>
        <div className="cov-stat"><div className="n n-accent">{c.statesCovered}/51</div><div className="l">states + DC covered</div></div>
      </div>
      {refreshed ? <p className="cov-fresh">Meeting data last refreshed {refreshed}. Individual listings can change between refreshes — always confirm details with the group before you go.</p> : null}

      <CoverageMap data={c} />

      <section className="cov-foot-note">
        <p>
          Shading is the per-state meeting count for the selected fellowship, log-scaled and relative to that view&apos;s
          busiest state, so smaller fellowships still read clearly. Online meetings are available nationwide and aren&apos;t
          placed on the map. Counts come from the latest ingest and can shift run to run as feeds update.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
