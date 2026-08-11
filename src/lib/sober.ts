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

export function soberLinks(opts: { city?: string; state?: string; stateName?: string }): SoberLinks {
  const { city, state, stateName } = opts;
  const hasCity = !!(city && state);
  const place = hasCity ? (city as string) : "";
  const label = hasCity ? `${city}, ${state}` : "";

  const platforms: SoberLink[] = hasCity
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

  return { place, directories: DIRECTORIES, platforms };
}
