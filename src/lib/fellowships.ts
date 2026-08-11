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
  { code: "RD", name: "Recovery Dharma", group: "Alcohol & drugs", kw: ["dharma", "buddhist", "buddhism", "meditation", "mindfulness", "recovery dharma"] },
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
  RD: "#A16207",
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

// Reverse lookup: URL slug (code lower-cased) → canonical code.
export const CODE_BY_SLUG: Record<string, string> = Object.fromEntries(
  FELLOWSHIPS.map((f) => [f.code.toLowerCase(), f.code]),
);

// Short, original, factual descriptions — one to two plain sentences per fellowship. Used on the
// fellowship landing pages so every page (including ones Fellow doesn't yet index) carries real,
// unique content rather than boilerplate.
export const FELLOWSHIP_DESC: Record<string, string> = {
  AA: "Alcoholics Anonymous is a worldwide fellowship of people who help one another stay sober through a twelve-step program of recovery from alcoholism. Meetings are free and anonymous, and the only requirement for membership is a desire to stop drinking.",
  NA: "Narcotics Anonymous is a global, community-based fellowship for people recovering from drug addiction, using a twelve-step program adapted from AA. The only requirement for membership is a desire to stop using.",
  ACA: "Adult Children of Alcoholics & Dysfunctional Families is a twelve-step fellowship for adults who grew up in alcoholic or otherwise dysfunctional homes and want to recover from the lasting effects. Meetings offer a safe space to share experience and heal old patterns.",
  "Al-Anon": "Al-Anon Family Groups is a fellowship for the friends and families of problem drinkers, offering mutual support to people affected by someone else's drinking. It is separate from AA and focuses on each member's own wellbeing.",
  Alateen: "Alateen is part of Al-Anon, for younger people — usually teenagers — whose lives have been affected by someone else's drinking. Meetings are peer-led with trained adult sponsors and provide a confidential place to share.",
  "Nar-Anon": "Nar-Anon is a twelve-step fellowship for the relatives and friends of people affected by someone else's addiction to drugs. Like Al-Anon, its focus is the members' own recovery and support.",
  OA: "Overeaters Anonymous is a fellowship for people recovering from compulsive eating and food behaviors, using the twelve steps. There are no dues, weigh-ins, or diets — just shared support.",
  GA: "Gamblers Anonymous is a fellowship of people who share their experience to recover from a gambling problem. The only requirement for membership is a desire to stop gambling.",
  MA: "Marijuana Anonymous is a twelve-step fellowship for people seeking to recover from marijuana addiction. Meetings are free and open to anyone who wants to stop using cannabis.",
  CMA: "Crystal Meth Anonymous is a fellowship for people recovering from addiction to crystal meth and other substances, based on the twelve steps. Meetings welcome anyone with a desire to stop using.",
  CoDA: "Co-Dependents Anonymous is a twelve-step fellowship for people working to build healthy, functioning relationships. Membership is open to anyone with a desire for healthy and loving relationships.",
  SAA: "Sex Addicts Anonymous is a fellowship for people recovering from addictive sexual behavior, using the twelve steps. Members define their own boundaries of sexual sobriety with the group's support.",
  SLAA: "Sex and Love Addicts Anonymous is a twelve-step fellowship for people recovering from patterns of sex and love addiction, including compulsive relationships and romantic obsession. Meetings offer anonymous, judgment-free support.",
  SA: "Sexaholics Anonymous is a twelve-step fellowship for people seeking recovery from lust and compulsive sexual behavior. Meetings provide mutual support toward a shared definition of sobriety.",
  DA: "Debtors Anonymous is a fellowship for people recovering from compulsive debting, using the twelve steps to build a sound relationship with money. The only requirement for membership is a desire to stop incurring unsecured debt.",
  UA: "Underearners Anonymous is a twelve-step fellowship for people who chronically earn less than they need or than their potential allows. Meetings support members in changing the patterns behind underearning.",
  EDA: "Eating Disorders Anonymous is a fellowship for people recovering from eating disorders, offering twelve-step support toward balance rather than a particular weight or diet. Anyone with a desire to recover is welcome.",
  NicA: "Nicotine Anonymous is a twelve-step fellowship supporting people who want to live free of nicotine — from cigarettes, vaping, and other tobacco. Meetings welcome anyone with a desire to stop using nicotine.",
  RD: "Recovery Dharma is a peer-led community that uses Buddhist practices and principles — like meditation and mindfulness — to recover from addiction of all kinds. Meetings are free and open to people of any or no spiritual background.",
  CA: "Cocaine Anonymous is a twelve-step fellowship for people recovering from addiction to cocaine and all other mind-altering substances. Despite its name, CA welcomes anyone with a desire to stop using, whatever the drug.",
  HA: "Heroin Anonymous is a twelve-step fellowship for people recovering from heroin and opioid addiction. Meetings are free and open to anyone with a desire to stay clean.",
  PA: "Pills Anonymous is a twelve-step fellowship for people recovering from addiction to prescription and other pills. Meetings offer mutual support to anyone who wants to stop using.",
  FAIR: "Food Addicts in Recovery Anonymous is a twelve-step fellowship for people recovering from food addiction, including compulsive overeating and preoccupation with food. Membership is open to anyone who wants to stop eating addictively.",
  FAA: "Food Addicts Anonymous is a twelve-step fellowship for people recovering from food addiction, treating it as a disease that can be arrested one day at a time. Meetings welcome anyone with a desire to recover.",
  SCA: "Sexual Compulsives Anonymous is a twelve-step fellowship for people recovering from sexual compulsion. Members set their own definition of sexual recovery with the group's support.",
  SRA: "Sexual Recovery Anonymous is a twelve-step fellowship for people seeking recovery from compulsive sexual behavior. Meetings provide anonymous, mutual support toward a healthier relationship with sex.",
  SIA: "Survivors of Incest Anonymous is a twelve-step fellowship for adult survivors of childhood sexual abuse. Meetings offer a confidential, supportive space to recover from the lasting effects of incest and abuse.",
  COSLAA: "CoSex and Love Addicts Anonymous is a twelve-step fellowship for people whose lives have been affected by another person's sex and love addiction. Meetings focus on the members' own recovery.",
  WA: "Workaholics Anonymous is a twelve-step fellowship for people who want to stop working compulsively. Meetings support members in recovering from overwork and finding balance.",
  CLA: "Clutterers Anonymous is a twelve-step fellowship for people who want to recover from cluttering and chronic disorganization. Meetings offer support in clearing physical, mental, and emotional clutter.",
  EA: "Emotions Anonymous is a twelve-step fellowship for people working toward emotional wellbeing through struggles like anxiety, depression, and stress. Meetings are open to anyone who wants to become well emotionally.",
  "Gam-Anon": "Gam-Anon is a fellowship for the spouses, family, and friends of compulsive gamblers. It offers mutual support to people affected by someone else's gambling, separate from Gamblers Anonymous.",
  "Co-Anon": "Co-Anon is a fellowship for the friends and family of people addicted to cocaine or other substances. Members support one another in recovering from the effects of a loved one's addiction.",
  FA: "Families Anonymous is a twelve-step fellowship for the relatives and friends of people affected by drug use, alcohol, or related behavioral problems. Meetings support families in their own recovery.",
};
export const fellowshipDesc = (code: string) => FELLOWSHIP_DESC[code] || "";
