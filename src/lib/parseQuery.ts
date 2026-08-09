// Lightweight natural-language parsing for the search box (phase 1 — no AI backend).
// Pulls day, time-of-day, ZIP, and "near me" out of a free-text query and maps them to
// structured filters; whatever's left (place, group name, fellowship, meeting type) is
// searched as text. e.g. "sunday morning aa in boston" →
//   { day: 0, window: {lo:300,hi:719}, text: "aa boston", labels: ["Sunday","morning"] }

export type Parsed = {
  text: string;                       // residual free text → the Typesense query
  day: number | null;                 // 0=Sun..6=Sat
  window: { lo: number; hi: number } | null; // minutes-since-midnight range
  zip: string | null;
  nearMe: boolean;
  labels: string[];                   // human-readable summary of what was understood
};

const DAY_WORDS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tues: 2, tue: 2,
  wednesday: 3, weds: 3, wed: 3, thursday: 4, thurs: 4, thur: 4, thu: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_WORDS: Record<string, { lo: number; hi: number; label: string }> = {
  morning: { lo: 300, hi: 719, label: "morning" },
  noon: { lo: 690, hi: 810, label: "noon" },
  midday: { lo: 690, hi: 810, label: "midday" },
  lunch: { lo: 690, hi: 810, label: "lunchtime" },
  afternoon: { lo: 720, hi: 1019, label: "afternoon" },
  evening: { lo: 1020, hi: 1259, label: "evening" },
  night: { lo: 1080, hi: 1439, label: "night" },
};

export function parseQuery(raw: string): Parsed {
  let text = ` ${(raw || "").toLowerCase()} `;
  const labels: string[] = [];
  let day: number | null = null;
  let window: { lo: number; hi: number } | null = null;
  let zip: string | null = null;
  let nearMe = false;
  const strip = (re: RegExp) => { text = text.replace(re, " "); };

  if (/\b(near me|nearby|close to me|around me)\b/.test(text)) {
    nearMe = true; strip(/\b(near me|nearby|close to me|around me)\b/g); labels.push("near me");
  }
  const zm = text.match(/\b(\d{5})\b/);
  if (zm) { zip = zm[1]; strip(/\b\d{5}\b/g); labels.push(zip); }

  const now = new Date();
  const today = now.getDay();
  if (/\btonight\b/.test(text)) { day = today; window = { lo: 1020, hi: 1439 }; strip(/\btonight\b/g); labels.push("tonight"); }
  else if (/\btoday\b/.test(text)) { day = today; strip(/\btoday\b/g); labels.push("today"); }
  else if (/\btomorrow\b/.test(text)) { day = (today + 1) % 7; strip(/\btomorrow\b/g); labels.push("tomorrow"); }
  else {
    for (const [w, d] of Object.entries(DAY_WORDS)) {
      if (new RegExp(`\\b${w}\\b`).test(text)) { day = d; strip(new RegExp(`\\b${w}\\b`, "g")); labels.push(FULL_DAYS[d]); break; }
    }
  }

  for (const [w, v] of Object.entries(TIME_WORDS)) {
    if (new RegExp(`\\b${w}\\b`).test(text)) { window = window || { lo: v.lo, hi: v.hi }; if (!labels.includes(v.label)) labels.push(v.label); strip(new RegExp(`\\b${w}\\b`, "g")); break; }
  }

  text = text.replace(/\bin\b|\bon\b|\bat\b|\bmeetings?\b|\bgroup\b/g, " ").replace(/\s+/g, " ").trim();
  return { text, day, window, zip, nearMe, labels };
}
