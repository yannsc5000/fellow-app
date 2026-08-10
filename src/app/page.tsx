"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

// Finder pulls in InstantSearch + MapLibre; Chat calls the /api/chat route — client-only.
const Finder = dynamic(() => import("@/components/Finder"), { ssr: false });
const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

// Biggest metros by meeting count — visible entry points to the /meetings/[city] pages.
// (Curated from the data; every slug has a live page. Full list lives at /meetings.)
const POPULAR_CITIES = [
  { name: "New York, NY", slug: "new-york-ny" }, { name: "Las Vegas, NV", slug: "las-vegas-nv" },
  { name: "Phoenix, AZ", slug: "phoenix-az" }, { name: "Philadelphia, PA", slug: "philadelphia-pa" },
  { name: "San Antonio, TX", slug: "san-antonio-tx" }, { name: "San Diego, CA", slug: "san-diego-ca" },
  { name: "Seattle, WA", slug: "seattle-wa" }, { name: "Denver, CO", slug: "denver-co" },
  { name: "Atlanta, GA", slug: "atlanta-ga" }, { name: "Washington, DC", slug: "washington-dc" },
  { name: "Minneapolis, MN", slug: "minneapolis-mn" }, { name: "Nashville, TN", slug: "nashville-tn" },
  { name: "Indianapolis, IN", slug: "indianapolis-in" }, { name: "Cincinnati, OH", slug: "cincinnati-oh" },
  { name: "Columbus, OH", slug: "columbus-oh" }, { name: "Oklahoma City, OK", slug: "oklahoma-city-ok" },
  { name: "Jacksonville, FL", slug: "jacksonville-fl" }, { name: "Louisville, KY", slug: "louisville-ky" },
  { name: "Tucson, AZ", slug: "tucson-az" }, { name: "Raleigh, NC", slug: "raleigh-nc" },
];

export default function Page() {
  // Land on Search (not the chat default) when arriving with a ?q= query — powers shareable
  // search links and Google's sitelinks search box.
  const [mode, setMode] = useState<"search" | "chat">(
    () => (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("q") ? "search" : "chat"),
  );
  const [resetKey, setResetKey] = useState(0);
  // Clicking the logo resets to the default home screen (default tab + fresh state).
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setMode("chat");
    setResetKey((k) => k + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  return (
    <main className="app" id="main-content" tabIndex={-1}>
      <header className="brand">
        <a href="/" className="brand-link" onClick={goHome} aria-label="Fellow — back to home">
          <div className="mark" aria-hidden><Mark size={50} /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">Find your people</div>
          </div>
        </a>
      </header>

      <div className="experience">
        <div className="exp-tabs" role="tablist" aria-label="Find meetings by">
          <button role="tab" aria-selected={mode === "chat"} className="exp-tab" onClick={() => setMode("chat")}>
            <Icon name="chat" size={18} /> Ask Fellow
          </button>
          <button role="tab" aria-selected={mode === "search"} className="exp-tab" onClick={() => setMode("search")}>
            <Icon name="search" size={18} /> Search
          </button>
        </div>
        <div className={`exp-body ${mode === "search" ? "is-search" : "is-chat"}`}>
          {mode === "search" ? <Finder key={resetKey} /> : <Chat key={resetKey} onSwitchToSearch={() => setMode("search")} />}
        </div>
      </div>

      <section className="city-browse" aria-labelledby="city-browse-h">
        <h2 id="city-browse-h">Browse meetings by city</h2>
        <div className="city-chips">
          {POPULAR_CITIES.map((c) => (
            <a key={c.slug} href={`/meetings/${c.slug}`} className="city-chip">{c.name}</a>
          ))}
          <a href="/meetings" className="city-chip city-chip-all">All cities →</a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
