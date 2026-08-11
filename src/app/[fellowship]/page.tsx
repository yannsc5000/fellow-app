import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFellowshipHub, getFellowshipAll, getSeededFellowships, fellowshipSlug, stateSlug, STATE_NAMES } from "@/lib/cities";
import { fellowshipName, fellowshipColor, fellowshipDesc, CODE_BY_SLUG, BY_CODE, FELLOWSHIPS } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { SoberActivities } from "@/components/SoberActivities";
import { FellowshipBeyond } from "@/components/FellowshipBeyond";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

export const dynamicParams = false;

export async function generateStaticParams() {
  const seeded = await getSeededFellowships();
  return seeded.map((code) => ({ fellowship: fellowshipSlug(code) }));
}

async function resolve(fellowship: string) {
  const code = CODE_BY_SLUG[fellowship];
  if (!code) return null;
  const fa = await getFellowshipAll(fellowship); // meeting counts + existence (null if none indexed)
  const finder = officialFinder(code);
  return { code, fa, finder };
}

export async function generateMetadata({ params }: { params: Promise<{ fellowship: string }> }): Promise<Metadata> {
  const { fellowship } = await params;
  const r = await resolve(fellowship);
  if (!r) return {};
  const name = fellowshipName(r.code);
  const desc = fellowshipDesc(r.code);
  // Long-tail, intent-rich title/description (see SEO principles doc) — "online & near you",
  // "free and anonymous", "secular", the fellowship name — phrased naturally, not stuffed.
  const title = `${name} (${r.code}) Meetings — Online & Near You | Fellow`;
  const description = r.fa
    ? `Find free, anonymous ${name} (${r.code}) meetings near you — ${fmt(r.fa.inPerson)} in person plus online. Browse by city, filter by day and time, and find secular and young people's groups on Fellow.`
    : (desc
        ? `${desc} Find ${r.code} meetings online and near you, plus the official ${r.code} directory — free and anonymous, on Fellow.`
        : `${name} (${r.code}) meetings online and near you — free and anonymous, on Fellow.`);
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
  const { code, fa, finder } = r;
  const name = fellowshipName(code);
  const group = BY_CODE[code]?.group;
  const desc = fellowshipDesc(code);
  const hasMeetings = !!fa;
  const inPerson = fa?.inPerson || 0;
  const online = fa?.online || 0;

  const hub = await getFellowshipHub();
  const cities = hub[code] || [];
  const liveSearch = `/?q=${encodeURIComponent(name)}`;

  // group this fellowship's city pages by state
  const byState: Record<string, { slug: string; city: string; count: number }[]> = {};
  for (const ct of cities) (byState[ct.state] ||= []).push({ slug: ct.slug, city: ct.city, count: ct.count });
  const states = Object.keys(byState).sort((a, b) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b));

  // Related fellowships in the same family (internal links — relevant + good for SEO).
  const related = FELLOWSHIPS.filter((f) => f.code !== code && f.group === group).map((f) => f.code);

  // Fellowship-specific FAQ — answers the real long-tail questions people search (free? online?
  // non-religious? young people's meetings?). Rendered visibly AND as FAQPage structured data.
  const faqs: { q: string; a: string }[] = [
    {
      q: `Are ${code} meetings free and anonymous?`,
      a: `Yes. ${code} meetings are free to attend — no dues, fees, referral, or insurance needed — and anonymity is a core principle, so you can come as you are. Anyone who wants help is welcome.`,
    },
    {
      q: `Can I attend ${code} meetings online?`,
      a: hasMeetings && online
        ? `Yes. Fellow lists ${fmt(online)} online ${code} meetings you can join from anywhere, alongside in-person groups near you.`
        : `Many ${code} groups meet online as well as in person. ${finder ? `The official ${code} finder lists current online meetings` : `Each group's own website lists current online meetings`}.`,
    },
    {
      q: `Do I have to be religious to join ${code}?`,
      a: `No. ${code} welcomes people of any religion or none. The program is usually described as spiritual rather than religious, and many areas offer secular, agnostic, or non-religious meetings.`,
    },
  ];
  if (hasMeetings) {
    faqs.push({
      q: `Are there ${code} meetings for specific groups, like women's or young people's?`,
      a: `Often, yes. Larger areas hold meetings for specific communities — women's, men's, young people's, LGBTQ+, and newcomers' groups among them. Use Fellow's live search to filter for the meeting that fits.`,
    });
  }

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${name} (${code}) meetings`,
        description: desc || undefined,
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
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
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

      {desc ? <p>{desc}</p> : null}

      {hasMeetings ? (
        <p>
          Fellow lists <strong>{fmt(inPerson)}</strong> in-person {name} ({code}) meetings across the US
          {online ? <>, plus <strong>{fmt(online)}</strong> online</> : <>, plus online meetings</>}.
          {" "}Details change often — confirm with the group before you go. For live day/time filters and maps,{" "}
          <Link href={liveSearch}>search {code} meetings →</Link>
        </p>
      ) : (
        <p>
          Fellow doesn’t index {code} meetings in its own directory yet.
          {finder ? <> The official {code} meeting finder below is the most complete place to look right now.</> : <> Most {code} groups publish their schedule on their own websites; check back as Fellow’s coverage grows.</>}
        </p>
      )}

      <p style={{ margin: "12px 0 6px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {hasMeetings ? (
          <Link href={`/${fellowship}/all`} className="city-chip city-chip-all">
            See all {code} meetings — in-person &amp; online, by day →
          </Link>
        ) : null}
        {finder ? (
          <a href={finder.url} className="city-chip city-chip-all" target="_blank" rel="noopener nofollow">
            {finder.label} <Icon name="external" size={14} />
          </a>
        ) : null}
      </p>

      {hasMeetings && states.length > 0 ? (
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
      ) : null}

      {related.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>Related fellowships</h2>
          <p style={{ margin: "0 0 8px", color: "var(--ink-soft)", fontSize: 14.5 }}>
            Other {group?.toLowerCase()} fellowships on Fellow:
          </p>
          <div className="city-chips">
            {related.map((rc) => (
              <Link key={rc} href={`/${fellowshipSlug(rc)}`} className="city-chip">
                <span className="fh-dot" style={{ background: fellowshipColor(rc), display: "inline-block", width: 9, height: 9, borderRadius: "50%", marginRight: 6, verticalAlign: "middle" }} aria-hidden />
                {rc} <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>— {fellowshipName(rc)}</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <hr style={{ border: 0, borderTop: "1px solid var(--panel-line)", margin: "28px 0 0" }} />
      <h2 style={{ fontSize: 20, marginTop: 20 }}>Common questions about {code}</h2>
      {faqs.map((f) => (
        <div key={f.q} style={{ margin: "12px 0" }}>
          <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>{f.q}</h3>
          <p style={{ margin: 0 }}>{f.a}</p>
        </div>
      ))}

      <SoberActivities fellowship={code} />
      <FellowshipBeyond code={code} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with {name} or any fellowship.
        Meeting listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
