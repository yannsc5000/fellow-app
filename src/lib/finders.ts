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
  // Added from the SEO deliverable's official/reference sources — SPOT-CHECK these URLs live
  // before relying on them (the block above was verified 2026-08-10; these have not been).
  CA: { label: "Find a CA meeting (ca.org)", url: "https://ca.org/meetings/" },
  HA: { label: "Find an HA meeting (heroinanonymous.org)", url: "https://heroinanonymous.org/meetings/" },
  PA: { label: "Find a PA meeting (pillsanonymous.org)", url: "https://www.pillsanonymous.org/find-a-meeting" },
  FAIR: { label: "Find an FA meeting (foodaddicts.org)", url: "https://www.foodaddicts.org/find-a-meeting" },
  FAA: { label: "Find an FAA meeting (foodaddicts anonymous)", url: "https://faacanhelp.org/meetings/" },
  SCA: { label: "SCA meeting finder (onlinesca.org)", url: "https://onlinesca.org/" },
  SRA: { label: "Find an SRA meeting (sexualrecovery.org)", url: "https://sexualrecovery.org/meetings/" },
  SIA: { label: "Find an SIA meeting (siawso.org)", url: "https://siawso.org/meetings/" },
  WA: { label: "Find a WA meeting (workaholics-anonymous.org)", url: "https://workaholics-anonymous.org/meetings/" },
  CLA: { label: "Find a CLA meeting (clutterersanonymous.org)", url: "https://clutterersanonymous.org/meetings/" },
  EA: { label: "Find an EA meeting (emotionsanonymous.org)", url: "https://emotionsanonymous.org/find-an-ea-meeting/" },
  "Gam-Anon": { label: "Find a Gam-Anon meeting (gam-anon.org)", url: "https://www.gam-anon.org/meeting-directory" },
  "Co-Anon": { label: "Find a Co-Anon meeting (co-anon.org)", url: "https://co-anon.org/meetings/find-a-meeting" },
  FA: { label: "Find a Families Anonymous meeting (familiesanonymous.org)", url: "https://familiesanonymous.org/meetings/" },
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

// Spanish labels for the finder links. The domain in parentheses is kept verbatim; only the
// "Find a … meeting" verb phrase is translated. AI-drafted, pending native review.
const ES_LABELS: Record<string, string> = {
  AA: "Buscar AA (aa.org)",
  NA: "Buscar NA (na.org)",
  ACA: "Buscador de reuniones de ACA (adultchildren.org)",
  "Al-Anon": "Buscar una reunión de Al-Anon (al-anon.org)",
  Alateen: "Buscar una reunión de Alateen (al-anon.org)",
  "Nar-Anon": "Buscar una reunión de Nar-Anon (nar-anon.org)",
  OA: "Buscar una reunión de OA (oa.org)",
  GA: "Buscar una reunión de GA (gamblersanonymous.org)",
  MA: "Buscar una reunión de MA (marijuana-anonymous.org)",
  CMA: "Buscar una reunión de CMA (crystalmeth.org)",
  CoDA: "Buscar una reunión de CoDA (coda.org)",
  SAA: "Buscador de reuniones de SAA (saa-meetings.org)",
  SLAA: "Buscador de reuniones de S.L.A.A. (slaafws.org)",
  SA: "Buscar una reunión de SA (sa.org)",
  DA: "Buscar una reunión de DA (debtorsanonymous.org)",
  UA: "Buscar una reunión de UA (underearnersanonymous.org)",
  EDA: "Buscar una reunión de EDA (eatingdisordersanonymous.org)",
  NicA: "Buscar una reunión de Nicotina Anónimos (nicotine-anonymous.org)",
  RD: "Reuniones de Recovery Dharma (recoverydharma.org)",
  CA: "Buscar una reunión de CA (ca.org)",
  HA: "Buscar una reunión de HA (heroinanonymous.org)",
  PA: "Buscar una reunión de PA (pillsanonymous.org)",
  FAIR: "Buscar una reunión de FA (foodaddicts.org)",
  FAA: "Buscar una reunión de FAA (foodaddicts anonymous)",
  SCA: "Buscador de reuniones de SCA (onlinesca.org)",
  SRA: "Buscar una reunión de SRA (sexualrecovery.org)",
  SIA: "Buscar una reunión de SIA (siawso.org)",
  WA: "Buscar una reunión de WA (workaholics-anonymous.org)",
  CLA: "Buscar una reunión de CLA (clutterersanonymous.org)",
  EA: "Buscar una reunión de EA (emotionsanonymous.org)",
  "Gam-Anon": "Buscar una reunión de Gam-Anon (gam-anon.org)",
  "Co-Anon": "Buscar una reunión de Co-Anon (co-anon.org)",
  FA: "Buscar una reunión de Familias Anónimas (familiesanonymous.org)",
  SMART: "Buscador de reuniones de SMART Recovery (smartrecovery.org)",
};

export const officialFinder = (code?: string, loc?: FinderLoc, locale?: string): OfficialFinder | null => {
  const d = code ? DEFS[code] : null;
  if (!d) return null;
  const label = locale === "es" && code && ES_LABELS[code] ? ES_LABELS[code] : d.label;
  return { label, url: d.build ? d.build(loc || null) : d.url };
};
