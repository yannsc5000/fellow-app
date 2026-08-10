import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCities, getCity, fellowshipLabel, cityFellowshipLinks, CITY_MAX_PER_DAY } from "@/lib/cities";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

  // Group ALL meetings by day, then cap per day so every day of the week shows.
  const byDay: Record<number, typeof c.meetings> = {};
  for (const m of c.meetings) (byDay[m.day] ||= []).push(m);
  let shown = 0;
  for (let d = 0; d < 7; d++) if (byDay[d]) shown += Math.min(byDay[d].length, CITY_MAX_PER_DAY);
  const fellNames = c.fellowships.map(fellowshipLabel);
  const fellowshipLinks = cityFellowshipLinks(c);
  const liveSearch = `/?q=${encodeURIComponent(c.city)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Recovery meetings in ${c.city}, ${c.stateName}`,
    url: `https://fellow.space/meetings/${c.slug}`,
    about: fellNames,
    isPartOf: { "@type": "WebSite", name: "Fellow", url: "https://fellow.space" },
  };

  return (
    <main className="app prose">
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

      {DAYS.map((dayName, d) => {
        const all = byDay[d];
        if (!all || !all.length) return null;
        const rows = all.slice(0, CITY_MAX_PER_DAY);
        return (
          <section key={d} style={{ margin: "18px 0" }}>
            <h2 style={{ fontSize: 20 }}>{dayName} — {all.length} meeting{all.length === 1 ? "" : "s"}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rows.map((m) => (
                <li key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <strong>{to12(m.time)}</strong> — {m.name}{" "}
                  <span style={{ color: "var(--ink-soft)" }}>
                    · {fellowshipLabel(m.fellowship)}{m.place || m.address ? ` · ${m.place || m.address}` : ""}
                  </span>
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

      {c.count > shown && (
        <p style={{ marginTop: 16 }}>
          Showing {shown} of {c.count.toLocaleString()} meetings in {c.city}.{" "}
          <Link href={liveSearch}>See them all with live day, time and online filters →</Link>
        </p>
      )}

      <p style={{ margin: "28px 0", color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is a free, independent, non-commercial meeting finder — not affiliated with any fellowship.
        Listings come from public intergroup feeds. <Link href="/about">About &amp; sources</Link>
      </p>
      <p style={{ margin: "20px 0" }}><Link href="/" className="back">← Back to Fellow</Link></p>
    </main>
  );
}
