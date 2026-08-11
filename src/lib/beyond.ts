// Fellowship-appropriate "beyond the meetings" resources for the NON-substance families.
// (The substance / alcohol & drugs family uses the sober-activities section instead — see
// SoberActivities.tsx.) Each family points to a small set of reputable, well-established
// organizations, chosen so nothing here can surface content harmful to that recovery:
//   • Food & eating  → recovery- and body-neutral support, NEVER diets or weight loss
//   • Gambling       → helpline + nonprofit financial help, NEVER betting content
//   • Money & work   → nonprofit / government only, NEVER lenders or paid debt-settlement
//   • Family/mental  → established mental-health and family-support organizations
// The Sex & relationships family intentionally has NO section (finder + related links only).
//
// These are stable organization homepages; Fellow renders no events and vets nothing — the note
// on each section says so. Links are centralized here for easy editing.

export type BeyondLink = { icon: string; color: string; title: string; sub: string; href: string };
export type BeyondSection = { heading: string; lede: string; groupLabel: string; links: BeyondLink[]; note: string };

const R: Record<string, BeyondLink> = {
  allianceED: { icon: "phone", color: "#2E9E5B", title: "The National Alliance for Eating Disorders", sub: "Free helpline & therapist finder", href: "https://www.allianceforeatingdisorders.com/" },
  anad: { icon: "person", color: "#2597B7", title: "ANAD", sub: "Free peer support groups & mentoring", href: "https://anad.org/" },
  bodyPositive: { icon: "chat", color: "#D81B8C", title: "The Body Positive", sub: "Body-image & self-acceptance community", href: "https://thebodypositive.org/" },

  smartFF: { icon: "person", color: "#E0384E", title: "SMART Recovery Family & Friends", sub: "Support groups for loved ones", href: "https://smartrecovery.org/family" },
  nami: { icon: "globe", color: "#178A8A", title: "NAMI", sub: "Family support & education for mental health", href: "https://www.nami.org/" },
  partnership: { icon: "phone", color: "#6D4AE0", title: "Partnership to End Addiction", sub: "Free helpline & resources for families", href: "https://drugfree.org/" },

  nfcc: { icon: "list", color: "#2E9E5B", title: "National Foundation for Credit Counseling", sub: "Nonprofit credit & debt counseling", href: "https://www.nfcc.org/" },
  cfpb: { icon: "globe", color: "#1E88C7", title: "Consumer Financial Protection Bureau", sub: "Free government money tools & guides", href: "https://www.consumerfinance.gov/" },

  icd: { icon: "list", color: "#6D4AE0", title: "Institute for Challenging Disorganization", sub: "Help for chronic disorganization & hoarding", href: "https://www.challengingdisorganization.org/" },
  mha: { icon: "globe", color: "#3FA34D", title: "Mental Health America", sub: "Free screening tools & peer support", href: "https://mhanational.org/" },
  ncpg: { icon: "phone", color: "#C0392B", title: "National Council on Problem Gambling", sub: "Confidential helpline — call or text 1-800-GAMBLER", href: "https://www.ncpgambling.org/" },
};

const FOOD: BeyondSection = {
  heading: "Support beyond the program",
  lede: "Recovery from food and eating struggles is bigger than one program. These communities and helplines offer support alongside your meetings — focused on healing and body-neutrality, never diets or weight loss.",
  groupLabel: "Trusted eating & body-image support",
  links: [R.allianceED, R.anad, R.bodyPositive],
  note: "These are independent organizations — Fellow doesn’t vet them. Everything here is recovery- and body-neutral, never focused on diets or weight.",
};

const FAMILY: BeyondSection = {
  heading: "Support for families & loved ones",
  lede: "Supporting someone in recovery — or recovering from its effects on you — takes its own community. These trusted organizations help alongside your meetings.",
  groupLabel: "For people affected by someone’s addiction",
  links: [R.smartFF, R.nami, R.partnership],
  note: "These are independent organizations — Fellow doesn’t vet them; reach out to whichever fits.",
};

const FINANCIAL: BeyondSection = {
  heading: "Financial wellbeing resources",
  lede: "Alongside the steps, these nonprofit and public resources can help you steady your finances and build a healthier relationship with money.",
  groupLabel: "Nonprofit & public money help",
  links: [R.nfcc, R.cfpb],
  note: "Nonprofit and government resources only — never lenders or paid debt-settlement services.",
};

const MENTAL: BeyondSection = {
  heading: "Mental health support",
  lede: "Recovery and emotional wellbeing go hand in hand. These trusted organizations offer peer support, education, and free tools alongside your meetings.",
  groupLabel: "Peer support & tools",
  links: [R.nami, R.mha],
  note: "These are independent organizations — Fellow doesn’t vet them.",
};

const GAMBLING: BeyondSection = {
  heading: "Support beyond the meetings",
  lede: "Recovery from a gambling problem often means tending to finances too. These confidential, nonprofit resources help alongside your meetings.",
  groupLabel: "Gambling & financial recovery",
  links: [R.ncpg, R.nfcc],
  note: "Helpline and nonprofit resources only — never betting or gambling content.",
};

const WORK: BeyondSection = {
  heading: "Support beyond the meetings",
  lede: "Stepping back from compulsive work takes support. These trusted organizations offer tools for stress, burnout, and mental wellbeing alongside your meetings.",
  groupLabel: "Burnout & wellbeing",
  links: [R.mha, R.nami],
  note: "These are independent organizations — Fellow doesn’t vet them.",
};

const CLUTTER: BeyondSection = {
  heading: "Support beyond the meetings",
  lede: "These professional and nonprofit resources support recovery from chronic disorganization alongside your meetings.",
  groupLabel: "Help with clutter & disorganization",
  links: [R.icd, R.mha],
  note: "These are independent organizations — Fellow doesn’t vet them.",
};

const BY_CODE_SECTION: Record<string, BeyondSection> = {
  // Food & eating
  OA: FOOD, EDA: FOOD, FAIR: FOOD, FAA: FOOD,
  // Family & friends
  "Al-Anon": FAMILY, Alateen: FAMILY, "Nar-Anon": FAMILY, "Gam-Anon": FAMILY, "Co-Anon": FAMILY, FA: FAMILY,
  // Money & work
  DA: FINANCIAL, UA: FINANCIAL, WA: WORK, CLA: CLUTTER,
  // Emotional & behavioral (per-fellowship)
  GA: GAMBLING, EA: MENTAL, CoDA: MENTAL, ACA: MENTAL,
  // (Alcohol & drugs → sober section; Sex & relationships → intentionally none.)
};

export function beyondFor(code: string): BeyondSection | null {
  return BY_CODE_SECTION[code] || null;
}
