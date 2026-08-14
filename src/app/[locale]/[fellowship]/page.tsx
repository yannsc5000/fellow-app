import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { alts } from "@/lib/meta";
import { getFellowshipHub, getFellowshipAll, getSeededFellowships, fellowshipSlug, stateSlug, STATE_NAMES, HUB_CITIES_PER_STATE } from "@/lib/cities";
import { fellowshipName, fellowshipColor, fellowshipDesc, CODE_BY_SLUG, BY_CODE, FELLOWSHIPS } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { getSEO, getExtraFaqs } from "@/lib/fellowshipContent";
import { CONTACT_EMAIL } from "@/lib/config";
import { SoberActivities } from "@/components/SoberActivities";
import { FellowshipBeyond } from "@/components/FellowshipBeyond";
import { Icon } from "@/components/Icon";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

// Fellowship family → the message key for its "At a glance" focus phrase (localized).
const FOCUS_KEY: Record<string, string> = {
  "Alcohol & drugs": "focusAlcoholDrugs",
  "Food & eating": "focusFood",
  "Sex & relationships": "focusSex",
  "Money & work": "focusMoney",
  "Emotional & behavioral": "focusEmotional",
  "Family & friends": "focusFamily",
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const seeded = await getSeededFellowships();
  return seeded.map((code) => ({ fellowship: fellowshipSlug(code) }));
}

async function resolve(fellowship: string, locale?: string) {
  const code = CODE_BY_SLUG[fellowship];
  if (!code) return null;
  const fa = await getFellowshipAll(fellowship); // meeting counts + existence (null if none indexed)
  const finder = officialFinder(code, undefined, locale);
  return { code, fa, finder };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; fellowship: string }> }): Promise<Metadata> {
  const { locale, fellowship } = await params;
  const r = await resolve(fellowship, locale);
  if (!r) return {};
  const name = fellowshipName(r.code);
  const desc = fellowshipDesc(r.code, locale);
  // Prefer the tuned per-fellowship long-tail title/meta; fall back to a generated one.
  // The tuned SEO map is locale-aware (Spanish overrides render on /es); the generated
  // fallbacks below are still English pending the deep-content translation pass.
  const seo = getSEO(r.code, locale);
  const title = seo?.title || `${name} (${r.code}) Meetings — Online & Near You | Fellow`;
  const description = seo?.description || (r.fa
    ? `Find free, anonymous ${name} (${r.code}) meetings near you — ${fmt(r.fa.inPerson)} in person plus online. Browse by city, filter by day and time, and find secular and young people's groups on Fellow.`
    : (desc
        ? `${desc} Find ${r.code} meetings online and near you, plus the official ${r.code} directory — free and anonymous, on Fellow.`
        : `${name} (${r.code}) meetings online and near you — free and anonymous, on Fellow.`));
  return {
    title, description,
    alternates: alts(locale, `/${fellowship}`),
    openGraph: { title, description, url: `/${fellowship}`, type: "website" },
  };
}

export default async function FellowshipPage({ params }: { params: Promise<{ locale: string; fellowship: string }> }) {
  const { locale, fellowship } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fellowship");
  const r = await resolve(fellowship, locale);
  if (!r) notFound();
  const { code, fa, finder } = r;
  const name = fellowshipName(code);
  const group = BY_CODE[code]?.group;
  const desc = fellowshipDesc(code, locale);
  const hasMeetings = !!fa;
  const inPerson = fa?.inPerson || 0;
  const online = fa?.online || 0;

  const hub = await getFellowshipHub();
  const cities = hub[code] || [];
  // Browse pre-filtered to this fellowship (facet-precise). Only rendered when hasMeetings, so it
  // always lands on real results near the user.
  const liveSearch = `/?fellowship=${encodeURIComponent(code)}`;
  const submitHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Submit a ${code} group or meeting`)}&body=${encodeURIComponent(`I'd like to submit a ${name} (${code}) group or meeting to Fellow.\n\nMeeting name:\nDay & time:\nLocation or online link:\nWebsite or contact (optional):\n`)}`;

  // "At a glance" facts (entity clarity for humans + AI). Derived from real data — no fabricated dates.
  const focus = group && FOCUS_KEY[group] ? t(FOCUS_KEY[group]) : t("focusDefault");
  const program = code === "RD" ? t("programRD") : t("programTS");
  const onFellow = hasMeetings ? t("onFellowStats", { inPerson: fmt(inPerson), online: fmt(online) }) : t("onFellowNone");
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
  const extra = getExtraFaqs(code, locale);
  const faqs: { q: string; a: string }[] = [
    { q: t("faqFreeQ", { code }), a: t("faqFreeA", { code }) },
    {
      q: t("faqOnlineQ", { code }),
      a: hasMeetings && online
        ? t("faqOnlineAHas", { code, online: fmt(online) })
        : (finder ? t("faqOnlineAFinder", { code }) : t("faqOnlineANoFinder", { code })),
    },
    ...extra,
    { q: t("faqReligiousQ", { code }), a: t("faqReligiousA", { code }) },
  ];
  if (hasMeetings) {
    faqs.push({ q: t("faqSpecificQ", { code }), a: t("faqSpecificA", { code }) });
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
        <Link href="/" className="back">{t("back")}</Link> · <Link href="/fellowships" className="back">{t("allFellowships")}</Link>
      </p>
      <h1>
        <span className="fh-dot" style={{ background: fellowshipColor(code), display: "inline-block", width: 14, height: 14, borderRadius: "50%", marginRight: 10, verticalAlign: "middle" }} aria-hidden />
        {t("h1", { name, code })}
      </h1>

      {hasMeetings ? (
        <>
          {desc ? <p>{desc}</p> : null}
          <p>
            {t.rich(online ? "listsWithOnline" : "listsNoOnline", { inPerson: fmt(inPerson), online: fmt(online), name, code, b: (ch) => <strong>{ch}</strong> })}
            <Link href={liveSearch}>{t("searchMeetings", { code })}</Link>
          </p>
          <p style={{ margin: "12px 0 6px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Link href={`/${fellowship}/all`} className="city-chip city-chip-all">
              {t("seeAll", { code })}
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
          <p className="fell-apology">{t("apology", { name, code })}</p>
          <p style={{ margin: "12px 0 8px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <a href={submitHref} className="btn-secondary"><Icon name="add" size={16} /> {t("submit")}</a>
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
          <span>{t("safetyNote")}</span>
        </p>
      ) : null}

      <p className="glance-cap">{t("atAGlance")}</p>
      <div className="glance" aria-label={t("glanceAria", { name })}>
        <div className="glance-row"><span className="glance-k">{t("kFellowship")}</span><span className="glance-v">{name} ({code})</span></div>
        <div className="glance-row"><span className="glance-k">{t("kFocus")}</span><span className="glance-v">{focus}</span></div>
        <div className="glance-row"><span className="glance-k">{t("kProgram")}</span><span className="glance-v">{program}</span></div>
        <div className="glance-row"><span className="glance-k">{t("kOnFellow")}</span><span className="glance-v">{onFellow}</span></div>
        {finder ? (
          <div className="glance-row">
            <span className="glance-k">{t("kOfficialSource")}</span>
            <span className="glance-v"><a href={finder.url} target="_blank" rel="noopener nofollow">{finderDomain} <Icon name="external" size={13} /></a></span>
          </div>
        ) : null}
        <div className="glance-row">
          <span className="glance-k">{t("kListings")}</span>
          <span className="glance-v">{t("listingsSource")} · <Link href="/about">{t("howWeSource")}</Link></span>
        </div>
      </div>

      {hasMeetings && states.length > 0 ? (
        <>
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{t("byCity", { code })}</h2>
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
                      {t("moreIn", { n: full.length - list.length, state: STATE_NAMES[abbr] || abbr })}
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
          <h2 style={{ fontSize: 20, marginTop: 24 }}>{t("relatedFellowships")}</h2>
          <p style={{ margin: "0 0 8px", color: "var(--ink-soft)", fontSize: 14.5 }}>
            {t("otherInFamily")}
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
      <h2 style={{ fontSize: 20, marginTop: 20 }}>{t("commonQuestions", { code })}</h2>
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
        {t("footNote", { name })} <Link href="/about">{t("aboutSources")}</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
