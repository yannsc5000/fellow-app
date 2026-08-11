"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";

// Finder pulls in InstantSearch + MapLibre; Chat calls the /api/chat route — client-only.
const Finder = dynamic(() => import("@/components/Finder"), { ssr: false });
const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

// The brand header + the Ask Fellow / Search tab shell — the interactive island of the home
// page. Kept as its own client component so the page itself can be a server component (and
// fetch coverage data for the promo below).
export default function HomeExperience() {
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
    <>
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
            <Icon name="chatdots" size={22} /> Ask Fellow
          </button>
          <button role="tab" aria-selected={mode === "search"} className="exp-tab" onClick={() => setMode("search")}>
            <Icon name="searchtab" size={22} /> Search
          </button>
        </div>
        <div className={`exp-body ${mode === "search" ? "is-search" : "is-chat"}`}>
          {mode === "search" ? <Finder key={resetKey} /> : <Chat key={resetKey} onSwitchToSearch={() => setMode("search")} />}
        </div>
      </div>
    </>
  );
}
