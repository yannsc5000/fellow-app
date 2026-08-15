"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";

// Chat calls the /api/chat route — client-only. The Browse tool now lives on its own /search route
// (a real, deep-linkable page with an SSR header), so the homepage no longer mounts the Finder
// inline; the "Browse" tab navigates there instead.
const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

// The brand header + the Ask Fellow / Browse shell — the interactive island of the home page. Kept
// as its own client component so the page itself can be a server component (and fetch coverage data
// for the promo below).
export default function HomeExperience() {
  const t = useTranslations("common");
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  // Inbound deep-links that used to open Browse inline now belong to the /search route: send
  // ?q= / ?fellowship= / ?browse= straight there (this also serves as the legacy redirect). ?q= is a
  // shared search link or the sitelinks box; ?fellowship= is a fellowship/problem "search" CTA;
  // ?browse= just opens the tool near-you.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const fellowship = sp.get("fellowship");
    if (q || fellowship || sp.has("browse")) {
      const dest = new URLSearchParams();
      if (q) dest.set("q", q);
      if (fellowship) dest.set("fellowship", fellowship);
      const qs = dest.toString();
      router.replace(`/search${qs ? `?${qs}` : ""}`);
    }
  }, [router]);
  const goSearch = () => router.push("/search");
  // Clicking the logo resets to a fresh chat.
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
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
        {/* Ask Fellow is the home panel; Browse is a link out to the /search tool. */}
        <div
          className="exp-tabs"
          role="tablist"
          aria-label="Find meetings by"
          onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); goSearch(); } }}
        >
          <button
            role="tab" id="tab-chat" aria-controls="exp-panel" aria-selected={true}
            tabIndex={0} className="exp-tab" onClick={goHome}
          >
            <Icon name="chatdots" size={22} /> {t("askFellow")}
          </button>
          <button
            role="tab" id="tab-search" aria-selected={false}
            tabIndex={-1} className="exp-tab" onClick={goSearch}
          >
            <Icon name="searchtab" size={22} /> {t("find")}
          </button>
        </div>
        <div
          id="exp-panel" role="tabpanel" tabIndex={0}
          aria-labelledby="tab-chat" className="exp-body is-chat"
        >
          <Chat key={resetKey} onSwitchToSearch={goSearch} />
        </div>
      </div>
    </>
  );
}
