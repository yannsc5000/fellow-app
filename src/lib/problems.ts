// Problem-first discovery pages (/support-groups/[slug]) — the "which support group is right for
// me?" router. Many people know what they're struggling with but not the fellowship name, so these
// pages start from the PROBLEM, explain the options, and route to the right fellowship page(s) and
// meeting search. A key axis: help for YOURSELF vs help because of SOMEONE ELSE's behavior.
//
// `self` / `affected` reference Fellow's fellowship codes; notes are short, accurate routing blurbs.

export type Route = { code: string; note: string };
export type Problem = {
  slug: string;
  h1: string;
  title: string;        // SEO title
  description: string;  // meta description
  keywords: string[];   // long-tail intent
  lede: string;         // self-contained quick answer
  self: Route[];        // fellowships for the person themselves
  affected?: Route[];   // fellowships for people affected by someone else
};

export const PROBLEMS: Problem[] = [
  {
    slug: "alcohol",
    h1: "Alcohol support groups",
    title: "Alcohol Support Groups Near Me & Online | Help to Stop Drinking",
    description: "Not sure where to start with drinking? Find the right peer-support group — Alcoholics Anonymous for yourself, or Al-Anon and Alateen if someone else's drinking affects you.",
    keywords: ["alcohol support groups near me", "help to stop drinking", "AA or Al-Anon", "support for family of alcoholic"],
    lede: "If drinking has become a problem — for you or for someone you love — there's a peer-support group for it. Alcoholics Anonymous (AA) is for people who want to stop drinking; Al-Anon and Alateen are for the families and friends affected by someone else's drinking.",
    self: [{ code: "AA", note: "For anyone with a desire to stop drinking." }],
    affected: [
      { code: "Al-Anon", note: "For families & friends affected by someone's drinking." },
      { code: "Alateen", note: "For young people affected by someone's drinking." },
    ],
  },
  {
    slug: "drugs",
    h1: "Drug addiction support groups",
    title: "Drug Addiction Support Groups Near Me & Online",
    description: "Find peer-support meetings for drug addiction — Narcotics Anonymous for recovery from any drug, plus Nar-Anon and Families Anonymous for those affected by a loved one's use.",
    keywords: ["drug addiction support groups near me", "narcotics anonymous", "support for family of addict", "help for drug addiction"],
    lede: "Narcotics Anonymous (NA) is for recovery from drug addiction of any kind — not just narcotics. If it's a loved one who's using, Nar-Anon and Families Anonymous are for the family members and friends affected.",
    self: [{ code: "NA", note: "Recovery from drug addiction of any kind." }],
    affected: [
      { code: "Nar-Anon", note: "For families & friends affected by someone's drug use." },
      { code: "FA", note: "Families Anonymous — for families concerned about a loved one's drug, alcohol, or behavioral problems." },
    ],
  },
  {
    slug: "opioids-and-heroin",
    h1: "Heroin & opioid support groups",
    title: "Heroin & Opioid Support Groups Near Me & Online",
    description: "Find peer support for heroin and opioid recovery — Heroin Anonymous is centered on opioids, and Narcotics Anonymous covers drug addiction more broadly.",
    keywords: ["heroin support groups", "opioid recovery meetings", "heroin anonymous near me", "opioid addiction support"],
    lede: "Heroin Anonymous (HA) is centered specifically on recovery from heroin and opioids, while Narcotics Anonymous (NA) is for drug addiction of any kind. Both use the same 12-step peer support, so try whichever fits your experience.",
    self: [
      { code: "HA", note: "Centered on recovery from heroin and opioids." },
      { code: "NA", note: "Broader drug-addiction recovery." },
    ],
    affected: [
      { code: "Nar-Anon", note: "For families & friends affected by someone's drug use." },
      { code: "FA", note: "Families Anonymous — for families of a loved one struggling." },
    ],
  },
  {
    slug: "cocaine",
    h1: "Cocaine support groups",
    title: "Cocaine Support Groups Near Me & Online | CA",
    description: "Find cocaine recovery meetings — Cocaine Anonymous for your own recovery, and Co-Anon for family members and friends affected by someone's cocaine use.",
    keywords: ["cocaine support groups", "cocaine anonymous near me", "crack addiction support", "family of cocaine addict support"],
    lede: "Cocaine Anonymous (CA) is for anyone who wants to stop using cocaine and other substances. If you're affected by someone else's cocaine use, Co-Anon is the family-and-friends fellowship.",
    self: [{ code: "CA", note: "For anyone who wants to stop using cocaine and other substances." }],
    affected: [{ code: "Co-Anon", note: "For families & friends affected by someone's cocaine use." }],
  },
  {
    slug: "marijuana",
    h1: "Marijuana & cannabis support groups",
    title: "Marijuana Support Groups Near Me & Online | Cannabis",
    description: "Find Marijuana Anonymous meetings for anyone who wants to stop using cannabis — in person and online.",
    keywords: ["marijuana support groups", "weed addiction support group", "cannabis addiction help", "marijuana anonymous near me"],
    lede: "Marijuana Anonymous (MA) is a 12-step fellowship for anyone who wants to stop using cannabis. “Marijuana,” “cannabis,” and “weed” all point to the same place — you don't need a particular label to come.",
    self: [{ code: "MA", note: "For anyone who wants to stop using cannabis." }],
  },
  {
    slug: "crystal-meth",
    h1: "Crystal meth support groups",
    title: "Crystal Meth Support Groups Near Me & Online | CMA",
    description: "Find Crystal Meth Anonymous meetings for recovery from crystal meth and other substances — in person and online.",
    keywords: ["crystal meth support groups", "meth addiction meetings", "crystal meth anonymous near me"],
    lede: "Crystal Meth Anonymous (CMA) is centered on recovery from crystal meth and other mind-altering substances. Its only requirement is a desire to stop using.",
    self: [{ code: "CMA", note: "Recovery from crystal meth and other substances." }],
  },
  {
    slug: "nicotine-and-vaping",
    h1: "Nicotine, smoking & vaping support groups",
    title: "Nicotine & Vaping Support Groups Near Me & Online | Quit Smoking",
    description: "Find Nicotine Anonymous meetings for living free of nicotine — smoking, vaping, and other tobacco — in person and online.",
    keywords: ["quit smoking support group", "nicotine anonymous near me", "vaping addiction support", "stop smoking meetings"],
    lede: "Nicotine Anonymous (NicA) is a peer-support fellowship for living free of nicotine in any form, including smoking and vaping. People often use it alongside other quit tools.",
    self: [{ code: "NicA", note: "For living free of nicotine — smoking or vaping." }],
  },
  {
    slug: "prescription-pills",
    h1: "Prescription pill support groups",
    title: "Prescription Pill Support Groups Near Me & Online | PA",
    description: "Find Pills Anonymous meetings for recovery from pill addiction — prescription or otherwise. Talk to a doctor before changing a prescription.",
    keywords: ["pill addiction support group", "prescription drug support group", "pills anonymous near me", "painkiller addiction help"],
    lede: "Pills Anonymous (PA) is for anyone who wants to stop using pills, prescription or otherwise. One important note: some medications shouldn't be stopped suddenly, so talk to a doctor before changing a prescription.",
    self: [{ code: "PA", note: "Recovery from pill addiction, prescription or otherwise." }],
  },
  {
    slug: "gambling",
    h1: "Gambling support groups",
    title: "Gambling Support Groups Near Me & Online | Problem Gambling Help",
    description: "Find help for problem gambling — Gamblers Anonymous for your own recovery, and Gam-Anon for family and friends affected by someone's gambling.",
    keywords: ["gambling support groups near me", "gamblers anonymous", "problem gambling help", "support for family of gambler"],
    lede: "Gamblers Anonymous (GA) is for people who want to recover from their own gambling. If it's a loved one's gambling that's affecting you, Gam-Anon is the fellowship for family and friends.",
    self: [{ code: "GA", note: "For your own recovery from compulsive gambling." }],
    affected: [{ code: "Gam-Anon", note: "For families & friends affected by someone's gambling." }],
  },
  {
    slug: "food-and-eating",
    h1: "Food & eating support groups",
    title: "Food & Eating Support Groups Near Me & Online",
    description: "Find peer-support meetings for food and eating — Overeaters Anonymous, Eating Disorders Anonymous, and the two food-addiction fellowships. Peer support complements professional care.",
    keywords: ["compulsive eating support group", "binge eating support group", "food addiction meetings", "overeaters anonymous near me", "eating disorder support groups"],
    lede: "Several fellowships support recovery around food and eating, and they take different approaches — so it's worth reading each and trying the meeting that fits. Peer support complements professional care for an eating disorder rather than replacing it.",
    self: [
      { code: "OA", note: "Compulsive eating & unhealthy relationships with food." },
      { code: "EDA", note: "Recovery from an eating disorder (complements professional care)." },
      { code: "FAIR", note: "Food Addicts in Recovery Anonymous — recovery from food addiction." },
      { code: "FAA", note: "Food Addicts Anonymous — a separate food-addiction fellowship." },
    ],
  },
  {
    slug: "sex-and-pornography",
    h1: "Sex & pornography support groups",
    title: "Sex & Pornography Addiction Support Groups Near Me & Online",
    description: "Find confidential peer-support fellowships for compulsive sexual behavior — SAA, SA, SCA, and SRA — plus COSLAA for those affected by someone else's behavior.",
    keywords: ["sex addiction support group", "pornography addiction support", "compulsive sexual behavior meetings", "sex addicts anonymous near me"],
    lede: "Several separate 12-step fellowships support recovery from compulsive sexual behavior, with different literature and definitions of sobriety. The best fit is usually the one whose meetings and language you identify with. If it's someone else's behavior affecting you, COSLAA is for partners and family.",
    self: [
      { code: "SAA", note: "Sex Addicts Anonymous — you define the behaviors you want to change." },
      { code: "SA", note: "Sexaholics Anonymous — uses one fellowship-wide definition of sobriety." },
      { code: "SCA", note: "Sexual Compulsives Anonymous." },
      { code: "SRA", note: "Sexual Recovery Anonymous — has its own sobriety definition." },
    ],
    affected: [{ code: "COSLAA", note: "For those affected by someone else's sex or love addiction." }],
  },
  {
    slug: "love-and-relationships",
    h1: "Love & relationship support groups",
    title: "Love & Relationship Addiction Support Groups Near Me & Online",
    description: "Find peer support for patterns around love and relationships — Sex and Love Addicts Anonymous, plus Co-Dependents Anonymous for codependent relationship patterns.",
    keywords: ["love addiction meetings", "relationship addiction support", "SLAA near me", "codependency support group"],
    lede: "Sex and Love Addicts Anonymous (SLAA) is organized around patterns of both sex and love, including obsessive relationships and romantic fixation. If the pattern is more about losing yourself in relationships and struggling with boundaries, Co-Dependents Anonymous (CoDA) may fit.",
    self: [
      { code: "SLAA", note: "Patterns of sex and love addiction, including relationships." },
      { code: "CoDA", note: "Codependent relationship patterns and healthy boundaries." },
    ],
  },
  {
    slug: "codependency",
    h1: "Codependency support groups",
    title: "Codependency Support Groups Near Me & Online | CoDA",
    description: "Find Co-Dependents Anonymous meetings for developing healthy relationships — plus ACA for adults shaped by growing up in a dysfunctional family.",
    keywords: ["codependency support group", "co-dependents anonymous near me", "healthy relationships support", "adult children of alcoholics"],
    lede: "Co-Dependents Anonymous (CoDA) is for people working toward healthy, balanced relationships — with boundaries, and with themselves. If the patterns trace back to growing up in a dysfunctional family, ACA may also fit.",
    self: [
      { code: "CoDA", note: "Developing healthy, balanced relationships." },
      { code: "ACA", note: "For adults shaped by growing up in a dysfunctional family." },
    ],
  },
  {
    slug: "money-work-and-clutter",
    h1: "Money, work & clutter support groups",
    title: "Money, Work & Clutter Support Groups Near Me & Online",
    description: "Find peer support for money, work, and clutter — Debtors Anonymous, Underearners Anonymous, Workaholics Anonymous, and Clutterers Anonymous.",
    keywords: ["debt support group", "compulsive spending recovery", "workaholics anonymous", "clutter support group", "underearners anonymous"],
    lede: "A few fellowships support recovery around money, work, and possessions — compulsive debting, underearning, overwork, and clutter. These are peer support, not financial, tax, or legal advice.",
    self: [
      { code: "DA", note: "Debtors Anonymous — compulsive debting and money patterns." },
      { code: "UA", note: "Underearners Anonymous — underearning and use of time & opportunity." },
      { code: "WA", note: "Workaholics Anonymous — compulsive working and overwork." },
      { code: "CLA", note: "Clutterers Anonymous — clutter and chronic disorganization." },
    ],
  },
  {
    slug: "emotional-wellbeing",
    h1: "Emotional wellbeing support groups",
    title: "Emotional Support Groups Near Me & Online | Emotions Anonymous",
    description: "Find Emotions Anonymous meetings — peer support for emotional wellbeing, including anxiety, depression, and stress. Not therapy or crisis care; works alongside professional support.",
    keywords: ["emotional support groups", "anxiety support group", "depression peer support", "emotions anonymous near me"],
    lede: "Emotions Anonymous (EA) is a 12-step peer-support fellowship for emotional wellbeing — for people dealing with things like anxiety, depression, or stress. It isn't therapy or crisis care, and works well alongside professional support.",
    self: [{ code: "EA", note: "Peer support for emotional wellbeing." }],
  },
  {
    slug: "family-of-someone-struggling",
    h1: "Support when someone you love is struggling",
    title: "Support Groups for Families & Friends of Someone Struggling",
    description: "You don't have to wait for a loved one to get help before getting support of your own. Find the right family-and-friends fellowship — Al-Anon, Nar-Anon, Families Anonymous, Co-Anon, or Gam-Anon.",
    keywords: ["support for family of addict", "help for parents of addict", "spouse of alcoholic support", "family support for addiction", "support when loved one won't get help"],
    lede: "You can get support for yourself whether or not the person you're worried about is ready to change. Several fellowships exist specifically for family members and friends — the right one depends on what your loved one is facing.",
    self: [],
    affected: [
      { code: "Al-Anon", note: "Affected by someone's drinking." },
      { code: "Nar-Anon", note: "Affected by someone's drug use." },
      { code: "FA", note: "Families Anonymous — drug, alcohol, or related behavioral problems." },
      { code: "Co-Anon", note: "Affected by someone's cocaine or other substance use." },
      { code: "Gam-Anon", note: "Affected by someone's gambling." },
    ],
  },
];

export const PROBLEM_BY_SLUG: Record<string, Problem> = Object.fromEntries(PROBLEMS.map((p) => [p.slug, p]));
