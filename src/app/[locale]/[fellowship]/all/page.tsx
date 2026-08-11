import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFellowshipAll, getFellowshipAllParams, FELLOWSHIP_ALL_MAX_PER_DAY } from "@/lib/cities";
import { fellowshipColor } from "@/lib/fellowships";
import { MeetingDayList, type DayRow } from "@/components/MeetingDayList";
import { SiteFooter } from "@/components/SiteFooter";

const fmt = (n: number) => n.toLocaleString("en-US");

// The full listing for a fellowship — all of its meetings, in-person AND online, organized and
// labelled by day. Small fellowships (e.g. ACA) show in full; huge ones (AA/NA) are capped per
// day with a live-search fallback. Linked from the fellowship hub page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return getFellowshipAllParams();
}

export async function generateMetadata({ params }: { params: Promise<{ fellowship: string }> }): Promise<Metadata> {
  const { fellowship } = await params;
  const fa = await getFellowshipAll(fellowship);
  if (!fa) return {};
  const title = `All ${fa.name} (${fa.code}) meetings — in-person & online, by day | Fellow`;
  const description = `Every ${fa.name} (${fa.code}) meeting on Fellow: ${fmt(fa.inPerson)} in-person and ${fmt(fa.online)} online, organized by day of the week.`;
  return {
    title, description,
    alternates: { canonical: `/${fellowship}/all` },
    openGraph: { title, description, url: `/${fellowship}/all`, type: "website" },
  };
}

export default async function FellowshipAllPage({ params }: { params: Promise<{ locale: string; fellowship: string }> }) {
  const { locale, fellowship } = await params;
  setRequestLocale(locale);
  const fa = await getFellowshipAll(fellowship);
  if (!fa) notFound();
  const t = await getTranslations("fellowshipAll");

  const dot = fellowshipColor(fa.code);
  const rows: DayRow[] = fa.meetings.map((m) => ({
    id: m.id, name: m.name, day: m.day, time: m.time, online: m.online, dot,
    href: `/?q=${encodeURIComponent(m.name)}`,
    meta: m.online ? (m.loc || t("onlineMeeting")) : m.loc,
  }));
  const liveSearch = `/?q=${encodeURIComponent(fa.name)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `All ${fa.name} (${fa.code}) meetings`,
        url: `https://fellow.space/${fellowship}/all`,
        description: `Every ${fa.name} (${fa.code}) meeting on Fellow — ${fmt(fa.inPerson)} in-person and ${fmt(fa.online)} online, by day.`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Fellowships", item: "https://fellow.space/fellowships" },
          { "@type": "ListItem", position: 3, name: fa.code, item: `https://fellow.space/${fellowship}` },
          { "@type": "ListItem", position: 4, name: "All meetings", item: `https://fellow.space/${fellowship}/all` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href={`/${fellowship}`} className="back">{t("backOverview", { code: fa.code })}</Link> ·{" "}
        <Link href="/fellowships" className="back">{t("allFellowships")}</Link>
      </p>
      <h1>
        <span className="fh-dot" style={{ background: fellowshipColor(fa.code), display: "inline-block", width: 14, height: 14, borderRadius: "50%", marginRight: 10, verticalAlign: "middle" }} aria-hidden />
        {t("h1", { name: fa.name, code: fa.code })}
      </h1>
      <p>
        {fa.online
          ? t.rich("leadWithOnline", { code: fa.code, inPerson: fmt(fa.inPerson), online: fmt(fa.online), b: (ch) => <strong>{ch}</strong> })
          : t.rich("leadNoOnline", { code: fa.code, inPerson: fmt(fa.inPerson), b: (ch) => <strong>{ch}</strong> })}
        <Link href={liveSearch}>{t("searchOnFellow", { code: fa.code })}</Link>
      </p>

      <MeetingDayList rows={rows} maxPerDay={FELLOWSHIP_ALL_MAX_PER_DAY} liveHref={liveSearch} liveLabel={t("liveLabel", { code: fa.code })} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        {t("independentNote", { name: fa.name })}<Link href="/about">{t("aboutSources")}</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
