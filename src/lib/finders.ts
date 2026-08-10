// Official, fellowship-run meeting-finder pages. When Fellow's own index returns no
// results, the chatbot deep-links here — a curated, verified allowlist of each
// program's AUTHORITATIVE finder — rather than a generic web search. No sponsored
// links, always the real source. URLs verified live 2026-08-10.
//
// Some finders accept the user's coordinates in the URL, so we can drop the user
// straight onto pre-filled, live results (the closest we can get to "the app browses
// for you" for sources that publish no open data feed). Those define `build(loc)`.
export type OfficialFinder = { label: string; url: string };
export type FinderLoc = { lat?: number | null; lng?: number | null; label?: string } | null;

type FinderDef = { label: string; url: string; build?: (loc: FinderLoc) => string };

const hasCoords = (loc: FinderLoc): loc is { lat: number; lng: number; label?: string } =>
  !!loc && typeof loc.lat === "number" && typeof loc.lng === "number";

const DEFS: Record<string, FinderDef> = {
  AA: { label: "Find AA (aa.org)", url: "https://www.aa.org/find-aa" },
  NA: { label: "Find NA (na.org)", url: "https://www.na.org/meetingsearch/" },
  ACA: { label: "ACA meeting search (adultchildren.org)", url: "https://adultchildren.org/meeting-search/" },
  "Al-Anon": { label: "Find an Al-Anon meeting (al-anon.org)", url: "https://al-anon.org/al-anon-meetings/find-an-al-anon-meeting/" },
  Alateen: { label: "Find an Alateen meeting (al-anon.org)", url: "https://al-anon.org/al-anon-meetings/find-an-alateen-meeting/" },
  "Nar-Anon": { label: "Find a Nar-Anon meeting (nar-anon.org)", url: "https://nar-anon.org/find-a-meeting/" },
  OA: { label: "Find an OA meeting (oa.org)", url: "https://oa.org/find-a-meeting/" },
  GA: { label: "Find a GA meeting (gamblersanonymous.org)", url: "https://gamblersanonymous.org/find-a-meeting/" },
  MA: { label: "Find an MA meeting (marijuana-anonymous.org)", url: "https://marijuana-anonymous.org/find-a-meeting/" },
  CMA: { label: "Find a CMA meeting (crystalmeth.org)", url: "https://www.crystalmeth.org/meetings/" },
  CoDA: { label: "Find a CoDA meeting (coda.org)", url: "https://coda.org/find-a-meeting/" },
  SAA: { label: "SAA meeting finder (saa-meetings.org)", url: "https://www.saa-meetings.org/" },
  SLAA: { label: "S.L.A.A. meeting finder (slaafws.org)", url: "https://slaafws.org/meetings/" },
  SA: { label: "Find an SA meeting (sa.org)", url: "https://www.sa.org/meetings/" },
  DA: { label: "Find a DA meeting (debtorsanonymous.org)", url: "https://debtorsanonymous.org/meeting-search-f2f/" },
  UA: { label: "Find a UA meeting (underearnersanonymous.org)", url: "https://www.underearnersanonymous.org/meetings/" },
  EDA: { label: "Find an EDA meeting (eatingdisordersanonymous.org)", url: "https://eatingdisordersanonymous.org/meetings/" },
  NicA: { label: "Find a Nicotine Anonymous meeting (nicotine-anonymous.org)", url: "https://nicotine-anonymous.org/find-a-meeting/" },
  RD: { label: "Recovery Dharma meetings (recoverydharma.org)", url: "https://recoverydharma.org/meetings/" },
  // SMART Recovery (secular/CBT-based, not 12-step). Fellow indexes no SMART meetings —
  // their data lives on a closed platform — but their finder accepts coordinates in the
  // URL, so with the user's location we deep-link straight to pre-filled live results.
  SMART: {
    label: "SMART Recovery meeting finder (smartrecovery.org)",
    url: "https://meetings.smartrecovery.org/meetings/",
    build: (loc) => hasCoords(loc)
      ? `https://meetings.smartrecovery.org/meetings/?coordinates=50&location=${encodeURIComponent(`coords:${loc.lat},${loc.lng}|${loc.label || "Near you"}`)}`
      : "https://meetings.smartrecovery.org/meetings/",
  },
};

export const officialFinder = (code?: string, loc?: FinderLoc): OfficialFinder | null => {
  const d = code ? DEFS[code] : null;
  if (!d) return null;
  return { label: d.label, url: d.build ? d.build(loc || null) : d.url };
};
