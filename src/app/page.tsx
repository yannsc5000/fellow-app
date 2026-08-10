"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/Icon";

// Finder pulls in InstantSearch + MapLibre; Chat calls the /api/chat route — client-only.
const Finder = dynamic(() => import("@/components/Finder"), { ssr: false });
const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

export default function Page() {
  const [mode, setMode] = useState<"search" | "chat">("chat");
  const [resetKey, setResetKey] = useState(0);
  // Clicking the logo resets to the default home screen (default tab + fresh state).
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setMode("chat");
    setResetKey((k) => k + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  return (
    <main className="app">
      <header className="brand">
        <a href="/" className="brand-link" onClick={goHome} aria-label="Fellow — back to home">
          <div className="mark" aria-hidden>F</div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">Find your people</div>
          </div>
        </a>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Find meetings by">
        <button role="tab" aria-selected={mode === "chat"} className="mode-tab" onClick={() => setMode("chat")}>
          <Icon name="chat" size={18} /> Ask Fellow
        </button>
        <button role="tab" aria-selected={mode === "search"} className="mode-tab" onClick={() => setMode("search")}>
          <Icon name="search" size={18} /> Search
        </button>
      </div>

      {mode === "search" ? <Finder key={resetKey} /> : <Chat key={resetKey} />}

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
