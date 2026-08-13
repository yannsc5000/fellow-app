"use client";

import { useEffect, useState } from "react";

// Studio-only control to exclude your own browser from Vercel Web Analytics. It reads/writes
// the "va-disable" localStorage flag that VercelAnalytics checks in its beforeSend hook, so you
// can flip it per device without opening the dev console. Per-browser; clears if you wipe site data.
export function AnalyticsToggle() {
  const [excluded, setExcluded] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setExcluded(localStorage.getItem("va-disable") === "1");
    } catch {
      setExcluded(false);
    }
  }, []);

  if (excluded === null) return null; // avoid an SSR/hydration flash before we know the state

  const toggle = () => {
    try {
      if (excluded) localStorage.removeItem("va-disable");
      else localStorage.setItem("va-disable", "1");
      setExcluded(!excluded);
    } catch {
      /* localStorage unavailable (private mode) — nothing to do */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={"st-fresh-badge " + (excluded ? "sv-good" : "sv-warning")}
      style={{ cursor: "pointer", border: 0, font: "inherit" }}
      title={
        excluded
          ? "This browser is NOT counted in Vercel Analytics. Click to start counting your visits again."
          : "This browser IS counted in Vercel Analytics. Click to exclude your visits."
      }
    >
      {excluded ? "Analytics: excluding me ✓" : "Analytics: counting me — click to exclude"}
    </button>
  );
}
