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

// ---- Spanish (es) translations ------------------------------------------------------------
// AI-drafted; PENDING native, recovery-aware review before this ships to production (see the
// i18n guardrail). English above stays the source of truth; these override only at render time
// for /es. Sections are shared across fellowship codes, so overrides are keyed by section
// identity. Organization names (link `title`) are US proper nouns and stay in English; only the
// descriptive `sub` is translated, keyed by href (which stays byte-identical to English).
type BeyondSectionES = {
  heading: string; lede: string; groupLabel: string; note: string;
  subs: Record<string, string>; // keyed by href
};

const FOOD_ES: BeyondSectionES = {
  heading: "Apoyo más allá del programa",
  lede: "La recuperación de las dificultades con la comida y la alimentación es más grande que un solo programa. Estas comunidades y líneas de ayuda ofrecen apoyo junto con tus reuniones, centradas en la sanación y la neutralidad corporal, nunca en dietas ni en la pérdida de peso.",
  groupLabel: "Apoyo confiable para la alimentación y la imagen corporal",
  note: "Son organizaciones independientes; Fellow no las verifica. Todo lo que aparece aquí es neutral respecto a la recuperación y el cuerpo, nunca centrado en dietas ni en el peso.",
  subs: {
    "https://www.allianceforeatingdisorders.com/": "Línea de ayuda gratuita y buscador de terapeutas",
    "https://anad.org/": "Grupos de apoyo entre pares y mentoría gratuitos",
    "https://thebodypositive.org/": "Comunidad de imagen corporal y autoaceptación",
  },
};

const FAMILY_ES: BeyondSectionES = {
  heading: "Apoyo para familias y seres queridos",
  lede: "Apoyar a alguien en recuperación —o recuperarte de sus efectos en ti— requiere su propia comunidad. Estas organizaciones de confianza ayudan junto con tus reuniones.",
  groupLabel: "Para personas afectadas por la adicción de alguien",
  note: "Son organizaciones independientes; Fellow no las verifica; contacta con la que mejor te encaje.",
  subs: {
    "https://smartrecovery.org/family": "Grupos de apoyo para seres queridos",
    "https://www.nami.org/": "Apoyo y educación familiar para la salud mental",
    "https://drugfree.org/": "Línea de ayuda y recursos gratuitos para familias",
  },
};

const FINANCIAL_ES: BeyondSectionES = {
  heading: "Recursos para el bienestar financiero",
  lede: "Junto con los pasos, estos recursos sin fines de lucro y públicos pueden ayudarte a estabilizar tus finanzas y a construir una relación más sana con el dinero.",
  groupLabel: "Ayuda sin fines de lucro y pública con el dinero",
  note: "Solo recursos sin fines de lucro y gubernamentales, nunca prestamistas ni servicios de pago para liquidación de deudas.",
  subs: {
    "https://www.nfcc.org/": "Asesoría sin fines de lucro sobre crédito y deudas",
    "https://www.consumerfinance.gov/": "Herramientas y guías gubernamentales gratuitas sobre dinero",
  },
};

const MENTAL_ES: BeyondSectionES = {
  heading: "Apoyo para la salud mental",
  lede: "La recuperación y el bienestar emocional van de la mano. Estas organizaciones de confianza ofrecen apoyo entre pares, educación y herramientas gratuitas junto con tus reuniones.",
  groupLabel: "Apoyo entre pares y herramientas",
  note: "Son organizaciones independientes; Fellow no las verifica.",
  subs: {
    "https://www.nami.org/": "Apoyo y educación familiar para la salud mental",
    "https://mhanational.org/": "Herramientas de evaluación gratuitas y apoyo entre pares",
  },
};

const GAMBLING_ES: BeyondSectionES = {
  heading: "Apoyo más allá de las reuniones",
  lede: "La recuperación de un problema con el juego a menudo implica atender también las finanzas. Estos recursos confidenciales y sin fines de lucro ayudan junto con tus reuniones.",
  groupLabel: "Recuperación del juego y las finanzas",
  note: "Solo líneas de ayuda y recursos sin fines de lucro, nunca contenido de apuestas o juego.",
  subs: {
    "https://www.ncpgambling.org/": "Línea de ayuda confidencial: llama o envía un mensaje al 1-800-GAMBLER",
    "https://www.nfcc.org/": "Asesoría sin fines de lucro sobre crédito y deudas",
  },
};

const WORK_ES: BeyondSectionES = {
  heading: "Apoyo más allá de las reuniones",
  lede: "Tomar distancia del trabajo compulsivo requiere apoyo. Estas organizaciones de confianza ofrecen herramientas para el estrés, el agotamiento y el bienestar mental junto con tus reuniones.",
  groupLabel: "Agotamiento y bienestar",
  note: "Son organizaciones independientes; Fellow no las verifica.",
  subs: {
    "https://mhanational.org/": "Herramientas de evaluación gratuitas y apoyo entre pares",
    "https://www.nami.org/": "Apoyo y educación familiar para la salud mental",
  },
};

const CLUTTER_ES: BeyondSectionES = {
  heading: "Apoyo más allá de las reuniones",
  lede: "Estos recursos profesionales y sin fines de lucro apoyan la recuperación de la desorganización crónica junto con tus reuniones.",
  groupLabel: "Ayuda con el desorden y la desorganización",
  note: "Son organizaciones independientes; Fellow no las verifica.",
  subs: {
    "https://www.challengingdisorganization.org/": "Ayuda para la desorganización crónica y la acumulación",
    "https://mhanational.org/": "Herramientas de evaluación gratuitas y apoyo entre pares",
  },
};

const SECTION_ES = new Map<BeyondSection, BeyondSectionES>([
  [FOOD, FOOD_ES],
  [FAMILY, FAMILY_ES],
  [FINANCIAL, FINANCIAL_ES],
  [MENTAL, MENTAL_ES],
  [GAMBLING, GAMBLING_ES],
  [WORK, WORK_ES],
  [CLUTTER, CLUTTER_ES],
]);

function localizeSection(s: BeyondSection, o: BeyondSectionES): BeyondSection {
  return {
    heading: o.heading,
    lede: o.lede,
    groupLabel: o.groupLabel,
    note: o.note,
    links: s.links.map((l) => ({ ...l, sub: o.subs[l.href] ?? l.sub })),
  };
}

// Locale-aware accessor. English stays the default; `es` applies the overrides above.
export function beyondFor(code: string, locale?: string): BeyondSection | null {
  const s = BY_CODE_SECTION[code] || null;
  if (!s || locale !== "es") return s;
  const o = SECTION_ES.get(s);
  return o ? localizeSection(s, o) : s;
}
