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
  short?: string;       // short label for chips (set by the localizer; EN strips the h1 suffix)
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

// ---- Spanish (es) translations ------------------------------------------------------------
// AI-drafted; PENDING native, recovery-aware review before this ships to production (see the
// i18n guardrail). English above stays the source of truth; these override only at render time
// for /es. `notes` are keyed by fellowship code (a code's blurb can differ per problem).
type ProblemES = {
  h1: string; title: string; description: string; lede: string; short: string;
  keywords: string[]; notes: Record<string, string>;
};

const ES: Record<string, ProblemES> = {
  alcohol: {
    h1: "Grupos de apoyo para el alcohol",
    title: "Grupos de apoyo para el alcohol cerca de ti y en línea | Ayuda para dejar de beber",
    description: "¿No sabes por dónde empezar con la bebida? Encuentra el grupo de apoyo entre pares adecuado: Alcohólicos Anónimos para ti, o Al-Anon y Alateen si te afecta la bebida de otra persona.",
    lede: "Si la bebida se ha vuelto un problema —para ti o para alguien que quieres— hay un grupo de apoyo entre pares para eso. Alcohólicos Anónimos (AA) es para quienes quieren dejar de beber; Al-Anon y Alateen son para las familias y amistades afectadas por la forma de beber de otra persona.",
    short: "Alcohol",
    keywords: ["grupos de apoyo para el alcohol cerca de mí", "ayuda para dejar de beber", "AA o Al-Anon", "apoyo para familias de un alcohólico"],
    notes: {
      AA: "Para cualquier persona con el deseo de dejar de beber.",
      "Al-Anon": "Para familiares y amistades afectados por la bebida de alguien.",
      Alateen: "Para jóvenes afectados por la bebida de alguien.",
    },
  },
  drugs: {
    h1: "Grupos de apoyo para la adicción a las drogas",
    title: "Grupos de apoyo para la adicción a las drogas cerca de ti y en línea",
    description: "Encuentra reuniones de apoyo entre pares para la adicción a las drogas: Narcóticos Anónimos para la recuperación de cualquier droga, y Nar-Anon y Familias Anónimas para quienes afecta el consumo de un ser querido.",
    lede: "Narcóticos Anónimos (NA) es para la recuperación de la adicción a las drogas de cualquier tipo, no solo los narcóticos. Si quien consume es un ser querido, Nar-Anon y Familias Anónimas son para los familiares y las amistades afectados.",
    short: "Drogas",
    keywords: ["grupos de apoyo para la adicción a las drogas cerca de mí", "narcóticos anónimos", "apoyo para familias de un adicto", "ayuda para la adicción a las drogas"],
    notes: {
      NA: "Recuperación de la adicción a las drogas de cualquier tipo.",
      "Nar-Anon": "Para familiares y amistades afectados por el consumo de drogas de alguien.",
      FA: "Familias Anónimas: para familias preocupadas por los problemas de drogas, alcohol o conducta de un ser querido.",
    },
  },
  "opioids-and-heroin": {
    h1: "Grupos de apoyo para la heroína y los opioides",
    title: "Grupos de apoyo para la heroína y los opioides cerca de ti y en línea",
    description: "Encuentra apoyo entre pares para la recuperación de la heroína y los opioides: Heroína Anónimos se centra en los opioides, y Narcóticos Anónimos abarca la adicción a las drogas de forma más amplia.",
    lede: "Heroína Anónimos (HA) se centra específicamente en la recuperación de la heroína y los opioides, mientras que Narcóticos Anónimos (NA) es para la adicción a las drogas de cualquier tipo. Ambos usan el mismo apoyo entre pares de 12 pasos, así que prueba el que se ajuste a tu experiencia.",
    short: "Heroína y opioides",
    keywords: ["grupos de apoyo para la heroína", "reuniones de recuperación de opioides", "heroína anónimos cerca de mí", "apoyo para la adicción a los opioides"],
    notes: {
      HA: "Centrado en la recuperación de la heroína y los opioides.",
      NA: "Recuperación más amplia de la adicción a las drogas.",
      "Nar-Anon": "Para familiares y amistades afectados por el consumo de drogas de alguien.",
      FA: "Familias Anónimas: para las familias de un ser querido que está luchando.",
    },
  },
  cocaine: {
    h1: "Grupos de apoyo para la cocaína",
    title: "Grupos de apoyo para la cocaína cerca de ti y en línea | CA",
    description: "Encuentra reuniones de recuperación de la cocaína: Cocaína Anónimos para tu propia recuperación, y Co-Anon para familiares y amistades afectados por el consumo de cocaína de alguien.",
    lede: "Cocaína Anónimos (CA) es para cualquier persona que quiera dejar de consumir cocaína y otras sustancias. Si te afecta el consumo de cocaína de otra persona, Co-Anon es la comunidad para familiares y amistades.",
    short: "Cocaína",
    keywords: ["grupos de apoyo para la cocaína", "cocaína anónimos cerca de mí", "apoyo para la adicción al crack", "apoyo para familias de un adicto a la cocaína"],
    notes: {
      CA: "Para cualquier persona que quiera dejar de consumir cocaína y otras sustancias.",
      "Co-Anon": "Para familiares y amistades afectados por el consumo de cocaína de alguien.",
    },
  },
  marijuana: {
    h1: "Grupos de apoyo para la marihuana y el cannabis",
    title: "Grupos de apoyo para la marihuana cerca de ti y en línea | Cannabis",
    description: "Encuentra reuniones de Marihuana Anónimos para cualquier persona que quiera dejar de consumir cannabis, en persona y en línea.",
    lede: "Marihuana Anónimos (MA) es una comunidad de 12 pasos para cualquier persona que quiera dejar de consumir cannabis. «Marihuana», «cannabis» y «hierba» apuntan al mismo lugar: no necesitas una etiqueta en particular para venir.",
    short: "Marihuana",
    keywords: ["grupos de apoyo para la marihuana", "grupo de apoyo para la adicción a la hierba", "ayuda para la adicción al cannabis", "marihuana anónimos cerca de mí"],
    notes: {
      MA: "Para cualquier persona que quiera dejar de consumir cannabis.",
    },
  },
  "crystal-meth": {
    h1: "Grupos de apoyo para la metanfetamina",
    title: "Grupos de apoyo para la metanfetamina cerca de ti y en línea | CMA",
    description: "Encuentra reuniones de Metanfetamina Cristal Anónimos para la recuperación de la metanfetamina y otras sustancias, en persona y en línea.",
    lede: "Metanfetamina Cristal Anónimos (CMA) se centra en la recuperación de la metanfetamina y otras sustancias que alteran la mente. Su único requisito es el deseo de dejar de consumir.",
    short: "Metanfetamina",
    keywords: ["grupos de apoyo para la metanfetamina", "reuniones para la adicción a la metanfetamina", "metanfetamina cristal anónimos cerca de mí"],
    notes: {
      CMA: "Recuperación de la metanfetamina y otras sustancias.",
    },
  },
  "nicotine-and-vaping": {
    h1: "Grupos de apoyo para la nicotina, el tabaco y el vapeo",
    title: "Grupos de apoyo para la nicotina y el vapeo cerca de ti y en línea | Dejar de fumar",
    description: "Encuentra reuniones de Nicotina Anónimos para vivir libre de nicotina —tabaco, vapeo y otras formas— en persona y en línea.",
    lede: "Nicotina Anónimos (NicA) es una comunidad de apoyo entre pares para vivir libre de nicotina en cualquier forma, incluidos el tabaco y el vapeo. Muchas personas la usan junto con otras herramientas para dejarlo.",
    short: "Nicotina y vapeo",
    keywords: ["grupo de apoyo para dejar de fumar", "nicotina anónimos cerca de mí", "apoyo para la adicción al vapeo", "reuniones para dejar de fumar"],
    notes: {
      NicA: "Para vivir libre de nicotina: tabaco o vapeo.",
    },
  },
  "prescription-pills": {
    h1: "Grupos de apoyo para los medicamentos recetados",
    title: "Grupos de apoyo para las pastillas recetadas cerca de ti y en línea | PA",
    description: "Encuentra reuniones de Pastillas Anónimas para la recuperación de la adicción a las pastillas, recetadas o no. Consulta a un médico antes de cambiar una receta.",
    lede: "Pastillas Anónimas (PA) es para cualquier persona que quiera dejar de consumir pastillas, recetadas o no. Una nota importante: algunos medicamentos no deben suspenderse de golpe, así que consulta a un médico antes de cambiar una receta.",
    short: "Medicamentos recetados",
    keywords: ["grupo de apoyo para la adicción a las pastillas", "grupo de apoyo para medicamentos recetados", "pastillas anónimas cerca de mí", "ayuda para la adicción a los analgésicos"],
    notes: {
      PA: "Recuperación de la adicción a las pastillas, recetadas o no.",
    },
  },
  gambling: {
    h1: "Grupos de apoyo para el juego",
    title: "Grupos de apoyo para el juego cerca de ti y en línea | Ayuda para la ludopatía",
    description: "Encuentra ayuda para la ludopatía: Jugadores Anónimos para tu propia recuperación, y Gam-Anon para familiares y amistades afectados por el juego de alguien.",
    lede: "Jugadores Anónimos (GA) es para las personas que quieren recuperarse de su propio juego. Si es el juego de un ser querido lo que te afecta, Gam-Anon es la comunidad para familiares y amistades.",
    short: "Juego",
    keywords: ["grupos de apoyo para el juego cerca de mí", "jugadores anónimos", "ayuda para la ludopatía", "apoyo para familias de un jugador"],
    notes: {
      GA: "Para tu propia recuperación del juego compulsivo.",
      "Gam-Anon": "Para familiares y amistades afectados por el juego de alguien.",
    },
  },
  "food-and-eating": {
    h1: "Grupos de apoyo para la comida y la alimentación",
    title: "Grupos de apoyo para la comida y la alimentación cerca de ti y en línea",
    description: "Encuentra reuniones de apoyo entre pares para la comida y la alimentación: Comedores Compulsivos Anónimos, Trastornos Alimentarios Anónimos y las dos comunidades de adicción a la comida. El apoyo entre pares complementa la atención profesional.",
    lede: "Varias comunidades apoyan la recuperación en torno a la comida y la alimentación, y adoptan enfoques distintos, así que vale la pena leer sobre cada una y probar la reunión que encaje. El apoyo entre pares complementa la atención profesional para un trastorno alimentario, no la reemplaza.",
    short: "Comida y alimentación",
    keywords: ["grupo de apoyo para el comer compulsivo", "grupo de apoyo para el atracón", "reuniones para la adicción a la comida", "comedores compulsivos anónimos cerca de mí", "grupos de apoyo para trastornos alimentarios"],
    notes: {
      OA: "Comer compulsivo y relaciones poco sanas con la comida.",
      EDA: "Recuperación de un trastorno alimentario (complementa la atención profesional).",
      FAIR: "Adictos a la Comida en Recuperación Anónimos: recuperación de la adicción a la comida.",
      FAA: "Adictos a la Comida Anónimos: una comunidad aparte para la adicción a la comida.",
    },
  },
  "sex-and-pornography": {
    h1: "Grupos de apoyo para el sexo y la pornografía",
    title: "Grupos de apoyo para la adicción al sexo y la pornografía cerca de ti y en línea",
    description: "Encuentra comunidades confidenciales de apoyo entre pares para la conducta sexual compulsiva —SAA, SA, SCA y SRA— además de COSLAA para quienes afecta la conducta de otra persona.",
    lede: "Varias comunidades de 12 pasos, separadas entre sí, apoyan la recuperación de la conducta sexual compulsiva, con distinta literatura y definiciones de sobriedad. La mejor opción suele ser aquella con cuyas reuniones y lenguaje te identifiques. Si es la conducta de otra persona lo que te afecta, COSLAA es para parejas y familiares.",
    short: "Sexo y pornografía",
    keywords: ["grupo de apoyo para la adicción al sexo", "apoyo para la adicción a la pornografía", "reuniones para la conducta sexual compulsiva", "sexoadictos anónimos cerca de mí"],
    notes: {
      SAA: "Sexoadictos Anónimos: tú defines las conductas que quieres cambiar.",
      SA: "Sexólicos Anónimos: usa una definición de sobriedad común a toda la comunidad.",
      SCA: "Compulsivos Sexuales Anónimos.",
      SRA: "Recuperación Sexual Anónimos: tiene su propia definición de sobriedad.",
      COSLAA: "Para quienes afecta la adicción al sexo o al amor de otra persona.",
    },
  },
  "love-and-relationships": {
    h1: "Grupos de apoyo para el amor y las relaciones",
    title: "Grupos de apoyo para la adicción al amor y las relaciones cerca de ti y en línea",
    description: "Encuentra apoyo entre pares para los patrones en torno al amor y las relaciones: Adictos al Sexo y al Amor Anónimos, además de Codependientes Anónimos para los patrones de relación codependientes.",
    lede: "Adictos al Sexo y al Amor Anónimos (SLAA) se organiza en torno a patrones tanto de sexo como de amor, incluidas las relaciones obsesivas y la fijación romántica. Si el patrón tiene más que ver con perderte en las relaciones y con la dificultad para poner límites, Codependientes Anónimos (CoDA) puede encajar.",
    short: "Amor y relaciones",
    keywords: ["reuniones para la adicción al amor", "apoyo para la adicción a las relaciones", "SLAA cerca de mí", "grupo de apoyo para la codependencia"],
    notes: {
      SLAA: "Patrones de adicción al sexo y al amor, incluidas las relaciones.",
      CoDA: "Patrones de relación codependientes y límites sanos.",
    },
  },
  codependency: {
    h1: "Grupos de apoyo para la codependencia",
    title: "Grupos de apoyo para la codependencia cerca de ti y en línea | CoDA",
    description: "Encuentra reuniones de Codependientes Anónimos para desarrollar relaciones sanas, además de ACA para adultos marcados por haber crecido en una familia disfuncional.",
    lede: "Codependientes Anónimos (CoDA) es para las personas que trabajan hacia relaciones sanas y equilibradas: con límites, y consigo mismas. Si los patrones se remontan a haber crecido en una familia disfuncional, ACA también puede encajar.",
    short: "Codependencia",
    keywords: ["grupo de apoyo para la codependencia", "codependientes anónimos cerca de mí", "apoyo para relaciones sanas", "hijos adultos de alcohólicos"],
    notes: {
      CoDA: "Desarrollar relaciones sanas y equilibradas.",
      ACA: "Para adultos marcados por haber crecido en una familia disfuncional.",
    },
  },
  "money-work-and-clutter": {
    h1: "Grupos de apoyo para el dinero, el trabajo y el desorden",
    title: "Grupos de apoyo para el dinero, el trabajo y el desorden cerca de ti y en línea",
    description: "Encuentra apoyo entre pares para el dinero, el trabajo y el desorden: Deudores Anónimos, Subganadores Anónimos, Trabajadores Compulsivos Anónimos y Acumuladores Anónimos.",
    lede: "Algunas comunidades apoyan la recuperación en torno al dinero, el trabajo y las posesiones: el endeudamiento compulsivo, el subganar, el exceso de trabajo y el desorden. Son apoyo entre pares, no asesoría financiera, fiscal ni legal.",
    short: "Dinero, trabajo y desorden",
    keywords: ["grupo de apoyo para las deudas", "recuperación del gasto compulsivo", "trabajadores compulsivos anónimos", "grupo de apoyo para el desorden", "subganadores anónimos"],
    notes: {
      DA: "Deudores Anónimos: endeudamiento compulsivo y patrones con el dinero.",
      UA: "Subganadores Anónimos: el subganar y el uso del tiempo y las oportunidades.",
      WA: "Trabajadores Compulsivos Anónimos: trabajar de forma compulsiva y el exceso de trabajo.",
      CLA: "Acumuladores Anónimos: el desorden y la desorganización crónica.",
    },
  },
  "emotional-wellbeing": {
    h1: "Grupos de apoyo para el bienestar emocional",
    title: "Grupos de apoyo emocional cerca de ti y en línea | Emociones Anónimas",
    description: "Encuentra reuniones de Emociones Anónimas: apoyo entre pares para el bienestar emocional, incluidos la ansiedad, la depresión y el estrés. No es terapia ni atención de crisis; funciona junto con el apoyo profesional.",
    lede: "Emociones Anónimas (EA) es una comunidad de apoyo entre pares de 12 pasos para el bienestar emocional, para personas que lidian con cosas como la ansiedad, la depresión o el estrés. No es terapia ni atención de crisis, y funciona bien junto con el apoyo profesional.",
    short: "Bienestar emocional",
    keywords: ["grupos de apoyo emocional", "grupo de apoyo para la ansiedad", "apoyo entre pares para la depresión", "emociones anónimas cerca de mí"],
    notes: {
      EA: "Apoyo entre pares para el bienestar emocional.",
    },
  },
  "family-of-someone-struggling": {
    h1: "Apoyo cuando alguien que quieres está luchando",
    title: "Grupos de apoyo para familias y amistades de alguien que está luchando",
    description: "No tienes que esperar a que un ser querido busque ayuda para conseguir apoyo propio. Encuentra la comunidad adecuada para familiares y amistades: Al-Anon, Nar-Anon, Familias Anónimas, Co-Anon o Gam-Anon.",
    lede: "Puedes conseguir apoyo para ti, esté o no lista para cambiar la persona que te preocupa. Existen varias comunidades específicamente para familiares y amistades; la adecuada depende de aquello a lo que se enfrenta tu ser querido.",
    short: "Cuando alguien que quieres lucha",
    keywords: ["apoyo para familias de un adicto", "ayuda para padres de un adicto", "apoyo para cónyuges de un alcohólico", "apoyo familiar para la adicción", "apoyo cuando un ser querido no busca ayuda"],
    notes: {
      "Al-Anon": "Afectados por la bebida de alguien.",
      "Nar-Anon": "Afectados por el consumo de drogas de alguien.",
      FA: "Familias Anónimas: problemas de drogas, alcohol o conducta relacionados.",
      "Co-Anon": "Afectados por el consumo de cocaína u otra sustancia de alguien.",
      "Gam-Anon": "Afectados por el juego de alguien.",
    },
  },
};

function localizeProblem(p: Problem, o: ProblemES): Problem {
  const tr = (r: Route): Route => ({ code: r.code, note: o.notes[r.code] ?? r.note });
  return {
    ...p,
    h1: o.h1, title: o.title, description: o.description, lede: o.lede, short: o.short, keywords: o.keywords,
    self: p.self.map(tr),
    affected: p.affected?.map(tr),
  };
}

// Locale-aware accessors. English stays the default; `es` applies the overrides above.
export function getProblems(locale?: string): Problem[] {
  if (locale !== "es") return PROBLEMS;
  return PROBLEMS.map((p) => (ES[p.slug] ? localizeProblem(p, ES[p.slug]) : p));
}
export function getProblem(slug: string, locale?: string): Problem | undefined {
  const p = PROBLEM_BY_SLUG[slug];
  if (!p) return undefined;
  return locale === "es" && ES[p.slug] ? localizeProblem(p, ES[p.slug]) : p;
}
