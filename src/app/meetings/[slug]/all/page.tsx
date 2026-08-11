import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCities, getCity, fellowshipLabel, CITY_MAX_PER_DAY } from "@/lib/cities";
import { fellowshipColor } from "@/lib/fellowships";
import { MeetingDayList, type DayRow } from "@/components/MeetingDayList";
import { SiteFooter } from "@/components/SiteFooter";

// The full listing for a city — every meeting Fellow lists there, organized and labelled by
// day of the week, chronologically within each day. The city page links here after its short
// preview.
export const dynamicParams = false;

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCity(slug);
  if (!c) return {};
  const title = `All recovery meetings in ${c.city}, ${c.state} — by day | Fellow`;
  const description = `Every one of Fellow's ${c.count.toLocaleString()} in-person recovery meetings in ${c.city}, ${c.stateName}, organized by day of the week.`;
  return {
    title, description,
    alternates: { canonical: `/meetings/${c.slug}/all` },
    openGraph: { title, description, url: `/meetings/${c.slug}/all`, type: "website" },
  };
}

export default async function CityAllPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCity(slug);
  if (!c) notFound();

  const rows: DayRow[] = c.meetings.map((m) => ({
    id: m.id, name: m.name, day: m.day, time: m.time, dot: fellowshipColor(m.fellowship),
    href: `/?q=${encodeURIComponent(`${m.name} in ${c.city}`)}`,
    meta: [fellowshipLabel(m.fellowship), m.place || m.address].filter(Boolean).join(" · "),
  }));
  const liveSearch = `/?q=${encodeURIComponent(c.city)}`;

  return (
    <main className="app prose" id="main-content">
      <p style={{ margin: "20px 0 8px" }}>
        <Link href={`/meetings/${c.slug}`} className="back">← {c.city} meetings</Link> ·{" "}
        <Link href="/meetings" className="back">All cities</Link>
      </p>
      <h1>All recovery meetings in {c.city}, {c.stateName}</h1>
      <p>
        Every meeting Fellow lists in {c.city}, organized by day — <strong>{c.count.toLocaleString()}</strong> in all.
        Details change often, so please confirm with the group before you go. For online meetings, live day/time
        filters, maps and directions, <Link href={liveSearch}>search {c.city} on Fellow →</Link>
      </p>

      <MeetingDayList rows={rows} maxPerDay={CITY_MAX_PER_DAY} liveHref={liveSearch} liveLabel={`see all in ${c.city} →`} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent, non-commercial meeting finder — not affiliated with any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <SiteFooter />
    </main>
  );
}
