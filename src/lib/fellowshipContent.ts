// Per-fellowship SEO metadata + fellowship-specific FAQ extras.
//
// Sourced from a commissioned SEO deliverable and adapted to Fellow's guardrails:
//   • No builder-facing notes, no misleading "use our filter" claims for fellowships we don't
//     index — the honest online/near-me answers are generated dynamically on the page instead.
//   • These EXTRA_FAQS are about each FELLOWSHIP itself (scope + "how is X different from Y?"),
//     which is stable, honest, and doubles as "which support group is right for me?" routing.
//   • Warm, plain, conversational voice; nothing here diagnoses or promises recovery.
// Keyed by Fellow's internal codes (note: FAIR = Food Addicts in Recovery Anonymous;
// FA = Families Anonymous).

export type FaqItem = { q: string; a: string };

export const SEO: Record<string, { title: string; description: string }> = {
  AA: { title: "AA Meetings Near Me & Online | Alcoholics Anonymous", description: "Find Alcoholics Anonymous (AA) meetings near you, including in-person and online meetings. Learn what AA is, who can attend, and what to expect." },
  NA: { title: "NA Meetings Near Me & Online | Narcotics Anonymous", description: "Find Narcotics Anonymous (NA) meetings near you or online. Search local meetings and learn what to expect at your first NA meeting." },
  CA: { title: "Cocaine Anonymous Meetings Near Me & Online | CA", description: "Find Cocaine Anonymous (CA) meetings near you and online. Explore local recovery meetings, virtual options, and information for newcomers." },
  HA: { title: "Heroin Anonymous Meetings Near Me & Online | HA", description: "Find Heroin Anonymous (HA) meetings near you and online, with meeting information and resources for people seeking recovery from heroin addiction." },
  MA: { title: "Marijuana Anonymous Meetings Near Me & Online | MA", description: "Find Marijuana Anonymous (MA) meetings near you or online and learn what to expect from a marijuana recovery support meeting." },
  CMA: { title: "Crystal Meth Anonymous Meetings Near Me & Online | CMA", description: "Find Crystal Meth Anonymous (CMA) meetings near you and online. Search local meth recovery meetings and newcomer-friendly options." },
  NicA: { title: "Nicotine Anonymous Meetings Near Me & Online | NicA", description: "Find Nicotine Anonymous meetings near you or online for people seeking peer support around nicotine, smoking, vaping, and tobacco use." },
  PA: { title: "Pills Anonymous Meetings Near Me & Online | PA", description: "Find Pills Anonymous (PA) meetings near you and virtual meetings for people seeking peer support for recovery from pill addiction." },
  RD: { title: "Recovery Dharma Meetings Near Me & Online", description: "Find Recovery Dharma meetings near you and online. Explore Buddhist-inspired recovery meetings using meditation, mindfulness, and community support." },
  OA: { title: "Overeaters Anonymous Meetings Near Me & Online | OA", description: "Find Overeaters Anonymous (OA) meetings near you and online for people seeking peer support around compulsive eating and problems with food." },
  EDA: { title: "Eating Disorders Anonymous Meetings Near Me | EDA", description: "Find Eating Disorders Anonymous (EDA) meetings near you and online, plus information for newcomers seeking peer recovery support." },
  FAIR: { title: "Food Addicts in Recovery Anonymous Meetings Near Me", description: "Find Food Addicts in Recovery Anonymous (FA) meetings near you and online. Explore meeting options and information for newcomers." },
  FAA: { title: "Food Addicts Anonymous Meetings Near Me & Online | FAA", description: "Find Food Addicts Anonymous (FAA) meetings near you or online and learn about peer support for people seeking recovery from food addiction." },
  SAA: { title: "Sex Addicts Anonymous Meetings Near Me & Online | SAA", description: "Find Sex Addicts Anonymous (SAA) meetings near you or online for people seeking confidential peer support for compulsive sexual behavior." },
  SA: { title: "Sexaholics Anonymous Meetings Near Me & Online | SA", description: "Find Sexaholics Anonymous (SA) meetings near you and online. Explore local meeting options and information for newcomers." },
  SLAA: { title: "SLAA Meetings Near Me & Online | Sex & Love Addiction", description: "Find Sex and Love Addicts Anonymous (SLAA) meetings near you and online for support with patterns involving sex, love, and relationships." },
  SCA: { title: "Sexual Compulsives Anonymous Meetings Near Me | SCA", description: "Find Sexual Compulsives Anonymous (SCA) meetings near you and online, plus newcomer information and local meeting options." },
  SRA: { title: "Sexual Recovery Anonymous Meetings Near Me | SRA", description: "Find Sexual Recovery Anonymous (SRA) meetings near you and online for people seeking recovery from compulsive sexual behavior." },
  COSLAA: { title: "CoSex and Love Addicts Anonymous Meetings | COSLAA", description: "Find COSLAA information and support options for people affected by another person's sex or love addiction, including available local or online resources." },
  SIA: { title: "Survivors of Incest Anonymous Meetings Near Me | SIA", description: "Find Survivors of Incest Anonymous (SIA) meetings, including online meetings, for adults seeking peer support after childhood sexual abuse or incest." },
  DA: { title: "Debtors Anonymous Meetings Near Me & Online | DA", description: "Find Debtors Anonymous (DA) meetings near you and online for people seeking peer support around debt and compulsive financial behaviors." },
  UA: { title: "Underearners Anonymous Meetings Near Me & Online | UA", description: "Find Underearners Anonymous (UA) meetings near you and online. Explore peer-support meetings addressing underearning and work-related patterns." },
  WA: { title: "Workaholics Anonymous Meetings Near Me & Online | WA", description: "Find Workaholics Anonymous meetings near you and online for people seeking peer support around compulsive working and unhealthy work patterns." },
  CLA: { title: "Clutterers Anonymous Meetings Near Me & Online | CLA", description: "Find Clutterers Anonymous (CLA) meetings near you and online for peer support around clutter and difficulty managing possessions and space." },
  EA: { title: "Emotions Anonymous Meetings Near Me & Online | EA", description: "Find Emotions Anonymous (EA) meetings near you or online. Search local peer-support meetings and information for newcomers." },
  GA: { title: "Gamblers Anonymous Meetings Near Me & Online | GA", description: "Find Gamblers Anonymous (GA) meetings near you and online for people seeking peer support for problem or compulsive gambling." },
  CoDA: { title: "CoDA Meetings Near Me & Online | Co-Dependents Anonymous", description: "Find Co-Dependents Anonymous (CoDA) meetings near you or online for people seeking peer support around codependent relationship patterns." },
  ACA: { title: "ACA Meetings Near Me & Online | Adult Children", description: "Find ACA meetings near you and online for adults affected by growing up with alcoholism or family dysfunction. Explore local meetings and newcomer information." },
  "Al-Anon": { title: "Al-Anon Meetings Near Me & Online | Family Support", description: "Find Al-Anon meetings near you and online for family members and friends affected by another person's drinking. Explore local and virtual meetings." },
  Alateen: { title: "Alateen Meetings Near Me & Online | Teen Family Support", description: "Find Alateen meetings near you and online for young people affected by another person's drinking, with local meeting and newcomer information." },
  "Nar-Anon": { title: "Nar-Anon Meetings Near Me & Online | Family Support", description: "Find Nar-Anon meetings near you and online for family members and friends affected by another person's drug use or addiction." },
  "Gam-Anon": { title: "Gam-Anon Meetings Near Me & Online | Gambling Family Support", description: "Find Gam-Anon meetings for family members and friends affected by another person's gambling. Search local and online meeting options." },
  "Co-Anon": { title: "Co-Anon Meetings Near Me & Online | Family Support", description: "Find Co-Anon meetings and peer support for family members and friends affected by another person's cocaine or other substance addiction." },
  FA: { title: "Families Anonymous Meetings Near Me & Online", description: "Find Families Anonymous meetings near you and online for family members and friends concerned about a loved one's drug, alcohol, or related behavioral problems." },
};

// Fellowship-specific FAQs — scope ("is it only for…?") and comparison ("how is X different
// from Y?"). Adapted into Fellow's voice; honest, warm, non-diagnostic. These render in the
// accordion alongside the page's dynamically generated free/online/secular questions.
export const EXTRA_FAQS: Record<string, FaqItem[]> = {
  AA: [
    { q: "Do I have to call myself an alcoholic to go to AA?", a: "No — you don't need a diagnosis or a label. Closed meetings are for anyone with a desire to stop drinking; open meetings welcome visitors too. Check whether a meeting is listed as open or closed, and come as you are." },
  ],
  NA: [
    { q: "Is NA only for people addicted to narcotics?", a: "Despite the name, NA isn't limited to narcotics or opioids — it's for anyone for whom drugs have become a problem, whatever the substance. The only requirement is a desire to stop using." },
  ],
  CA: [
    { q: "Is Cocaine Anonymous only for cocaine or crack?", a: "No — CA is for anyone who wants to stop using cocaine and other mind-altering substances, so cocaine doesn't have to be your only struggle to belong." },
  ],
  HA: [
    { q: "How is Heroin Anonymous different from NA?", a: "HA centers specifically on recovery from heroin and opioids, while NA is for drug addiction of any kind. If heroin has been your main struggle you might feel more at home in HA — but both use the same 12-step peer support, so it's worth trying whichever fits." },
  ],
  MA: [
    { q: "Is Marijuana Anonymous for weed or cannabis?", a: "Yes — “marijuana,” “cannabis,” and “weed” all point to the same place. MA is for anyone who wants to stop using cannabis; you don't need a particular label to come." },
  ],
  CMA: [
    { q: "Is CMA only for people recovering from crystal meth?", a: "CMA centers on recovery from crystal meth, and that shared experience is why many people come — its only requirement is a desire to stop using. If meth isn't central for you, NA or CA might fit better." },
  ],
  NicA: [
    { q: "Can Nicotine Anonymous help if I vape?", a: "Yes — NicA is about living free of nicotine in any form, including vaping and smoking. It's peer support, so people often use it alongside other quit tools." },
  ],
  PA: [
    { q: "Is Pills Anonymous for prescription drugs?", a: "Yes — PA is for anyone who wants to stop using pills, prescription or otherwise. One important note: some medications shouldn't be stopped suddenly, so talk to a doctor before changing a prescription." },
  ],
  RD: [
    { q: "Do I need to be Buddhist for Recovery Dharma?", a: "No. RD draws on Buddhist practices like meditation and mindfulness, but you don't need any background or belief — newcomer meetings introduce the ideas gently." },
    { q: "Is Recovery Dharma an alternative to 12-step programs?", a: "It's its own peer-led program inspired by Buddhism, not a modified AA meeting. Some people attend it alongside other recovery support if that combination helps." },
  ],
  OA: [
    { q: "Is OA only for overeating?", a: "No — OA is for anyone with an unhealthy relationship with food, including bingeing, restricting, or other patterns. There are no weigh-ins, and it's peer support, so it can sit alongside professional care." },
  ],
  EDA: [
    { q: "Who can attend an EDA meeting?", a: "EDA is open to anyone with a desire to recover from an eating disorder. Because eating disorders can be medically serious, it's meant to complement professional treatment, not replace it." },
  ],
  FAIR: [
    { q: "What's the difference between FA and Overeaters Anonymous?", a: "Both are 12-step food-recovery fellowships, but separate organizations with their own literature and practices. Food Addicts in Recovery Anonymous frames it as recovery from food addiction; OA uses broader language about compulsive eating. Reading both and trying a meeting is the best way to tell which fits." },
  ],
  FAA: [
    { q: "How is FAA different from Food Addicts in Recovery Anonymous?", a: "Food Addicts Anonymous (FAA) and Food Addicts in Recovery Anonymous (FA) are different organizations with similar names — each has its own food plan and practices. If you're unsure, read both and try whichever meeting fits your situation." },
  ],
  SAA: [
    { q: "How do I know if SAA is right for me?", a: "You don't need to diagnose yourself first. SAA is for anyone who feels their sexual behavior has become hard to control or is causing harm, and who wants support changing it. Reading the newcomer information and trying a meeting can help you decide." },
  ],
  SA: [
    { q: "What does “sexual sobriety” mean in SA?", a: "SA uses its own fellowship-wide definition of sexual sobriety, which is more specific than the definitions some other fellowships use. If that matters to you, it's best to read SA's own statement directly." },
    { q: "What's the difference between SA and SAA?", a: "Both are 12-step, but SA uses one shared definition of sobriety while SAA leaves more of that to each member's own recovery plan. Their cultures and literature differ, so try the one whose approach fits you." },
  ],
  SLAA: [
    { q: "Is SLAA for love and relationship addiction too?", a: "Yes — SLAA is organized around patterns of both sex and love, including obsessive relationships and romantic fixation, so you don't need to fit one label to come." },
    { q: "How is SLAA different from SAA?", a: "SLAA explicitly includes love and relationship patterns; SAA focuses on compulsive sexual behavior. Both are 12-step, but their language and way of defining recovery differ." },
  ],
  SCA: [
    { q: "How is SCA different from SAA or SA?", a: "All three are separate 12-step fellowships for sexual-behavior recovery, with different literature and approaches to sobriety. The best fit is usually the one whose meetings and language you identify with." },
  ],
  SRA: [
    { q: "How is SRA different from SAA, SA, and SLAA?", a: "All are separate 12-step fellowships, but their focus and definitions of recovery differ — SLAA includes love and relationships, SA uses one shared sobriety definition, and SRA has its own definition and literature. SRA is smaller, so an online meeting can help if there's nothing nearby." },
  ],
  COSLAA: [
    { q: "Is there support for partners of a sex or love addict?", a: "Yes — COSLAA is for people affected by someone else's sex or love addiction. It's a small fellowship with limited central listings, so confirm any meeting is current; if you can't find one, other partner- and family-support fellowships may help." },
    { q: "What's the difference between COSLAA and SLAA?", a: "SLAA is for your own patterns of sex and love addiction; COSLAA is for the impact of someone else's. “Help for my behavior” versus “help because of someone else's” is the simplest way to tell them apart." },
  ],
  SIA: [
    { q: "Who is Survivors of Incest Anonymous for?", a: "SIA is a peer-support fellowship for adult survivors of childhood sexual abuse and incest. You can start simply by listening. Because these conversations can be heavy, some people also seek professional trauma support alongside meetings." },
  ],
  DA: [
    { q: "Is Debtors Anonymous only for people with large debts?", a: "No — DA is about compulsive debting and patterns around money, not a particular dollar amount. Overspending, borrowing, or avoidance can all bring people in. It's peer support, not legal, tax, or financial advice." },
  ],
  UA: [
    { q: "What does “underearning” mean in UA?", a: "In UA, underearning is broader than a low salary — it can include underusing your abilities, avoiding opportunities, or trouble earning enough to meet your needs. It's the fellowship's own idea, not a diagnosis." },
    { q: "How is UA different from Debtors Anonymous?", a: "UA focuses on underearning and how you use time, work, and opportunity; DA focuses on compulsive debting. They overlap, and some people relate to both, but they're separate fellowships." },
  ],
  WA: [
    { q: "How do I know if I might be a workaholic?", a: "You don't need a diagnosis. WA is for people who find work compulsive, always urgent, hard to switch off from, or harmful to health and relationships. A clinician may help too if stress or burnout also needs care." },
  ],
  CLA: [
    { q: "Is Clutterers Anonymous the same as a hoarding support group?", a: "Not exactly — CLA is a 12-step peer fellowship for people who struggle with clutter, while hoarding disorder is a clinical diagnosis. Some people find CLA helpful, but it doesn't diagnose or treat a disorder; professional help is a separate path." },
  ],
  EA: [
    { q: "Who can attend Emotions Anonymous?", a: "EA is a peer-support fellowship for emotional wellbeing — for people dealing with things like anxiety, depression, or stress. It isn't therapy or crisis care, and it works well alongside professional support." },
  ],
  GA: [
    { q: "How do I know if I have a gambling problem?", a: "You don't need to settle on a diagnosis first. If gambling, sports betting, or casino play is causing money, relationship, or emotional problems and stopping has been hard, a GA meeting may be worth trying. GA offers peer support rather than clinical treatment." },
  ],
  CoDA: [
    { q: "What are signs a CoDA meeting might help?", a: "People often come to CoDA when relationships feel unbalanced — trouble setting boundaries, over-focusing on someone else's needs, or repeating patterns that feel unhealthy. Its only requirement is a desire for healthy, loving relationships." },
    { q: "Is CoDA only for romantic relationships?", a: "No — codependent patterns can show up in family, friendships, work, and caregiving too, including your relationship with yourself." },
  ],
  ACA: [
    { q: "Can I attend ACA if my parents weren't alcoholics?", a: "Possibly, yes — the full name is Adult Children of Alcoholics & Dysfunctional Families, and it includes people shaped by family dysfunction even without alcohol. Read the newcomer information and try a meeting whose description fits your experience." },
    { q: "What does “dysfunctional families” mean in ACA?", a: "It's ACA's framework for childhood environments that can leave lasting patterns into adulthood — not a single diagnosis. Members explore how those early dynamics still affect their relationships, emotions, and behavior today." },
  ],
  "Al-Anon": [
    { q: "Is Al-Anon for spouses, parents, and children of alcoholics?", a: "Yes — it's for anyone affected by someone else's drinking, and that person doesn't have to be in AA or even admit a problem. For younger people, Alateen is the version made for teens." },
    { q: "Can I attend Al-Anon if the person is still drinking?", a: "Yes. Al-Anon is about your own wellbeing, not about the drinker stopping first — you're welcome whether they're drinking, sober, in treatment, or unwilling to get help." },
  ],
  Alateen: [
    { q: "Is Alateen for teenagers with an alcoholic parent?", a: "It's for young people affected by someone else's drinking — a parent, stepparent, sibling, relative, or friend. Because it serves minors, meetings have specific age and safeguarding rules, so follow the guidance on each listing." },
    { q: "How is Alateen different from Al-Anon?", a: "They're part of the same family and both focus on people affected by someone else's drinking, but Alateen is designed for young people while Al-Anon mostly serves adults." },
  ],
  "Nar-Anon": [
    { q: "Is Nar-Anon for parents of someone using drugs?", a: "Yes — and also for spouses, partners, siblings, adult children, and close friends affected by a loved one's addiction. You can attend whether or not your loved one is in recovery." },
    { q: "What's the difference between NA and Nar-Anon?", a: "NA is for a person's own recovery from drug addiction; Nar-Anon is for the family and friends affected by someone else's. If you're supporting someone, Nar-Anon is usually the better starting point." },
  ],
  "Gam-Anon": [
    { q: "Is Gam-Anon for families of problem gamblers?", a: "Yes — for spouses, partners, parents, and other loved ones affected by someone's gambling. You can attend whether or not the gambler is in recovery." },
    { q: "What's the difference between Gamblers Anonymous and Gam-Anon?", a: "GA is for a person's own gambling recovery; Gam-Anon is for the people affected by it. Your reason for coming decides which fits." },
  ],
  "Co-Anon": [
    { q: "Is Co-Anon for families affected by cocaine addiction?", a: "Yes — and more broadly for people affected by a loved one's cocaine or other substance use, whether or not that person is in recovery." },
    { q: "What's the difference between Cocaine Anonymous and Co-Anon?", a: "CA is for a person's own recovery; Co-Anon is for their family and friends. The names are similar, so it's worth checking which one matches your situation." },
  ],
  FA: [
    { q: "Is there support for parents of an adult struggling with addiction?", a: "Yes — Families Anonymous is for relatives and friends affected by a loved one's drug, alcohol, or related behavioral problems, whether or not that person is in recovery." },
    { q: "How is Families Anonymous different from Nar-Anon and Al-Anon?", a: "All three support people affected by someone else — Al-Anon centers on drinking, Nar-Anon on drug addiction, and Families Anonymous on drug, alcohol, or related behavioral issues. Pick the one closest to your situation." },
  ],
};

// ---- Spanish (es) translations ------------------------------------------------------------
// AI-drafted; PENDING native, recovery-aware review before this ships to production (see the
// i18n guardrail). The English `SEO` and `EXTRA_FAQS` above stay the source of truth; these
// override only at render time for /es. Keyed by Fellow's internal codes, byte-identical to
// the English keys. Fellowship acronyms in parentheses are kept exactly; established Spanish
// fellowship names are used where they exist.
export const SEO_ES: Record<string, { title: string; description: string }> = {
  AA: { title: "Reuniones de AA cerca de ti y en línea | Alcohólicos Anónimos", description: "Encuentra reuniones de Alcohólicos Anónimos (AA) cerca de ti, presenciales y en línea. Descubre qué es AA, quién puede asistir y qué esperar." },
  NA: { title: "Reuniones de NA cerca de ti y en línea | Narcóticos Anónimos", description: "Encuentra reuniones de Narcóticos Anónimos (NA) cerca de ti o en línea. Busca reuniones locales y descubre qué esperar en tu primera reunión de NA." },
  CA: { title: "Reuniones de Cocaína Anónimos cerca de ti y en línea | CA", description: "Encuentra reuniones de Cocaína Anónimos (CA) cerca de ti y en línea. Explora reuniones locales de recuperación, opciones virtuales e información para quienes recién llegan." },
  HA: { title: "Reuniones de Heroína Anónimos cerca de ti y en línea | HA", description: "Encuentra reuniones de Heroína Anónimos (HA) cerca de ti y en línea, con información y recursos para quienes buscan recuperarse de la adicción a la heroína." },
  MA: { title: "Reuniones de Marihuana Anónimos cerca de ti y en línea | MA", description: "Encuentra reuniones de Marihuana Anónimos (MA) cerca de ti o en línea y descubre qué esperar de una reunión de apoyo para la recuperación del cannabis." },
  CMA: { title: "Reuniones de Metanfetamina Cristal Anónimos cerca de ti | CMA", description: "Encuentra reuniones de Metanfetamina Cristal Anónimos (CMA) cerca de ti y en línea. Busca reuniones locales de recuperación de la metanfetamina, con opciones para quienes recién llegan." },
  NicA: { title: "Reuniones de Nicotina Anónimos cerca de ti y en línea | NicA", description: "Encuentra reuniones de Nicotina Anónimos cerca de ti o en línea para quienes buscan apoyo entre pares en torno a la nicotina, el tabaco y el vapeo." },
  PA: { title: "Reuniones de Pastillas Anónimas cerca de ti y en línea | PA", description: "Encuentra reuniones de Pastillas Anónimas (PA) cerca de ti y reuniones virtuales para quienes buscan apoyo entre pares para recuperarse de la adicción a las pastillas." },
  RD: { title: "Reuniones de Recovery Dharma cerca de ti y en línea", description: "Encuentra reuniones de Recovery Dharma cerca de ti y en línea. Explora reuniones de recuperación de inspiración budista con meditación, atención plena y apoyo comunitario." },
  OA: { title: "Reuniones de Comedores Compulsivos Anónimos | OA", description: "Encuentra reuniones de Comedores Compulsivos Anónimos (OA) cerca de ti y en línea para quienes buscan apoyo entre pares en torno al comer compulsivo y los problemas con la comida." },
  EDA: { title: "Reuniones de Trastornos Alimentarios Anónimos | EDA", description: "Encuentra reuniones de Trastornos Alimentarios Anónimos (EDA) cerca de ti y en línea, con información para quienes recién llegan y buscan apoyo entre pares en la recuperación." },
  FAIR: { title: "Reuniones de Adictos a la Comida en Recuperación Anónimos", description: "Encuentra reuniones de Adictos a la Comida en Recuperación Anónimos (FA) cerca de ti y en línea. Explora las opciones de reuniones e información para quienes recién llegan." },
  FAA: { title: "Reuniones de Adictos a la Comida Anónimos | FAA", description: "Encuentra reuniones de Adictos a la Comida Anónimos (FAA) cerca de ti o en línea y conoce el apoyo entre pares para quienes buscan recuperarse de la adicción a la comida." },
  SAA: { title: "Reuniones de Sexoadictos Anónimos cerca de ti | SAA", description: "Encuentra reuniones de Sexoadictos Anónimos (SAA) cerca de ti o en línea para quienes buscan apoyo entre pares confidencial para la conducta sexual compulsiva." },
  SA: { title: "Reuniones de Sexólicos Anónimos cerca de ti y en línea | SA", description: "Encuentra reuniones de Sexólicos Anónimos (SA) cerca de ti y en línea. Explora las opciones de reuniones locales e información para quienes recién llegan." },
  SLAA: { title: "Reuniones de SLAA cerca de ti | Adicción al sexo y al amor", description: "Encuentra reuniones de Adictos al Sexo y al Amor Anónimos (SLAA) cerca de ti y en línea para apoyo con patrones de sexo, amor y relaciones." },
  SCA: { title: "Reuniones de Compulsivos Sexuales Anónimos | SCA", description: "Encuentra reuniones de Compulsivos Sexuales Anónimos (SCA) cerca de ti y en línea, con información para quienes recién llegan y opciones de reuniones locales." },
  SRA: { title: "Reuniones de Recuperación Sexual Anónimos | SRA", description: "Encuentra reuniones de Recuperación Sexual Anónimos (SRA) cerca de ti y en línea para quienes buscan recuperarse de la conducta sexual compulsiva." },
  COSLAA: { title: "Reuniones de COSLAA | Apoyo para familiares y parejas", description: "Encuentra información y opciones de apoyo de COSLAA para quienes afecta la adicción al sexo o al amor de otra persona, incluidos los recursos locales o en línea disponibles." },
  SIA: { title: "Reuniones de Sobrevivientes de Incesto Anónimos | SIA", description: "Encuentra reuniones de Sobrevivientes de Incesto Anónimos (SIA), incluidas las reuniones en línea, para adultos que buscan apoyo entre pares tras el abuso sexual infantil o el incesto." },
  DA: { title: "Reuniones de Deudores Anónimos cerca de ti y en línea | DA", description: "Encuentra reuniones de Deudores Anónimos (DA) cerca de ti y en línea para quienes buscan apoyo entre pares en torno a las deudas y las conductas financieras compulsivas." },
  UA: { title: "Reuniones de Subganadores Anónimos cerca de ti | UA", description: "Encuentra reuniones de Subganadores Anónimos (UA) cerca de ti y en línea. Explora reuniones de apoyo entre pares sobre el subganar y los patrones en torno al trabajo." },
  WA: { title: "Reuniones de Trabajadores Compulsivos Anónimos | WA", description: "Encuentra reuniones de Trabajadores Compulsivos Anónimos cerca de ti y en línea para quienes buscan apoyo entre pares en torno al trabajar compulsivo y los patrones poco sanos de trabajo." },
  CLA: { title: "Reuniones de Acumuladores Anónimos cerca de ti | CLA", description: "Encuentra reuniones de Acumuladores Anónimos (CLA) cerca de ti y en línea para apoyo entre pares en torno al desorden y la dificultad para manejar las posesiones y el espacio." },
  EA: { title: "Reuniones de Emociones Anónimas cerca de ti y en línea | EA", description: "Encuentra reuniones de Emociones Anónimas (EA) cerca de ti o en línea. Busca reuniones locales de apoyo entre pares e información para quienes recién llegan." },
  GA: { title: "Reuniones de Jugadores Anónimos cerca de ti y en línea | GA", description: "Encuentra reuniones de Jugadores Anónimos (GA) cerca de ti y en línea para quienes buscan apoyo entre pares para el juego problemático o compulsivo." },
  CoDA: { title: "Reuniones de CoDA cerca de ti | Codependientes Anónimos", description: "Encuentra reuniones de Codependientes Anónimos (CoDA) cerca de ti o en línea para quienes buscan apoyo entre pares en torno a los patrones de relación codependientes." },
  ACA: { title: "Reuniones de ACA cerca de ti y en línea | Hijos Adultos", description: "Encuentra reuniones de ACA cerca de ti y en línea para adultos afectados por haber crecido con el alcoholismo o la disfunción familiar. Explora reuniones locales e información para quienes recién llegan." },
  "Al-Anon": { title: "Reuniones de Al-Anon cerca de ti y en línea | Apoyo familiar", description: "Encuentra reuniones de Al-Anon cerca de ti y en línea para familiares y amistades afectados por la forma de beber de otra persona. Explora reuniones locales y virtuales." },
  Alateen: { title: "Reuniones de Alateen cerca de ti | Apoyo familiar para jóvenes", description: "Encuentra reuniones de Alateen cerca de ti y en línea para jóvenes afectados por la forma de beber de otra persona, con información local y para quienes recién llegan." },
  "Nar-Anon": { title: "Reuniones de Nar-Anon cerca de ti y en línea | Apoyo familiar", description: "Encuentra reuniones de Nar-Anon cerca de ti y en línea para familiares y amistades afectados por el consumo de drogas o la adicción de otra persona." },
  "Gam-Anon": { title: "Reuniones de Gam-Anon | Apoyo familiar para el juego", description: "Encuentra reuniones de Gam-Anon para familiares y amistades afectados por el juego de otra persona. Busca opciones de reuniones locales y en línea." },
  "Co-Anon": { title: "Reuniones de Co-Anon cerca de ti y en línea | Apoyo familiar", description: "Encuentra reuniones de Co-Anon y apoyo entre pares para familiares y amistades afectados por la adicción a la cocaína u otra sustancia de otra persona." },
  FA: { title: "Reuniones de Familias Anónimas cerca de ti y en línea", description: "Encuentra reuniones de Familias Anónimas cerca de ti y en línea para familiares y amistades preocupados por los problemas de drogas, alcohol o conducta de un ser querido." },
};

export const EXTRA_FAQS_ES: Record<string, FaqItem[]> = {
  AA: [
    { q: "¿Tengo que llamarme alcohólico para ir a AA?", a: "No, no necesitas un diagnóstico ni una etiqueta. Las reuniones cerradas son para cualquier persona con el deseo de dejar de beber; las reuniones abiertas también reciben visitantes. Fíjate si una reunión aparece como abierta o cerrada, y ven tal como eres." },
  ],
  NA: [
    { q: "¿NA es solo para personas adictas a los narcóticos?", a: "A pesar del nombre, NA no se limita a los narcóticos ni a los opioides: es para cualquier persona para quien las drogas se han vuelto un problema, sea cual sea la sustancia. El único requisito es el deseo de dejar de consumir." },
  ],
  CA: [
    { q: "¿Cocaína Anónimos es solo para la cocaína o el crack?", a: "No, CA es para cualquier persona que quiera dejar de consumir cocaína y otras sustancias que alteran la mente, así que la cocaína no tiene que ser tu única dificultad para pertenecer." },
  ],
  HA: [
    { q: "¿En qué se diferencia Heroína Anónimos de NA?", a: "HA se centra específicamente en la recuperación de la heroína y los opioides, mientras que NA es para la adicción a las drogas de cualquier tipo. Si la heroína ha sido tu principal dificultad, quizá te sientas más a gusto en HA, pero ambos usan el mismo apoyo entre pares de 12 pasos, así que vale la pena probar el que encaje." },
  ],
  MA: [
    { q: "¿Marihuana Anónimos es para la hierba o el cannabis?", a: "Sí: «marihuana», «cannabis» y «hierba» apuntan al mismo lugar. MA es para cualquier persona que quiera dejar de consumir cannabis; no necesitas una etiqueta en particular para venir." },
  ],
  CMA: [
    { q: "¿CMA es solo para personas que se recuperan de la metanfetamina?", a: "CMA se centra en la recuperación de la metanfetamina, y esa experiencia compartida es la razón por la que muchas personas vienen; su único requisito es el deseo de dejar de consumir. Si la metanfetamina no es central para ti, quizá NA o CA encajen mejor." },
  ],
  NicA: [
    { q: "¿Nicotina Anónimos puede ayudarme si vapeo?", a: "Sí: NicA se trata de vivir libre de nicotina en cualquier forma, incluidos el vapeo y el tabaco. Es apoyo entre pares, así que muchas personas lo usan junto con otras herramientas para dejarlo." },
  ],
  PA: [
    { q: "¿Pastillas Anónimas es para medicamentos recetados?", a: "Sí: PA es para cualquier persona que quiera dejar de consumir pastillas, recetadas o no. Una nota importante: algunos medicamentos no deben suspenderse de golpe, así que consulta a un médico antes de cambiar una receta." },
  ],
  RD: [
    { q: "¿Necesito ser budista para Recovery Dharma?", a: "No. RD se apoya en prácticas budistas como la meditación y la atención plena, pero no necesitas ningún trasfondo ni creencia: las reuniones para quienes recién llegan presentan las ideas con calma." },
    { q: "¿Recovery Dharma es una alternativa a los programas de 12 pasos?", a: "Es su propio programa dirigido por pares e inspirado en el budismo, no una reunión de AA modificada. Algunas personas lo combinan con otro apoyo de recuperación si esa combinación les ayuda." },
  ],
  OA: [
    { q: "¿OA es solo para el comer en exceso?", a: "No: OA es para cualquier persona con una relación poco sana con la comida, incluidos los atracones, la restricción u otros patrones. No hay pesajes, y es apoyo entre pares, así que puede acompañar la atención profesional." },
  ],
  EDA: [
    { q: "¿Quién puede asistir a una reunión de EDA?", a: "EDA está abierta a cualquier persona con el deseo de recuperarse de un trastorno alimentario. Como los trastornos alimentarios pueden ser graves desde el punto de vista médico, está pensada para complementar el tratamiento profesional, no para reemplazarlo." },
  ],
  FAIR: [
    { q: "¿Cuál es la diferencia entre FA y Comedores Compulsivos Anónimos?", a: "Ambas son comunidades de 12 pasos para la recuperación con la comida, pero organizaciones separadas con su propia literatura y prácticas. Adictos a la Comida en Recuperación Anónimos lo plantea como recuperación de la adicción a la comida; OA usa un lenguaje más amplio sobre el comer compulsivo. Leer sobre ambas y probar una reunión es la mejor forma de saber cuál encaja." },
  ],
  FAA: [
    { q: "¿En qué se diferencia FAA de Adictos a la Comida en Recuperación Anónimos?", a: "Adictos a la Comida Anónimos (FAA) y Adictos a la Comida en Recuperación Anónimos (FA) son organizaciones distintas con nombres parecidos: cada una tiene su propio plan de alimentación y sus prácticas. Si no estás seguro, lee sobre ambas y prueba la reunión que encaje con tu situación." },
  ],
  SAA: [
    { q: "¿Cómo sé si SAA es adecuado para mí?", a: "No necesitas diagnosticarte primero. SAA es para cualquier persona que sienta que su conducta sexual se ha vuelto difícil de controlar o está causando daño, y que quiere apoyo para cambiarla. Leer la información para quienes recién llegan y probar una reunión puede ayudarte a decidir." },
  ],
  SA: [
    { q: "¿Qué significa «sobriedad sexual» en SA?", a: "SA usa su propia definición de sobriedad sexual, común a toda la comunidad, que es más específica que las definiciones que usan otras comunidades. Si eso te importa, lo mejor es leer directamente la declaración de la propia SA." },
    { q: "¿Cuál es la diferencia entre SA y SAA?", a: "Ambas son de 12 pasos, pero SA usa una única definición compartida de sobriedad, mientras que SAA deja más de eso al plan de recuperación de cada persona. Sus culturas y su literatura difieren, así que prueba la que se ajuste a ti." },
  ],
  SLAA: [
    { q: "¿SLAA también es para la adicción al amor y a las relaciones?", a: "Sí: SLAA se organiza en torno a patrones tanto de sexo como de amor, incluidas las relaciones obsesivas y la fijación romántica, así que no necesitas encajar en una etiqueta para venir." },
    { q: "¿En qué se diferencia SLAA de SAA?", a: "SLAA incluye de forma explícita los patrones de amor y de relaciones; SAA se centra en la conducta sexual compulsiva. Ambas son de 12 pasos, pero su lenguaje y su manera de definir la recuperación difieren." },
  ],
  SCA: [
    { q: "¿En qué se diferencia SCA de SAA o SA?", a: "Las tres son comunidades de 12 pasos separadas para la recuperación de la conducta sexual, con distinta literatura y enfoques de la sobriedad. La mejor opción suele ser aquella con cuyas reuniones y lenguaje te identifiques." },
  ],
  SRA: [
    { q: "¿En qué se diferencia SRA de SAA, SA y SLAA?", a: "Todas son comunidades de 12 pasos separadas, pero su enfoque y sus definiciones de la recuperación difieren: SLAA incluye el amor y las relaciones, SA usa una única definición compartida de sobriedad, y SRA tiene su propia definición y literatura. SRA es más pequeña, así que una reunión en línea puede ayudar si no hay nada cerca." },
  ],
  COSLAA: [
    { q: "¿Hay apoyo para las parejas de un adicto al sexo o al amor?", a: "Sí: COSLAA es para las personas a quienes afecta la adicción al sexo o al amor de otra persona. Es una comunidad pequeña con listados centrales limitados, así que confirma que cualquier reunión esté vigente; si no encuentras una, otras comunidades de apoyo para parejas y familiares pueden ayudar." },
    { q: "¿Cuál es la diferencia entre COSLAA y SLAA?", a: "SLAA es para tus propios patrones de adicción al sexo y al amor; COSLAA es para el impacto de los de otra persona. «Ayuda para mi conducta» frente a «ayuda por la de otra persona» es la forma más sencilla de distinguirlas." },
  ],
  SIA: [
    { q: "¿Para quién es Sobrevivientes de Incesto Anónimos?", a: "SIA es una comunidad de apoyo entre pares para adultos sobrevivientes de abuso sexual infantil e incesto. Puedes empezar simplemente escuchando. Como estas conversaciones pueden ser difíciles, algunas personas también buscan apoyo profesional para el trauma junto con las reuniones." },
  ],
  DA: [
    { q: "¿Deudores Anónimos es solo para personas con grandes deudas?", a: "No: DA se trata del endeudamiento compulsivo y de los patrones en torno al dinero, no de una cantidad concreta. Gastar de más, pedir prestado o la evasión pueden traer a las personas. Es apoyo entre pares, no asesoría legal, fiscal ni financiera." },
  ],
  UA: [
    { q: "¿Qué significa «subganar» en UA?", a: "En UA, el subganar es más amplio que un salario bajo: puede incluir subutilizar tus capacidades, evitar oportunidades o tener dificultades para ganar lo suficiente para cubrir tus necesidades. Es la idea propia de la comunidad, no un diagnóstico." },
    { q: "¿En qué se diferencia UA de Deudores Anónimos?", a: "UA se centra en el subganar y en cómo usas el tiempo, el trabajo y las oportunidades; DA se centra en el endeudamiento compulsivo. Se solapan, y algunas personas se identifican con ambas, pero son comunidades separadas." },
  ],
  WA: [
    { q: "¿Cómo sé si podría ser un trabajador compulsivo?", a: "No necesitas un diagnóstico. WA es para las personas que encuentran el trabajo compulsivo, siempre urgente, difícil de desconectar o dañino para la salud y las relaciones. Un profesional clínico también puede ayudar si el estrés o el agotamiento necesitan atención." },
  ],
  CLA: [
    { q: "¿Acumuladores Anónimos es lo mismo que un grupo de apoyo para la acumulación compulsiva?", a: "No exactamente: CLA es una comunidad de pares de 12 pasos para personas que luchan con el desorden, mientras que el trastorno de acumulación es un diagnóstico clínico. Algunas personas encuentran útil CLA, pero no diagnostica ni trata un trastorno; la ayuda profesional es un camino aparte." },
  ],
  EA: [
    { q: "¿Quién puede asistir a Emociones Anónimas?", a: "EA es una comunidad de apoyo entre pares para el bienestar emocional, para personas que lidian con cosas como la ansiedad, la depresión o el estrés. No es terapia ni atención de crisis, y funciona bien junto con el apoyo profesional." },
  ],
  GA: [
    { q: "¿Cómo sé si tengo un problema con el juego?", a: "No necesitas decidir un diagnóstico primero. Si el juego, las apuestas deportivas o el casino están causando problemas de dinero, de relaciones o emocionales y te ha costado parar, quizá valga la pena probar una reunión de GA. GA ofrece apoyo entre pares en lugar de tratamiento clínico." },
  ],
  CoDA: [
    { q: "¿Qué señales indican que una reunión de CoDA podría ayudar?", a: "Las personas suelen llegar a CoDA cuando las relaciones se sienten desequilibradas: dificultad para poner límites, enfocarse demasiado en las necesidades de otra persona o repetir patrones que se sienten poco sanos. Su único requisito es el deseo de tener relaciones sanas y afectuosas." },
    { q: "¿CoDA es solo para las relaciones románticas?", a: "No: los patrones codependientes también pueden aparecer en la familia, las amistades, el trabajo y el cuidado de otros, incluida tu relación contigo mismo." },
  ],
  ACA: [
    { q: "¿Puedo asistir a ACA si mis padres no eran alcohólicos?", a: "Es posible que sí: el nombre completo es Hijos Adultos de Alcohólicos y Familias Disfuncionales, e incluye a personas marcadas por la disfunción familiar incluso sin alcohol. Lee la información para quienes recién llegan y prueba una reunión cuya descripción encaje con tu experiencia." },
    { q: "¿Qué significa «familias disfuncionales» en ACA?", a: "Es el marco de ACA para los entornos de la infancia que pueden dejar patrones duraderos en la adultez, no un único diagnóstico. Los miembros exploran cómo esas dinámicas tempranas todavía afectan sus relaciones, sus emociones y su conducta hoy." },
  ],
  "Al-Anon": [
    { q: "¿Al-Anon es para cónyuges, padres e hijos de alcohólicos?", a: "Sí: es para cualquier persona afectada por la forma de beber de otra, y esa persona no tiene que estar en AA ni siquiera admitir un problema. Para las personas más jóvenes, Alateen es la versión hecha para adolescentes." },
    { q: "¿Puedo asistir a Al-Anon si la persona sigue bebiendo?", a: "Sí. Al-Anon se trata de tu propio bienestar, no de que quien bebe deje de hacerlo primero: eres bienvenido esté bebiendo, sobria, en tratamiento o sin querer buscar ayuda." },
  ],
  Alateen: [
    { q: "¿Alateen es para adolescentes con un padre o madre alcohólicos?", a: "Es para jóvenes afectados por la forma de beber de otra persona: un padre, madre, padrastro, hermano, familiar o amigo. Como atiende a menores, las reuniones tienen reglas específicas de edad y protección, así que sigue las indicaciones de cada listado." },
    { q: "¿En qué se diferencia Alateen de Al-Anon?", a: "Forman parte de la misma familia y ambas se centran en las personas afectadas por la forma de beber de otra, pero Alateen está diseñada para jóvenes mientras que Al-Anon atiende sobre todo a adultos." },
  ],
  "Nar-Anon": [
    { q: "¿Nar-Anon es para padres de alguien que consume drogas?", a: "Sí, y también para cónyuges, parejas, hermanos, hijos adultos y amistades cercanas afectados por la adicción de un ser querido. Puedes asistir esté o no tu ser querido en recuperación." },
    { q: "¿Cuál es la diferencia entre NA y Nar-Anon?", a: "NA es para la propia recuperación de una persona de la adicción a las drogas; Nar-Anon es para los familiares y las amistades afectados por la de otra. Si estás apoyando a alguien, Nar-Anon suele ser el mejor punto de partida." },
  ],
  "Gam-Anon": [
    { q: "¿Gam-Anon es para las familias de jugadores problemáticos?", a: "Sí: para cónyuges, parejas, padres y otros seres queridos afectados por el juego de alguien. Puedes asistir esté o no en recuperación quien juega." },
    { q: "¿Cuál es la diferencia entre Jugadores Anónimos y Gam-Anon?", a: "GA es para la propia recuperación del juego de una persona; Gam-Anon es para quienes se ven afectados por ella. Tu motivo para venir decide cuál encaja." },
  ],
  "Co-Anon": [
    { q: "¿Co-Anon es para las familias afectadas por la adicción a la cocaína?", a: "Sí, y de forma más amplia para las personas afectadas por el consumo de cocaína u otra sustancia de un ser querido, esté o no esa persona en recuperación." },
    { q: "¿Cuál es la diferencia entre Cocaína Anónimos y Co-Anon?", a: "CA es para la propia recuperación de una persona; Co-Anon es para su familia y sus amistades. Los nombres se parecen, así que vale la pena comprobar cuál coincide con tu situación." },
  ],
  FA: [
    { q: "¿Hay apoyo para los padres de un adulto que lucha con la adicción?", a: "Sí: Familias Anónimas es para los familiares y las amistades afectados por los problemas de drogas, alcohol o conducta de un ser querido, esté o no esa persona en recuperación." },
    { q: "¿En qué se diferencia Familias Anónimas de Nar-Anon y Al-Anon?", a: "Las tres apoyan a las personas afectadas por otra: Al-Anon se centra en la bebida, Nar-Anon en la adicción a las drogas, y Familias Anónimas en los problemas de drogas, alcohol o conducta relacionados. Elige la más cercana a tu situación." },
  ],
};

// Locale-aware accessors. English stays the default; `es` applies the overrides above.
export function getSEO(code: string, locale?: string): { title: string; description: string } | undefined {
  if (locale === "es" && SEO_ES[code]) return SEO_ES[code];
  return SEO[code];
}
export function getExtraFaqs(code: string, locale?: string): FaqItem[] {
  if (locale === "es" && EXTRA_FAQS_ES[code]) return EXTRA_FAQS_ES[code];
  return EXTRA_FAQS[code] || [];
}
