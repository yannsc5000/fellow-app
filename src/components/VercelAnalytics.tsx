"use client";

// Thin client wrapper around Vercel Web Analytics so we can pass a `beforeSend` filter.
// (layout.tsx is a Server Component, and function props can't cross the server→client
// boundary — hence this "use client" shim.)
//
// It drops two kinds of events before they're sent:
//   1. Your own visits — set localStorage "va-disable" = "1" once per browser to stop
//      counting yourself (undo with localStorage.removeItem("va-disable")).
//   2. Internal /studio dashboard views — never real traffic.
import { Analytics } from "@vercel/analytics/next";

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        if (typeof window !== "undefined" && localStorage.getItem("va-disable") === "1") {
          return null;
        }
        if (event.url.includes("/studio")) return null;
        return event;
      }}
    />
  );
}
