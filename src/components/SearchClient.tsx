"use client";
import dynamic from "next/dynamic";
import { Loader } from "@/components/Loader";

// Client boundary for the `/search` route. Finder pulls in InstantSearch + MapLibre, so it stays
// client-only (`ssr: false`) — same as on the homepage. It self-seeds every filter from the URL
// (path + query) via parseSearchState, so no props are threaded here; the server page above renders
// the crawlable SSR header, this renders the live tool.
const Finder = dynamic(() => import("@/components/Finder"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "grid", placeItems: "center", minHeight: 260 }} aria-busy>
      <Loader size={44} label="Loading search" />
    </div>
  ),
});

export function SearchClient() {
  return <Finder />;
}
