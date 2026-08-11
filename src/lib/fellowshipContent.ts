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
