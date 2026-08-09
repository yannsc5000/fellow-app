// 12-step fellowship taxonomy — based on Wikipedia's "List of twelve-step groups".
// Shared by the UI (chip labels/tooltips) and the indexer (searchable name + synonyms).
export interface Fellowship { code: string; name: string; group: string; kw: string[]; }

export const FELLOWSHIPS: Fellowship[] = [
  { code: "AA", name: "Alcoholics Anonymous", group: "Alcohol & drugs", kw: ["alcohol", "alcoholic", "drinking", "drink", "sober", "sobriety", "booze", "drunk"] },
  { code: "NA", name: "Narcotics Anonymous", group: "Alcohol & drugs", kw: ["drugs", "narcotics", "addict", "addiction", "using", "clean"] },
  { code: "CA", name: "Cocaine Anonymous", group: "Alcohol & drugs", kw: ["cocaine", "crack", "coke"] },
  { code: "HA", name: "Heroin Anonymous", group: "Alcohol & drugs", kw: ["heroin", "opioid", "opiate", "opioids", "fentanyl", "dope"] },
  { code: "MA", name: "Marijuana Anonymous", group: "Alcohol & drugs", kw: ["marijuana", "cannabis", "weed", "pot", "thc"] },
  { code: "CMA", name: "Crystal Meth Anonymous", group: "Alcohol & drugs", kw: ["crystal meth", "methamphetamine", "meth", "tina"] },
  { code: "NicA", name: "Nicotine Anonymous", group: "Alcohol & drugs", kw: ["nicotine", "smoking", "smoke", "vaping", "vape", "cigarettes", "tobacco"] },
  { code: "PA", name: "Pills Anonymous", group: "Alcohol & drugs", kw: ["pills", "prescription", "benzos", "painkillers", "xanax"] },
  { code: "OA", name: "Overeaters Anonymous", group: "Food & eating", kw: ["overeating", "overeater", "food", "compulsive eating", "binge eating", "binge", "sugar"] },
  { code: "EDA", name: "Eating Disorders Anonymous", group: "Food & eating", kw: ["eating disorder", "anorexia", "bulimia", "disordered eating", "purging"] },
  { code: "FAIR", name: "Food Addicts in Recovery Anonymous", group: "Food & eating", kw: ["food addiction", "food addict", "food", "sugar"] },
  { code: "FAA", name: "Food Addicts Anonymous", group: "Food & eating", kw: ["food addiction", "food addict", "food", "sugar"] },
  { code: "SAA", name: "Sex Addicts Anonymous", group: "Sex & relationships", kw: ["sex addiction", "sex addict", "sex", "porn", "pornography", "lust"] },
  { code: "SA", name: "Sexaholics Anonymous", group: "Sex & relationships", kw: ["sexaholic", "sex", "lust", "porn"] },
  { code: "SLAA", name: "Sex and Love Addicts Anonymous", group: "Sex & relationships", kw: ["sex and love", "love addiction", "love addict", "relationships", "dating", "romance"] },
  { code: "SCA", name: "Sexual Compulsives Anonymous", group: "Sex & relationships", kw: ["sexual compulsion", "sexual compulsive", "sex", "compulsive sex"] },
  { code: "SRA", name: "Sexual Recovery Anonymous", group: "Sex & relationships", kw: ["sexual recovery", "sex"] },
  { code: "SIA", name: "Survivors of Incest Anonymous", group: "Sex & relationships", kw: ["incest", "abuse survivor", "sexual abuse", "childhood abuse", "trauma"] },
  { code: "COSLAA", name: "CoSex and Love Addicts Anonymous", group: "Sex & relationships", kw: ["coslaa", "affected by sex and love", "partner sex addiction"] },
  { code: "DA", name: "Debtors Anonymous", group: "Money & work", kw: ["debt", "debtor", "money", "spending", "overspending", "finances", "financial"] },
  { code: "UA", name: "Underearners Anonymous", group: "Money & work", kw: ["underearning", "underearner", "income", "earning", "money"] },
  { code: "WA", name: "Workaholics Anonymous", group: "Money & work", kw: ["workaholism", "workaholic", "work", "overworking", "burnout"] },
  { code: "CLA", name: "Clutterers Anonymous", group: "Money & work", kw: ["clutter", "clutterer", "hoarding", "hoarder", "messy", "disorganized", "disorganization"] },
  { code: "EA", name: "Emotions Anonymous", group: "Emotional & behavioral", kw: ["emotions", "emotional", "anxiety", "depression", "mental health", "feelings", "stress"] },
  { code: "GA", name: "Gamblers Anonymous", group: "Emotional & behavioral", kw: ["gambling", "gambler", "betting", "bet", "casino", "sports betting"] },
  { code: "CoDA", name: "Co-Dependents Anonymous", group: "Emotional & behavioral", kw: ["codependency", "codependent", "codependence", "relationships", "enabling"] },
  { code: "ACA", name: "Adult Children of Alcoholics & Dysfunctional Families", group: "Emotional & behavioral", kw: ["adult children", "acoa", "aca", "dysfunctional family", "childhood trauma"] },
  { code: "Al-Anon", name: "Al-Anon Family Groups", group: "Family & friends", kw: ["families of alcoholics", "loved ones", "family", "spouse", "partner drinking", "affected by drinking"] },
  { code: "Alateen", name: "Alateen", group: "Family & friends", kw: ["teens", "teenager", "teen", "family", "youth"] },
  { code: "Nar-Anon", name: "Nar-Anon Family Groups", group: "Family & friends", kw: ["families of addicts", "family", "loved one using", "affected by drugs"] },
  { code: "Gam-Anon", name: "Gam-Anon", group: "Family & friends", kw: ["families of gamblers", "family", "affected by gambling"] },
  { code: "Co-Anon", name: "Co-Anon", group: "Family & friends", kw: ["families of addicts", "family", "cocaine", "affected by cocaine"] },
  { code: "FA", name: "Families Anonymous", group: "Family & friends", kw: ["families", "family", "loved ones", "substance abuse"] },
];

export const BY_CODE: Record<string, Fellowship> = Object.fromEntries(FELLOWSHIPS.map((f) => [f.code, f]));
export const fellowshipName = (code: string) => BY_CODE[code]?.name || code;

// Vibrant, WCAG-safe color per fellowship (white text on each). Grouped by family so the
// color hints at the category; unknown codes fall back to a neutral stone.
export const FELLOWSHIP_COLORS: Record<string, string> = {
  AA: "#4F46E5",
  NA: "#0D7D71", CA: "#0369A1", CMA: "#7C3AED", MA: "#15803D", HA: "#BE123C", NicA: "#0E7490", PA: "#4338CA",
  OA: "#C2410C", EDA: "#B45309", FAIR: "#92400E", FAA: "#78350F",
  SLAA: "#E11D48", SAA: "#DB2777", SA: "#BE185D", SCA: "#C026D3", SRA: "#9333EA", SIA: "#7E22CE", COSLAA: "#A21CAF",
  DA: "#0F766E", UA: "#047857", WA: "#0B6E8C", CLA: "#6D28D9",
  EA: "#2563EB", GA: "#DC2626",
  CoDA: "#0670A8", ACA: "#1D4ED8", "Al-Anon": "#075985", Alateen: "#155E75",
  "Nar-Anon": "#1E40AF", "Gam-Anon": "#3730A3", "Co-Anon": "#5B21B6", FA: "#6D28D9",
};
export const fellowshipColor = (code: string) => FELLOWSHIP_COLORS[code] || "#57534E";
export const fellowshipTerms = (code: string) => {
  const f = BY_CODE[code];
  return f ? [f.name, ...f.kw].join(" ") : "";
};
