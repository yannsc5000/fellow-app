// Outbound "sober activities" links for the Beyond-the-meetings section.
//
// Fellow renders NONE of these events itself — it points to trusted sober directories and to
// pre-filled searches on the big platforms — so it can never surface a drinking event by
// accident. The two tiers reflect a real safety gradient:
//   • Directories are sober BY CHARTER (their whole reason to exist), so they carry no
//     drinking-event risk and show everywhere.
//   • Platform searches (Meetup/Eventbrite) add breadth but CAN surface the odd drinking
//     event, so they appear only on city pages (where a local search is actionable) and
//     always ship with the "not vetted — confirm it's alcohol-free" note in the UI.
//
// NOTE: the two platform-search URLs are best-effort deep links; the directory links are
// stable homepages. Spot-check the Meetup/Eventbrite URLs against live before relying on them.

// `mark` is a brand-colored lettermark shown in the round chip — a legally-safe stand-in for
// each platform's real logo (which we don't reproduce), `color` its brand accent.
export type SoberLink = { mark: string; color: string; title: string; sub: string; href: string };
export type SoberLinks = { place: string; directories: SoberLink[]; platforms: SoberLink[] };

const slugPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Curated, sober-by-charter directories — no drinking-event risk.
const DIRECTORIES: SoberLink[] = [
  { mark: "I", color: "#2597B7", title: "In The Rooms", sub: "Online recovery community — live events & socials", href: "https://www.intherooms.com/" },
  { mark: "L", color: "#6D4AE0", title: "Loosid", sub: "Sober social app & “Boozeless” city guides", href: "https://www.loosidapp.com/" },
  { mark: "S", color: "#D81B8C", title: "The Sober Curator", sub: "Sober nightlife & alcohol-free events, by city", href: "https://thesobercurator.com/" },
  { mark: "Z", color: "#2E9E5B", title: "Zero Proof Places", sub: "Dry bars & alcohol-free venues near you", href: "https://www.zeroproofplaces.com/" },
];

// ---- Spanish (es) translations ------------------------------------------------------------
// AI-drafted; PENDING native, recovery-aware review before this ships to production. English
// above stays the source of truth; these override only at render time for /es. Brand names
// (directory titles), URLs, `mark`, `color`, and the quoted platform search tokens in the
// platform `sub` stay byte-identical to English — those tokens mirror the actual (English)
// search query sent to Meetup/Eventbrite.
//
// Directory `sub` blurbs are keyed by href (a stable, unique key). Platform `title` strings are
// keyed by `mark`. Platform `sub` is intentionally NOT overridden — it is only the quoted search
// tokens plus the place label, both of which stay as-is.
const ES_DIR_SUB: Record<string, string> = {
  "https://www.intherooms.com/": "Comunidad de recuperación en línea: eventos en vivo y encuentros",
  "https://www.loosidapp.com/": "App social en sobriedad y guías «Boozeless» por ciudad",
  "https://thesobercurator.com/": "Vida nocturna en sobriedad y eventos sin alcohol, por ciudad",
  "https://www.zeroproofplaces.com/": "Bares secos y locales sin alcohol cerca de ti",
};
const ES_PLATFORM_TITLE: Record<string, string> = {
  M: "Grupos en sobriedad y de recuperación en Meetup",
  E: "Eventos sin alcohol en Eventbrite",
};

export function soberLinks(opts: { city?: string; state?: string; stateName?: string; locale?: string }): SoberLinks {
  const { city, state, stateName, locale } = opts;
  const hasCity = !!(city && state);
  const place = hasCity ? (city as string) : "";
  const label = hasCity ? `${city}, ${state}` : "";
  const es = locale === "es";

  const directories: SoberLink[] = es
    ? DIRECTORIES.map((l) => ({ ...l, sub: ES_DIR_SUB[l.href] ?? l.sub }))
    : DIRECTORIES;

  const platformsEN: SoberLink[] = hasCity
    ? [
        {
          mark: "M", color: "#E0384E",
          title: "Sober & recovery groups on Meetup",
          sub: `“sober”, “recovery” · ${label}`,
          href: `https://www.meetup.com/find/?keywords=sober%20recovery&location=us--${(state as string).toLowerCase()}--${encodeURIComponent(city as string)}&source=EVENTS`,
        },
        {
          mark: "E", color: "#F05537",
          title: "Alcohol-free events on Eventbrite",
          sub: `“sober” · “alcohol-free” · ${label}`,
          href: `https://www.eventbrite.com/d/${(state as string).toLowerCase()}--${slugPart(city as string)}/sober/`,
        },
      ]
    : [];

  const platforms: SoberLink[] = es
    ? platformsEN.map((l) => ({ ...l, title: ES_PLATFORM_TITLE[l.mark] ?? l.title }))
    : platformsEN;

  return { place, directories, platforms };
}
