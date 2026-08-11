import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PROBLEMS, PROBLEM_BY_SLUG, type Route } from "@/lib/problems";
import { fellowshipName, fellowshipColor } from "@/lib/fellowships";
import { fellowshipSlug } from "@/lib/cities";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problem: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ problem: string }> }): Promise<Metadata> {
  const { problem } = await params;
  const p = PROBLEM_BY_SLUG[problem];
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/support-groups/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `/support-groups/${p.slug}`, type: "website" },
  };
}

function RouteCards({ routes }: { routes: Route[] }) {
  return (
    <div className="route-cards">
      {routes.map((r) => {
        const name = fellowshipName(r.code);
        return (
          <Link key={r.code} className="route-card" href={`/${fellowshipSlug(r.code)}`}>
            <span className="route-dot" style={{ background: fellowshipColor(r.code) }} aria-hidden />
            <span className="route-text">
              <b>{name} <span className="route-code">({r.code})</span></b>
              <small>{r.note}</small>
            </span>
            <Icon name="chevron" size={20} className="route-chev" />
          </Link>
        );
      })}
    </div>
  );
}

export default async function ProblemPage({ params }: { params: Promise<{ problem: string }> }) {
  const { problem } = await params;
  const p = PROBLEM_BY_SLUG[problem];
  if (!p) notFound();

  const others = PROBLEMS.filter((x) => x.slug !== p.slug);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: p.h1,
        description: p.description,
        url: `https://fellow.space/support-groups/${p.slug}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Support by problem", item: "https://fellow.space/support-groups" },
          { "@type": "ListItem", position: 3, name: p.h1, item: `https://fellow.space/support-groups/${p.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">← Fellow home</Link> · <Link href="/support-groups" className="back">Support by what you're facing</Link>
      </p>
      <h1>{p.h1}</h1>
      <p>{p.lede}</p>

      {p.self.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{p.affected && p.affected.length ? "If this is about you" : "Where to start"}</h2>
          <RouteCards routes={p.self} />
        </>
      ) : null}

      {p.affected && p.affected.length ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>If it's about someone you love</h2>
          <p style={{ margin: "0 0 10px", color: "var(--ink-soft)", fontSize: 14.5 }}>
            You can get support for yourself whether or not they're ready to get help.
          </p>
          <RouteCards routes={p.affected} />
        </>
      ) : null}

      <p style={{ margin: "22px 0 6px" }}>
        <Link href="/" className="city-chip city-chip-all">Search recovery meetings near you →</Link>
      </p>

      <p className="safety-note" style={{ marginTop: 18 }}>
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>
          These are independent peer-support fellowships, not medical treatment or crisis care. If you or someone
          else may be in immediate danger, contact your local emergency number.
        </span>
      </p>

      <h2 style={{ fontSize: 20, marginTop: 28 }}>Explore support by what you're facing</h2>
      <div className="city-chips">
        {others.map((x) => (
          <Link key={x.slug} href={`/support-groups/${x.slug}`} className="city-chip">{x.h1.replace(/ support groups$/i, "")}</Link>
        ))}
      </div>

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with any fellowship. We help you find the
        right group and a real meeting; the fellowships themselves run the meetings. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
