"use client";
import dynamic from "next/dynamic";

// Finder pulls in InstantSearch + MapLibre, so render it client-only.
const Finder = dynamic(() => import("@/components/Finder"), { ssr: false });

export default function Page() {
  return (
    <main className="app">
      <header className="brand">
        <div className="mark" aria-hidden>F</div>
        <div>
          <h1>Fellow</h1>
          <div className="tagline">Find your people</div>
        </div>
      </header>
      <Finder />
      <footer className="site-footer">
        <p>
          Fellow is an independent, non-commercial project — not affiliated with any 12-step
          fellowship. Meeting data comes from public intergroup feeds.
        </p>
        <p><a href="/about">About &amp; sources</a> · <a href="/about#privacy">Privacy &amp; anonymity</a></p>
      </footer>
    </main>
  );
}
