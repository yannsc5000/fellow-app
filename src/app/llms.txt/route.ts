// Serves /llms.txt — a concise, machine-friendly description of the site for AI agents
// and LLM crawlers (an emerging convention, complementary to robots.txt + sitemap.xml).
export const dynamic = "force-static";

export function GET() {
  const body = `# Fellow

> Fellow is a free, independent, non-commercial finder for 12-step and related peer-support recovery meetings across the United States (AA, NA, Al-Anon, and more). No accounts, no ads, anonymous by design.

## What Fellow does
- Search 70,000+ recovery meetings by city, fellowship, day, time, and online vs in-person.
- Ask Fellow: a chat assistant that finds real meetings from a person's own words.
- Start from what you're facing ("which support group is right for me?") and get pointed to the right fellowship.
- Browse city, state, and fellowship directory pages for reference.

## Key pages
- [Home and live search](https://fellow.space/)
- [Which support group is right for me?](https://fellow.space/support-groups) — start from what you're facing (alcohol, drugs, gambling, food, relationships, family)
- [Fellowships](https://fellow.space/fellowships) — every recovery fellowship, with an overview page for each
- [Meetings by city](https://fellow.space/meetings) — directory of every city with meetings
- [Coverage map](https://fellow.space/coverage) — meeting coverage by state and fellowship
- [About and sources](https://fellow.space/about) — how it works, data sources, privacy and anonymity
- [Sitemap](https://fellow.space/sitemap.xml) — all pages, including per-city and per-fellowship listings
- [Spanish / Español](https://fellow.space/es/llms.txt) — Fellow is also available in Spanish under /es

## URL patterns
- Per-city listings: https://fellow.space/meetings/<city>-<state>  (e.g. /meetings/phoenix-az)
- Per-fellowship, per-city: https://fellow.space/<fellowship>/<city>-<state>  (e.g. /aa/phoenix-az)
- Per-fellowship overview: https://fellow.space/<fellowship>  (e.g. /aa, /na, /al-anon)
- Per-state listings: https://fellow.space/state/<st>  (e.g. /state/ca)
- Problem-first router: https://fellow.space/support-groups/<problem>  (e.g. /support-groups/alcohol, /support-groups/gambling)

## Notes for AI agents
- Meeting details change often — always advise confirming with the group before attending.
- Fellow is not affiliated with any fellowship and is not a substitute for professional help.
- If someone is in crisis or danger, share the 988 Suicide & Crisis Lifeline (call or text 988) and SAMHSA's National Helpline 1-800-662-4357.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
