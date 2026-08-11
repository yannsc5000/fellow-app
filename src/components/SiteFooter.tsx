import Link from "next/link";

// Shared site footer — used on every page so the primary links (including the coverage map)
// and the disclaimer are consistent everywhere. Links lead; the Fellow blurb + copyright sit
// at the very bottom. Contextual "back" links stay on their own pages.
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p className="foot-links">
        <Link href="/">Find a meeting</Link> · <Link href="/support-groups">Support groups</Link> ·{" "}
        <Link href="/meetings">Meetings by city</Link> · <Link href="/fellowships">Fellowships</Link> ·{" "}
        <Link href="/coverage">Coverage map</Link> · <Link href="/about">About &amp; sources</Link> ·{" "}
        <Link href="/about#privacy">Privacy &amp; anonymity</Link>
      </p>
      <p className="foot-blurb">
        © {year} Fellow — an independent, non-commercial project, not affiliated with any 12-step
        fellowship. Meeting data comes from public intergroup feeds.
      </p>
    </footer>
  );
}
