// Discovery seeds — candidate domains for scripts/discover.mjs to probe.
//
// This is the ONLY fellowship-specific part of discovery. The crawler engine
// (discover.mjs) keys off the TSML/BMLT plugin signature, not the fellowship, so the
// same engine works for AA, CMA, MA, Al-Anon, SLAA, NA, etc. — you just add seeds here.
//
// Each seed: { domain, fellowship, area? }
//   domain     — bare hostname (with or without www / scheme; normalized in the crawler)
//   fellowship — used only to label the emitted registry entry + generate its id
//   area       — optional human label; the crawler fills a guess if omitted
//
// The crawler skips any domain whose host already appears in registry.mjs, so this list
// can safely accumulate — re-running only probes what's genuinely new.
//
// At scale this file gets *generated* by the enumeration step (walking the AA Area/district
// site trees and the "A.A. Near You" entity directory into candidate domains); until then,
// it's a hand-maintained queue of gap targets. Add freely; the crawler is the arbiter.

export const SEEDS = [
  // ---- AA gap metros / regions to probe (not yet in the registry) ----
  { domain: "aacapecod.org",   fellowship: "AA", area: "Cape Cod & the Islands MA" },
  { domain: "aamilwaukee.com",  fellowship: "AA", area: "Milwaukee WI (Central Office)" }, // expect NON-TSML (legacy CMS) — negative control
  { domain: "nnjaa.org",        fellowship: "AA", area: "Northern New Jersey Intergroup" }, // expect NON-TSML (cgi-bin) — negative control
  { domain: "aaworcester.org",  fellowship: "AA", area: "Worcester MA (Central & Metro West)" }, // expect NON-TSML (ASP.NET) — negative control

  // ---- Other fellowships plug in identically — same engine, just a different label ----
  // (Examples; add real regional TSML sites as you find them.)
  // { domain: "cmasf.org",       fellowship: "CMA",  area: "CMA San Francisco" },
  // { domain: "oustin.org",      fellowship: "OA",   area: "OA Central Texas" },
];
