import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFellowshipHub, getFellowshipAll, getSeededFellowships, fellowshipSlug, stateSlug, STATE_NAMES, HUB_CITIES_PER_STATE } from "@/lib/cities";
import { fellowshipName, fellowshipColor, fellowshipDesc, CODE_BY_SLUG, BY_CODE, FELLOWSHIPS } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { SEO, EXTRA_FAQS } from "@/lib/fellowshipContent";
import { CONTACT_EMAIL } from "@/lib/config";
import { SoberActivities } from "@/components/SoberActivities";
import { FellowshipBeyond } from "@/components/FellowshipBeyond";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

// Short, accurate focus phrase per fellowship family — for the "At a glance" facts block.
const GLANCE_FOCUS: Record<string, string> = {
  "Alcohol & drugs": "Recovery from alcohol or drugs",
  "Food & eating": "Recovery around food & eating",
  "Sex & relationships": "Recovery around sex, love & relationships",
  "Money & work": "Recovery around money, work & behavior",
  "Emotional & behavioral": "Emotional & behavioral recovery",
  "Family & friends": "Support for families & friends of someone affected",
};

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
  // Prefer the tuned per-fellowship long-tail title/meta; fall back to a generated one.
  const seo = SEO[r.code];
  const title = seo?.title || `${name} (${r.code}) Meetings — Online & Near You | Fellow`;
  const description = seo?.description || (r.fa
    ? `Find free, anonymous ${name} (${r.code}) meetings near you — ${fmt(r.fa.inPerson)} in person plus online. Browse by city, filter by day and time, and find secular and young people's groups on Fellow.`
    : (desc
        ? `${desc} Find ${r.code} meetings online and near you, plus the official ${r.code} directory — free and anonymous, on Fellow.`
        : `${name} (${r.code}) meetings online and near you — free and anonymous, on Fellow.`));
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
  const submitHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Submit a ${code} group or meeting`)}&body=${encodeURIComponent(`I'd like to submit a ${name} (${code}) group or meeting to Fellow.\n\nMeeting name:\nDay & time:\nLocation or online link:\nWebsite or contact (optional):\n`)}`;

  // "At a glance" facts (entity clarity for humans + AI). Derived from real data — no fabricated dates.
  const focus = GLANCE_FOCUS[group || ""] || "Peer-support recovery";
  const program = code === "RD" ? "Buddhist-inspired peer recovery" : "Twelve Step peer support";
  const onFellow = hasMeetings ? `${fmt(inPerson)} in person · ${fmt(online)} online` : "Not yet indexed — see official finder";
  let finderDomain = "";
  try { finderDomain = finder ? new URL(finder.url).hostname.replace(/^www\./, "") : ""; } catch { finderDomain = ""; }

  // group this fellowship's city pages by state
  const byState: Record<string, { slug: string; city: string; count: number }[]> = {};
  for (const ct of cities) (byState[ct.state] ||= []).push({ slug: ct.slug, city: ct.city, count: ct.count });
  const states = Object.keys(byState).sort((a, b) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b));

  // Related fellowships in the same family (internal links — relevant + good for SEO).
  const related = FELLOWSHIPS.filter((f) => f.code !== code && f.group === group).map((f) => f.code);

  // FAQ = a couple of dynamically-generated, honest answers (free? online? — the online one
  // reflects what Fellow actually indexes) + the fellowship-specific scope / "how is X different
  // from Y?" questions from the content library (which double as "which group is right for me?"
  // routing). Rendered as an accordion AND as FAQPage structured data.
  const extra = EXTRA_FAQS[code] || [];
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
    ...extra,
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

      {hasMeetings ? (
        <>
          {desc ? <p>{desc}</p> : null}
          <p>
            Fellow lists <strong>{fmt(inPerson)}</strong> in-person {name} ({code}) meetings across the US
            {online ? <>, plus <strong>{fmt(online)}</strong> online</> : <>, plus online meetings</>}.
            {" "}Details change often — confirm with the group before you go. For live day/time filters and maps,{" "}
            <Link href={liveSearch}>search {code} meetings →</Link>
          </p>
          <p style={{ margin: "12px 0 6px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Link href={`/${fellowship}/all`} className="city-chip city-chip-all">
              See all {code} meetings — in-person &amp; online, by day →
            </Link>
            {finder ? (
              <a href={finder.url} className="city-chip city-chip-all" target="_blank" rel="noopener nofollow">
                {finder.label} <Icon name="external" size={14} />
              </a>
            ) : null}
          </p>
        </>
      ) : (
        <>
          <p className="fell-apology">
            We don’t have {name} ({code}) meetings on Fellow just yet — we’re still growing our coverage, and
            more is on the way. In the meantime, here are a few related ways to find support and connection.
          </p>
          <p style={{ margin: "12px 0 8px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <a href={submitHref} className="btn-secondary"><Icon name="add" size={16} /> Submit a group or meeting</a>
            {finder ? (
              <a href={finder.url} className="city-chip city-chip-all" target="_blank" rel="noopener nofollow">
                {finder.label} <Icon name="external" size={14} />
              </a>
            ) : null}
          </p>
          {desc ? <p style={{ color: "var(--ink-soft)" }}>{desc}</p> : null}
        </>
      )}

      {group === "Alcohol & drugs" ? (
        <p className="safety-note">
          <span className="sn-i"><Icon name="info" size={17} /></span>
          <span>
            A meeting is peer support, not medical care. If you’ve been drinking or using heavily for a
            long time, stopping suddenly can be risky — some withdrawal needs medical attention, and
            alcohol withdrawal in particular can be dangerous. If you feel unwell or unsafe, contact a
            doctor or your local emergency number.
          </span>
        </p>
      ) : null}

      <p className="glance-cap">At a glance</p>
      <div className="glance" aria-label={`${name} at a glance`}>
        <div className="glance-row"><span className="glance-k">Fellowship</span><span className="glance-v">{name} ({code})</span></div>
        <div className="glance-row"><span className="glance-k">Focus</span><span className="glance-v">{focus}</span></div>
        <div className="glance-row"><span className="glance-k">Program</span><span className="glance-v">{program}</span></div>
        <div className="glance-row"><span className="glance-k">On Fellow</span><span className="glance-v">{onFellow}</span></div>
        {finder ? (
          <div className="glance-row">
            <span className="glance-k">Official source</span>
            <span className="glance-v"><a href={finder.url} target="_blank" rel="noopener nofollow">{finderDomain} <Icon name="external" size={13} /></a></span>
          </div>
        ) : null}
        <div className="glance-row">
          <span className="glance-k">Listings</span>
          <span className="glance-v">Public intergroup feeds · <Link href="/about">how we source</Link></span>
        </div>
      </div>

      {hasMeetings && states.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{code} meetings by city</h2>
          {states.map((abbr) => {
            // Take the 8 biggest cities in the state, then show them alphabetically.
            const full = byState[abbr].sort((a, b) => b.count - a.count);
            const list = full.slice(0, HUB_CITIES_PER_STATE).sort((a, b) => a.city.localeCompare(b.city));
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
                  {full.length > list.length ? (
                    <Link href={`/state/${stateSlug(abbr)}`} className="city-chip city-chip-all">
                      +{full.length - list.length} more in {STATE_NAMES[abbr] || abbr} →
                    </Link>
                  ) : null}
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

      <SoberActivities fellowship={code} />
      <FellowshipBeyond code={code} />

      <hr style={{ border: 0, borderTop: "1px solid var(--panel-line)", margin: "28px 0 0" }} />
      <h2 style={{ fontSize: 20, marginTop: 20 }}>Common questions about {code}</h2>
      <div className="faq-accordion">
        {faqs.map((f, i) => (
          <details key={f.q} className="faq-item" open={i === 0}>
            <summary className="faq-q">
              <span>{f.q}</span>
              <Icon name="chevron" size={20} className="faq-caret" />
            </summary>
            <div className="faq-a">{f.a}</div>
          </details>
        ))}
      </div>

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with {name} or any fellowship.
        Meeting listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
