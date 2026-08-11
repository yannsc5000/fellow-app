import type { Metadata } from "next";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problems";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Which Support Group Is Right for Me? | Find Recovery Support",
  description: "Not sure which recovery group fits? Start from what you're facing — alcohol, drugs, gambling, food, relationships, family of someone struggling — and we'll point you to the right fellowship and real meetings.",
  alternates: { canonical: "/support-groups" },
  openGraph: {
    title: "Which Support Group Is Right for Me? | Find Recovery Support",
    description: "Start from what you're facing and find the right recovery fellowship and meetings.",
    url: "/support-groups",
    type: "website",
  },
};

export default function SupportGroupsIndex() {
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Find recovery support by what you're facing",
        description: "Problem-first directory routing people to the right recovery fellowship and meetings.",
        url: "https://fellow.space/support-groups",
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Support by problem", item: "https://fellow.space/support-groups" },
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
      <h1>Which support group is right for me?</h1>
      <p>
        Many people know what they're struggling with but not the name of the group that can help. Start from what
        you're facing and Fellow will point you to the right fellowship — and to real meetings you can attend. If a
        loved one is the one struggling, there's support for you too.
      </p>

      <div className="route-cards" style={{ marginTop: 18 }}>
        {PROBLEMS.map((p) => (
          <Link key={p.slug} className="route-card" href={`/support-groups/${p.slug}`}>
            <span className="route-text" style={{ marginLeft: 2 }}>
              <b>{p.h1}</b>
              <small>{p.lede.split(". ")[0]}.</small>
            </span>
            <Icon name="chevron" size={20} className="route-chev" />
          </Link>
        ))}
      </div>

      <p style={{ margin: "26px 0 6px" }}>
        <Link href="/" className="city-chip city-chip-all">Search recovery meetings near you →</Link>
      </p>

      <p style={{ margin: "24px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with any fellowship. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
