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
export const fellowshipTerms = (code: string) => {
  const f = BY_CODE[code];
  return f ? [f.name, ...f.kw].join(" ") : "";
};
