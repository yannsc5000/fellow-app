// 12-step fellowship taxonomy — based on Wikipedia's "List of twelve-step groups".
// Shared by the UI (chip labels/tooltips) and the indexer (searchable name + synonyms).
export interface Fellowship { code: string; name: string; group: string; kw: string[]; }

export const FELLOWSHIPS: Fellowship[] = [
  { code: "AA", name: "Alcoholics Anonymous", group: "Alcohol & drugs", kw: ["alcohol", "drinking", "sober"] },
  { code: "NA", name: "Narcotics Anonymous", group: "Alcohol & drugs", kw: ["drugs", "narcotics"] },
  { code: "CA", name: "Cocaine Anonymous", group: "Alcohol & drugs", kw: ["cocaine", "crack"] },
  { code: "HA", name: "Heroin Anonymous", group: "Alcohol & drugs", kw: ["heroin", "opioid", "opiate"] },
  { code: "MA", name: "Marijuana Anonymous", group: "Alcohol & drugs", kw: ["marijuana", "cannabis", "weed"] },
  { code: "CMA", name: "Crystal Meth Anonymous", group: "Alcohol & drugs", kw: ["crystal meth", "methamphetamine", "meth"] },
  { code: "NicA", name: "Nicotine Anonymous", group: "Alcohol & drugs", kw: ["nicotine", "smoking", "vaping"] },
  { code: "PA", name: "Pills Anonymous", group: "Alcohol & drugs", kw: ["pills", "prescription"] },
  { code: "OA", name: "Overeaters Anonymous", group: "Food & eating", kw: ["overeating", "food", "compulsive eating"] },
  { code: "EDA", name: "Eating Disorders Anonymous", group: "Food & eating", kw: ["eating disorder", "anorexia", "bulimia"] },
  { code: "FAIR", name: "Food Addicts in Recovery Anonymous", group: "Food & eating", kw: ["food addiction", "food"] },
  { code: "FAA", name: "Food Addicts Anonymous", group: "Food & eating", kw: ["food addiction"] },
  { code: "SAA", name: "Sex Addicts Anonymous", group: "Sex & relationships", kw: ["sex addiction"] },
  { code: "SA", name: "Sexaholics Anonymous", group: "Sex & relationships", kw: ["sexaholic"] },
  { code: "SLAA", name: "Sex and Love Addicts Anonymous", group: "Sex & relationships", kw: ["sex and love", "love addiction"] },
  { code: "SCA", name: "Sexual Compulsives Anonymous", group: "Sex & relationships", kw: ["sexual compulsion"] },
  { code: "SRA", name: "Sexual Recovery Anonymous", group: "Sex & relationships", kw: ["sexual recovery"] },
  { code: "SIA", name: "Survivors of Incest Anonymous", group: "Sex & relationships", kw: ["incest", "abuse survivor"] },
  { code: "COSLAA", name: "CoSex and Love Addicts Anonymous", group: "Sex & relationships", kw: ["coslaa", "affected by sex and love"] },
  { code: "DA", name: "Debtors Anonymous", group: "Money & work", kw: ["debt", "money", "spending"] },
  { code: "UA", name: "Underearners Anonymous", group: "Money & work", kw: ["underearning", "income"] },
  { code: "WA", name: "Workaholics Anonymous", group: "Money & work", kw: ["workaholism", "work"] },
  { code: "CLA", name: "Clutterers Anonymous", group: "Money & work", kw: ["clutter", "hoarding"] },
  { code: "EA", name: "Emotions Anonymous", group: "Emotional & behavioral", kw: ["emotions", "anxiety", "depression"] },
  { code: "GA", name: "Gamblers Anonymous", group: "Emotional & behavioral", kw: ["gambling", "betting"] },
  { code: "CoDA", name: "Co-Dependents Anonymous", group: "Emotional & behavioral", kw: ["codependency", "codependent"] },
  { code: "ACA", name: "Adult Children of Alcoholics & Dysfunctional Families", group: "Emotional & behavioral", kw: ["adult children", "acoa", "dysfunctional family"] },
  { code: "Al-Anon", name: "Al-Anon Family Groups", group: "Family & friends", kw: ["families of alcoholics", "loved ones", "family"] },
  { code: "Alateen", name: "Alateen", group: "Family & friends", kw: ["teens", "teenager", "family"] },
  { code: "Nar-Anon", name: "Nar-Anon Family Groups", group: "Family & friends", kw: ["families of addicts", "family"] },
  { code: "Gam-Anon", name: "Gam-Anon", group: "Family & friends", kw: ["families of gamblers", "family"] },
  { code: "Co-Anon", name: "Co-Anon", group: "Family & friends", kw: ["families of addicts", "family"] },
  { code: "FA", name: "Families Anonymous", group: "Family & friends", kw: ["families", "family"] },
];

export const BY_CODE: Record<string, Fellowship> = Object.fromEntries(FELLOWSHIPS.map((f) => [f.code, f]));
export const fellowshipName = (code: string) => BY_CODE[code]?.name || code;

// Vibrant, WCAG-safe color per fellowship (white text on each). Grouped by family so the
// color hints at the category; unknown codes fall back to a neutral stone.
export const FELLOWSHIP_COLORS: Record<string, string> = {
  AA: "#4F46E5",
  NA: "#0D9488", CA: "#0369A1", CMA: "#7C3AED", MA: "#15803D", HA: "#BE123C", NicA: "#0E7490", PA: "#4338CA",
  OA: "#EA580C", EDA: "#B45309", FAIR: "#92400E", FAA: "#78350F",
  SLAA: "#E11D48", SAA: "#DB2777", SA: "#BE185D", SCA: "#C026D3", SRA: "#9333EA", SIA: "#7E22CE", COSLAA: "#A21CAF",
  DA: "#0F766E", UA: "#047857", WA: "#0891B2", CLA: "#6D28D9",
  EA: "#2563EB", GA: "#DC2626",
  CoDA: "#0284C7", ACA: "#1D4ED8", "Al-Anon": "#075985", Alateen: "#155E75",
  "Nar-Anon": "#1E40AF", "Gam-Anon": "#3730A3", "Co-Anon": "#5B21B6", FA: "#6D28D9",
};
export const fellowshipColor = (code: string) => FELLOWSHIP_COLORS[code] || "#57534E";
export const fellowshipTerms = (code: string) => {
  const f = BY_CODE[code];
  return f ? [f.name, ...f.kw].join(" ") : "";
};
