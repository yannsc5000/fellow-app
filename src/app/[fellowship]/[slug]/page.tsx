import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFellowshipCityParams, getFellowshipCity, CITY_MAX_PER_DAY } from "@/lib/cities";
import { Icon } from "@/components/Icon";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getFellowshipCityParams();
}

export async function generateMetadata({ params }: { params: Promise<{ fellowship: string; slug: string }> }): Promise<Metadata> {
  const { fellowship, slug } = await params;
  const fc = await getFellowshipCity(fellowship, slug);
  if (!fc) return {};
  const title = `${fc.code} Meetings in ${fc.city}, ${fc.state} — ${fc.name} | Fellow`;
  const description = `${fc.count} ${fc.name} (${fc.code}) meetings in ${fc.city}, ${fc.state}. Days, times and locations — find a meeting near you, free on Fellow.`;
  return {
    title,
    description,
    alternates: { canonical: `/${fc.fslug}/${fc.citySlug}` },
    openGraph: { title, description, url: `/${fc.fslug}/${fc.citySlug}`, type: "website" },
  };
}

export default async function FellowshipCityPage({ params }: { params: Promise<{ fellowship: string; slug: string }> }) {
  const { fellowship, slug } = await params;
  const fc = await getFellowshipCity(fellowship, slug);
  if (!fc) notFound();

  const byDay: Record<number, typeof fc.meetings> = {};
  for (const m of fc.meetings) (byDay[m.day] ||= []).push(m);
  let shown = 0;
  for (let d = 0; d < 7; d++) if (byDay[d]) shown += Math.min(byDay[d].length, CITY_MAX_PER_DAY);
  const liveSearch = `/?q=${encodeURIComponent(`${fc.code} in ${fc.city}`)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${fc.name} meetings in ${fc.city}, ${fc.stateName}`,
        url: `https://fellow.space/${fc.fslug}/${fc.citySlug}`,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
          { "@type": "ListItem", position: 3, name: `${fc.city}, ${fc.state}`, item: `https://fellow.space/meetings/${fc.citySlug}` },
          { "@type": "ListItem", position: 4, name: `${fc.code} in ${fc.city}`, item: `https://fellow.space/${fc.fslug}/${fc.citySlug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">← Fellow home</Link> ·{" "}
        <Link href={`/meetings/${fc.citySlug}`} className="back">All meetings in {fc.city}</Link>
      </p>
      <h1>{fc.name} ({fc.code}) meetings in {fc.city}, {fc.stateName}</h1>
      <p>
        Fellow lists <strong>{fc.count.toLocaleString()}</strong> {fc.name} ({fc.code}) meetings in {fc.city}.
        Details change often — please confirm with the group before you go. For online {fc.code} meetings and
        live day/time filters, <Link href={liveSearch}>search {fc.code} in {fc.city} →</Link>
      </p>

      {DAYS.map((dayName, d) => {
        const all = byDay[d];
        if (!all || !all.length) return null;
        const rows = all.slice(0, CITY_MAX_PER_DAY);
        return (
          <section key={d} style={{ margin: "18px 0" }}>
            <h2 style={{ fontSize: 20 }}>{dayName} — {all.length} meeting{all.length === 1 ? "" : "s"}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rows.map((m) => (
                <li key={m.id}>
                  <a className="mtg-row" href={`/?q=${encodeURIComponent(`${m.name} in ${fc.city}`)}`}>
                    <span className="mtg-body">
                      <strong>{to12(m.time)}</strong> — {m.name}
                      {m.place || m.address ? <span className="mtg-meta"> · {m.place || m.address}</span> : null}
                    </span>
                    <Icon name="chevron" size={20} className="mtg-chev" />
                  </a>
                </li>
              ))}
            </ul>
            {all.length > rows.length && (
              <p style={{ margin: "8px 0 0", color: "var(--ink-soft)", fontSize: 14 }}>
                +{all.length - rows.length} more on {dayName} — <Link href={liveSearch}>see all live →</Link>
              </p>
            )}
          </section>
        );
      })}

      {fc.count > shown && (
        <p style={{ marginTop: 16 }}>
          Showing {shown} of {fc.count.toLocaleString()} {fc.code} meetings in {fc.city}.{" "}
          <Link href={liveSearch}>See them all with live filters →</Link>
        </p>
      )}

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent meeting finder — not affiliated with {fc.name} or any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href={`/meetings/${fc.citySlug}`} className="back">← All meetings in {fc.city}</Link></p>
    </main>
  );
}
