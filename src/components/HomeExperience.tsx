"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("common");
  // Default to chat deterministically (same on server + client — no hydration mismatch); the
  // effect below flips to Search when there's a ?q=.
  const [mode, setMode] = useState<"search" | "chat">("chat");
  const [resetKey, setResetKey] = useState(0);
  // The page is server-rendered, so the initializer above can't see the URL — land on Search
  // whenever there's a ?q= (a shared search link or the sitelinks box) once we're on the client.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("q")) {
      setMode("search");
    }
  }, []);
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
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">{t("tagline")}</div>
          </div>
        </a>
      </header>

      <div className="experience">
        {/* Arrow keys move between tabs (ARIA tablist contract); each tab controls the shared panel. */}
        <div
          className="exp-tabs"
          role="tablist"
          aria-label="Find meetings by"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setMode((m) => (m === "chat" ? "search" : "chat"));
            }
          }}
        >
          <button
            role="tab" id="tab-chat" aria-controls="exp-panel" aria-selected={mode === "chat"}
            tabIndex={mode === "chat" ? 0 : -1} className="exp-tab" onClick={() => setMode("chat")}
          >
            <Icon name="chatdots" size={22} /> {t("askFellow")}
          </button>
          <button
            role="tab" id="tab-search" aria-controls="exp-panel" aria-selected={mode === "search"}
            tabIndex={mode === "search" ? 0 : -1} className="exp-tab" onClick={() => setMode("search")}
          >
            <Icon name="searchtab" size={22} /> {t("find")}
          </button>
        </div>
        <div
          id="exp-panel" role="tabpanel" tabIndex={0}
          aria-labelledby={mode === "search" ? "tab-search" : "tab-chat"}
          className={`exp-body ${mode === "search" ? "is-search" : "is-chat"}`}
        >
          {mode === "search" ? <Finder key={resetKey} /> : <Chat key={resetKey} onSwitchToSearch={() => setMode("search")} />}
        </div>
      </div>
    </>
  );
}
