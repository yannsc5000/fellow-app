import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCities, getCity, fellowshipLabel, cityFellowshipLinks, CITY_PREVIEW } from "@/lib/cities";
import { fellowshipColor } from "@/lib/fellowships";
import { Icon } from "@/components/Icon";
import { SoberActivities } from "@/components/SoberActivities";
import { SiteFooter } from "@/components/SiteFooter";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  const ap = (h || 0) < 12 ? "AM" : "PM";
  const hh = (h || 0) % 12 || 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

// Only pre-built city slugs are valid; anything else 404s.
export const dynamicParams = false;

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCity(slug);
  if (!c) return {};
  const fell = c.fellowships.map(fellowshipLabel).slice(0, 3).join(", ");
  const title = `Recovery Meetings in ${c.city}, ${c.state} — AA, NA & more | Fellow`;
  const description = `${c.count} recovery meetings in ${c.city}, ${c.state}: ${fell}${c.fellowships.length > 3 ? " and more" : ""}. Find AA, NA and other 12-step and peer-support meetings near you, free on Fellow.`;
  return {
    title,
    description,
    alternates: { canonical: `/meetings/${c.slug}` },
    openGraph: { title, description, url: `/meetings/${c.slug}`, type: "website" },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCity(slug);
  if (!c) notFound();

  // Short preview on the city page itself (meetings are pre-sorted by day then time); the full
  // day-by-day listing lives on /meetings/[slug]/all.
  const preview = c.meetings.slice(0, CITY_PREVIEW);
  const fellNames = c.fellowships.map(fellowshipLabel);
  const fellowshipLinks = cityFellowshipLinks(c);
  const liveSearch = `/?q=${encodeURIComponent(c.city)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Recovery meetings in ${c.city}, ${c.stateName}`,
        url: `https://fellow.space/meetings/${c.slug}`,
        about: fellNames,
        isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fellow.space" },
          { "@type": "ListItem", position: 2, name: "Meetings by city", item: "https://fellow.space/meetings" },
          { "@type": "ListItem", position: 3, name: `${c.city}, ${c.state}`, item: `https://fellow.space/meetings/${c.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="app prose" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <p style={{ margin: "20px 0 8px" }}>
        <Link href="/" className="back">← Fellow home</Link> · <Link href="/meetings" className="back">All cities</Link>
      </p>
      <h1>Recovery meetings in {c.city}, {c.stateName}</h1>
      <p>
        Fellow lists <strong>{c.count.toLocaleString()}</strong> in-person recovery meetings in {c.city} —{" "}
        {fellNames.join(", ")}. Meeting details change often, so please confirm with the group before you go.
        For online meetings, live day/time filters, maps and directions,{" "}
        <Link href={liveSearch}>search {c.city} on Fellow →</Link>
      </p>

      {fellowshipLinks.length > 1 && (
        <p style={{ margin: "4px 0 8px" }}>
          <strong>By fellowship:</strong>{" "}
          {fellowshipLinks.map((f, i) => (
            <span key={f.fslug}>
              {i > 0 ? " · " : ""}
              <Link href={`/${f.fslug}/${c.slug}`}>{f.code} in {c.city}</Link>
            </span>
          ))}
        </p>
      )}

      <h2 style={{ fontSize: 20, marginTop: 22 }}>A few of this week’s meetings</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {preview.map((m) => (
          <li key={m.id}>
            <a className="mtg-row" href={`/?q=${encodeURIComponent(`${m.name} in ${c.city}`)}`}>
              <span className="mtg-dot" style={{ background: fellowshipColor(m.fellowship) }} aria-hidden />
              <span className="mtg-body">
                <strong>{DAY_ABBR[m.day]} · {to12(m.time)}</strong> — {m.name}
                <span className="mtg-meta">
                  {" "}· {fellowshipLabel(m.fellowship)}{m.place ? ` · ${m.place}` : ""}
                </span>
              </span>
              <Icon name="chevron" size={20} className="mtg-chev" />
            </a>
          </li>
        ))}
      </ul>
      <p style={{ margin: "14px 0 0" }}>
        <Link href={`/meetings/${c.slug}/all`} className="city-chip city-chip-all">
          View all {c.count.toLocaleString()} meetings in {c.city}, by day →
        </Link>
      </p>

      <SoberActivities city={c.city} state={c.state} />

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent, non-commercial meeting finder — not affiliated with any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href="/" className="back">← Back to Fellow</Link></p>
      <SiteFooter />
    </main>
  );
}
