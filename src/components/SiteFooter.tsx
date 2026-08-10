import Link from "next/link";

// Shared site footer — used on every page so the disclaimer and primary links (including the
// coverage map) are consistent everywhere. Contextual "back" links stay on their own pages.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Fellow is an independent, non-commercial project — not affiliated with any 12-step
        fellowship. Meeting data comes from public intergroup feeds.
      </p>
      <p>
        <Link href="/">Find a meeting</Link> · <Link href="/meetings">Meetings by city</Link> ·{" "}
        <Link href="/fellowships">Fellowships</Link> · <Link href="/coverage">Coverage map</Link> ·{" "}
        <Link href="/about">About &amp; sources</Link> · <Link href="/about#privacy">Privacy &amp; anonymity</Link>
      </p>
    </footer>
  );
}
