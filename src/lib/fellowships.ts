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
// Spanish (es) translations of the fellowship description prose. AI-drafted, PENDING native
// recovery-aware review before production. English above stays the default; this overrides on /es.
export const FELLOWSHIP_DESC_ES: Record<string, string> = {
  AA: "Alcohólicos Anónimos es una comunidad mundial de personas que se ayudan entre sí a mantenerse en sobriedad mediante un programa de recuperación de doce pasos para el alcoholismo. Las reuniones son gratuitas y anónimas, y el único requisito para ser miembro es el deseo de dejar de beber.",
  NA: "Narcóticos Anónimos es una comunidad global y de base para personas que se recuperan de la adicción a las drogas, con un programa de doce pasos adaptado de AA. El único requisito para ser miembro es el deseo de dejar de consumir.",
  ACA: "Hijos Adultos de Alcohólicos y Familias Disfuncionales (ACA) es una comunidad de doce pasos para adultos que crecieron en hogares alcohólicos o disfuncionales y quieren recuperarse de sus efectos duraderos. Las reuniones ofrecen un espacio seguro para compartir la experiencia y sanar patrones antiguos.",
  "Al-Anon": "Los Grupos de Familia Al-Anon son una comunidad para las amistades y familias de bebedores problemáticos, que ofrece apoyo mutuo a quienes afecta la bebida de otra persona. Es independiente de AA y se centra en el bienestar propio de cada miembro.",
  Alateen: "Alateen forma parte de Al-Anon y es para personas más jóvenes —por lo general adolescentes— cuya vida se ha visto afectada por la bebida de otra persona. Las reuniones están dirigidas por los propios jóvenes con adultos capacitados como padrinos, y ofrecen un lugar confidencial para compartir.",
  "Nar-Anon": "Nar-Anon es una comunidad de doce pasos para los familiares y las amistades de personas afectadas por la adicción a las drogas de alguien. Como Al-Anon, se centra en la propia recuperación y el apoyo de sus miembros.",
  OA: "Comedores Compulsivos Anónimos es una comunidad para personas que se recuperan del comer compulsivo y de sus conductas con la comida, mediante los doce pasos. No hay cuotas, pesajes ni dietas: solo apoyo compartido.",
  GA: "Jugadores Anónimos es una comunidad de personas que comparten su experiencia para recuperarse de un problema con el juego. El único requisito para ser miembro es el deseo de dejar de jugar.",
  MA: "Marihuana Anónimos es una comunidad de doce pasos para personas que buscan recuperarse de la adicción a la marihuana. Las reuniones son gratuitas y están abiertas a cualquiera que quiera dejar de consumir cannabis.",
  CMA: "Metanfetamina Cristal Anónimos es una comunidad para personas que se recuperan de la adicción a la metanfetamina y a otras sustancias, basada en los doce pasos. Las reuniones dan la bienvenida a cualquiera con el deseo de dejar de consumir.",
  CoDA: "Codependientes Anónimos es una comunidad de doce pasos para personas que trabajan por construir relaciones sanas y funcionales. La membresía está abierta a cualquiera que desee relaciones sanas y afectuosas.",
  SAA: "Sexoadictos Anónimos es una comunidad para personas que se recuperan de la conducta sexual adictiva, mediante los doce pasos. Cada miembro define sus propios límites de sobriedad sexual con el apoyo del grupo.",
  SLAA: "Adictos al Sexo y al Amor Anónimos es una comunidad de doce pasos para personas que se recuperan de patrones de adicción al sexo y al amor, incluidas las relaciones compulsivas y la obsesión romántica. Las reuniones ofrecen apoyo anónimo y sin juicios.",
  SA: "Sexólicos Anónimos es una comunidad de doce pasos para personas que buscan recuperarse de la lujuria y la conducta sexual compulsiva. Las reuniones brindan apoyo mutuo hacia una definición común de sobriedad.",
  DA: "Deudores Anónimos es una comunidad para personas que se recuperan del endeudamiento compulsivo, y usa los doce pasos para construir una relación sana con el dinero. El único requisito para ser miembro es el deseo de dejar de contraer deudas sin garantía.",
  UA: "Subganadores Anónimos es una comunidad de doce pasos para personas que de forma crónica ganan menos de lo que necesitan o de lo que su potencial permite. Las reuniones apoyan a los miembros a cambiar los patrones detrás del subganar.",
  EDA: "Trastornos Alimentarios Anónimos es una comunidad para personas que se recuperan de trastornos alimentarios, y ofrece apoyo de doce pasos hacia el equilibrio, no hacia un peso o una dieta en particular. Cualquier persona con el deseo de recuperarse es bienvenida.",
  NicA: "Nicotina Anónimos es una comunidad de doce pasos que apoya a las personas que quieren vivir libres de nicotina —del cigarrillo, el vapeo y otras formas de tabaco—. Las reuniones dan la bienvenida a cualquiera con el deseo de dejar de consumir nicotina.",
  RD: "Recovery Dharma es una comunidad dirigida por sus propios miembros que usa prácticas y principios budistas —como la meditación y la atención plena— para recuperarse de la adicción de todo tipo. Las reuniones son gratuitas y están abiertas a personas de cualquier trasfondo espiritual o de ninguno.",
  CA: "Cocaína Anónimos es una comunidad de doce pasos para personas que se recuperan de la adicción a la cocaína y a todas las demás sustancias que alteran la mente. A pesar de su nombre, CA da la bienvenida a cualquiera con el deseo de dejar de consumir, sea cual sea la droga.",
  HA: "Heroína Anónimos es una comunidad de doce pasos para personas que se recuperan de la adicción a la heroína y los opioides. Las reuniones son gratuitas y están abiertas a cualquiera con el deseo de mantenerse limpio.",
  PA: "Pastillas Anónimas es una comunidad de doce pasos para personas que se recuperan de la adicción a las pastillas recetadas y de otro tipo. Las reuniones ofrecen apoyo mutuo a cualquiera que quiera dejar de consumir.",
  FAIR: "Adictos a la Comida en Recuperación Anónimos es una comunidad de doce pasos para personas que se recuperan de la adicción a la comida, incluidos el comer compulsivo y la preocupación por la comida. La membresía está abierta a cualquiera que quiera dejar de comer de forma adictiva.",
  FAA: "Adictos a la Comida Anónimos es una comunidad de doce pasos para personas que se recuperan de la adicción a la comida, entendida como una enfermedad que puede detenerse un día a la vez. Las reuniones dan la bienvenida a cualquiera con el deseo de recuperarse.",
  SCA: "Compulsivos Sexuales Anónimos es una comunidad de doce pasos para personas que se recuperan de la compulsión sexual. Cada miembro establece su propia definición de recuperación sexual con el apoyo del grupo.",
  SRA: "Recuperación Sexual Anónimos es una comunidad de doce pasos para personas que buscan recuperarse de la conducta sexual compulsiva. Las reuniones ofrecen apoyo mutuo y anónimo hacia una relación más sana con el sexo.",
  SIA: "Sobrevivientes de Incesto Anónimos es una comunidad de doce pasos para personas adultas sobrevivientes de abuso sexual en la infancia. Las reuniones ofrecen un espacio confidencial y de apoyo para recuperarse de los efectos duraderos del incesto y el abuso.",
  COSLAA: "CoSexoadictos y Adictos al Amor Anónimos (CoSLAA) es una comunidad de doce pasos para personas cuya vida se ha visto afectada por la adicción al sexo y al amor de otra persona. Las reuniones se centran en la propia recuperación de los miembros.",
  WA: "Trabajadores Compulsivos Anónimos es una comunidad de doce pasos para personas que quieren dejar de trabajar de forma compulsiva. Las reuniones apoyan a los miembros a recuperarse del exceso de trabajo y a encontrar equilibrio.",
  CLA: "Acumuladores Anónimos es una comunidad de doce pasos para personas que quieren recuperarse de la acumulación y la desorganización crónica. Las reuniones ofrecen apoyo para despejar el desorden físico, mental y emocional.",
  EA: "Emociones Anónimas es una comunidad de doce pasos para personas que trabajan por su bienestar emocional a través de dificultades como la ansiedad, la depresión y el estrés. Las reuniones están abiertas a cualquiera que quiera estar bien emocionalmente.",
  "Gam-Anon": "Gam-Anon es una comunidad para los cónyuges, familiares y amistades de jugadores compulsivos. Ofrece apoyo mutuo a quienes afecta el juego de otra persona, de forma independiente de Jugadores Anónimos.",
  "Co-Anon": "Co-Anon es una comunidad para las amistades y la familia de personas adictas a la cocaína u otras sustancias. Sus miembros se apoyan entre sí para recuperarse de los efectos de la adicción de un ser querido.",
  FA: "Familias Anónimas es una comunidad de doce pasos para los familiares y las amistades de personas afectadas por el consumo de drogas, el alcohol o problemas de conducta relacionados. Las reuniones apoyan a las familias en su propia recuperación.",
};

export const fellowshipDesc = (code: string, locale?: string) =>
  ((locale === "es" ? FELLOWSHIP_DESC_ES[code] : undefined) ?? FELLOWSHIP_DESC[code]) || "";
