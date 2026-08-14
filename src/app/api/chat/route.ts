// Fellow chatbot — phase 2a. A serverless route that runs Claude (Haiku) with a
// `search_meetings` tool over the Typesense index. The model may only present meetings
// the tool returns; it never invents them. Returns { reply, meetings }.
import Anthropic from "@anthropic-ai/sdk";
import { searchMeetings, type MeetingResult } from "@/lib/serverSearch";
import { FELLOWSHIPS, fellowshipName, CODE_BY_SLUG } from "@/lib/fellowships";
import { PROBLEMS, type Route } from "@/lib/problems";
import { officialFinder } from "@/lib/finders";
import { logChatEvent } from "@/lib/analytics";
import { notifyChatEngagement } from "@/lib/notify";
import fellowshipStats from "@/lib/fellowship-stats.json";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const FELLOWSHIP_LIST = FELLOWSHIPS.map((f) => `${f.code} = ${f.name}`).join("; ");

// The fellowships Fellow actually has meetings for, generated from the live index on every
// ingest (src/lib/fellowship-stats.json). Built here so the system prompt can never drift
// from the data — add a feed and re-ingest, and the bot's honest coverage updates itself.
const INDEXED_FELLOWSHIPS = Object.entries((fellowshipStats as { counts: Record<string, number> }).counts)
  .filter(([, n]) => n > 0)
  .map(([code]) => `${code} (${fellowshipName(code)})`)
  .join(", ");

// The exact problem→fellowship routing that powers Fellow's "which support group is right for me?"
// pages (/support-groups → /support-groups/[slug]), rendered into the system prompt so the chat
// flow gives the SAME guidance as those pages — same problems, same self-vs-loved-one split, same
// ledes — from one source of truth. Add or edit a problem in problems.ts and the bot learns it.
const routeLine = (r: Route) => `${fellowshipName(r.code)} (${r.code}) — ${r.note}`;
const PROBLEM_ROUTING = PROBLEMS.map((p) => {
  const self = p.self.length ? p.self.map(routeLine).join("; ") : "";
  const affected = p.affected?.length ? p.affected.map(routeLine).join("; ") : "";
  return [
    `• ${p.h1}: ${p.lede}`,
    self ? `   For yourself: ${self}` : "",
    affected ? `   For a loved one: ${affected}` : "",
  ].filter(Boolean).join("\n");
}).join("\n");

const SYSTEM = `You are Fellow, a warm, concise assistant that helps people find 12-step recovery meetings.

HOW YOU WORK
- Use the search_meetings tool to find meetings. You may ONLY tell the user about meetings the tool returns — never invent a meeting, time, address, or link. If the tool returns nothing, say so plainly and offer to widen the area, try another day/time, or show online meetings.
- The app displays the returned meetings as cards below your message, so keep your text short: a friendly one or two sentences. Do NOT list every meeting's full details in text — just a brief intro like "Here are a few AA meetings tonight near you:".
- If a location is provided in context, treat it as the user's area and use it — never ask "what area are you in?". Only ask about location when none is provided and the request needs one. You may still ask ONE short clarifying question if the fellowship is genuinely unclear.
- When the user names a specific place (a city, neighborhood, or ZIP like "San Francisco" or "78704"), search by passing it as \`query\` and do NOT also pass near_lat/near_lng — those restrict results to the user's current area and would hide the place they asked about. Only use near_lat/near_lng for "near me" / no-place requests.

MATCHING WHAT PEOPLE DESCRIBE → THE RIGHT FELLOWSHIP
This is the SAME guidance as Fellow's "which support group is right for me?" pages (/support-groups). Use it to name the right fellowship for whatever someone describes. A key axis runs through all of it: is this about THEIR OWN experience, or about SOMEONE ELSE's (a loved one)? Route to the family fellowships for the second case. Give this guidance for ANY situation below, even when Fellow doesn't yet index that fellowship's meetings — naming the right group and explaining the options is itself the help these pages give.

${PROBLEM_ROUTING}

- Pass the fellowship CODE (in parentheses above) as "fellowship" when you search. All codes: ${FELLOWSHIP_LIST}.
- SMART Recovery (secular, CBT/science-based, "self-empowering", a non-12-step alternative) → pass fellowship:"SMART". Fellow doesn't index SMART meetings, so the search returns nothing — expected; the app then shows SMART's official finder (pre-filled to the user's area when location is known). Pass near_lat/near_lng if you have them so that link is location-aware.

HONESTY ABOUT MEETINGS (this is separate from the guidance above — keep the two straight)
- Naming the right fellowship is always fine. What must stay honest is whether Fellow has its MEETINGS. Fellow currently indexes meetings for these fellowships ONLY: ${INDEXED_FELLOWSHIPS}.
- If the right fellowship IS indexed → search and show meetings normally.
- If it is NOT indexed (most family fellowships like Nar-Anon/Gam-Anon/Co-Anon/FA, and gap topics like gambling→GA or overeating→OA) → still name it as the right fit, but say plainly Fellow doesn't list those meetings yet, and STILL run the search with that code so the app can offer the official-finder and web-search buttons. Never imply Fellow has meetings it doesn't.

HELPING SOMEONE CHOOSE (they tap "Which support group is right for me?", say "I'm not sure where to start", or similar)
- This is often the most vulnerable question someone asks — lead with warmth, not a wall of options. In one or two short sentences, invite them to say what's going on, oriented around two things: what they're facing, and whether it's about THEIR OWN experience or SOMEONE ELSE's. e.g. "Happy to help you find the right fit — tell me a bit about what's going on. Is it about your own drinking, drug use, or something else? Or are you worried about someone you love?"
- Ask ONE question, not several; don't list the whole catalog. Once they answer, respond like the /support-groups page for that situation: a warm sentence or two explaining the option(s), drawing on the routing notes above; name the right fellowship — splitting "for yourself" vs "for a loved one" when both apply; then either show meetings (if indexed) or explain the meeting gap and hand off (if not).
- For a LOVED ONE, always reassure them that support for THEM exists whether or not the person they're worried about is ready to change.

WHEN A SEARCH COMES BACK EMPTY — widen before giving up. Do the extra searches silently (more tool calls), then tell the user briefly what you widened:
1. Re-run with online:true. Online meetings exist nationwide for almost every fellowship, so this alone resolves most gaps — always try it before concluding nothing is available.
2. If a day or time_of_day was set, drop it and offer meetings across the week.
3. If a location was set, increase radius_miles (e.g. 40 → 100) to catch nearby towns.
4. If truly nothing turns up in-person, lead with the online meetings you found.
Example: "There are no in-person ACA meetings in DC tonight, but here are 3 online ACA meetings happening today, plus some in-person options nearby tomorrow."
- ONLY after these widenings still yield nothing, say plainly you couldn't find any in Fellow's directory and let the user know they can tap the buttons below your message (an official directory link and a web search) to look further. Do NOT output any URLs or invent web results yourself — the app adds the buttons.

SCOPE & CARE
- You help find meetings. You are NOT a therapist and do not give medical, clinical, or legal advice.
- Fellow is independent and not affiliated with any fellowship; remind people to confirm details with the group.
- Respect anonymity — never ask for identifying details.
- If someone expresses crisis, self-harm, or is in danger, respond with brief compassion and share: 988 Suicide & Crisis Lifeline (call or text 988), and SAMHSA's free 24/7 National Helpline 1-800-662-4357. Then still offer to find a meeting if they'd like.

LANGUAGE
- Reply in the SAME language the person writes in. If they write in Spanish, respond ENTIRELY in Spanish, with the same warmth and care — never switch back to English on them. The search tool works identically in any language: keep passing fellowship codes (AA, NA, …), place names, and coordinates as usual regardless of the language.
- When responding in Spanish, use the official fellowship names naturally where it helps (AA = Alcohólicos Anónimos, NA = Narcóticos Anónimos, Al-Anon = Al-Anon/Alateen), and a warm, respectful "tú".
- Spanish crisis resources (share these, not a literal translation of the English): la Línea 988 de Prevención del Suicidio y Crisis (llame o envíe un mensaje de texto al 988; hay atención en español), y la Línea Nacional de Ayuda de SAMHSA, gratuita y disponible 24/7: 1-800-662-4357.`;

const TOOLS: Anthropic.Tool[] = [{
  name: "search_meetings",
  description: "Search Fellow's index of 12-step recovery meetings. Returns matching meetings; present only these to the user.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Free text: city, ZIP, group name, or leave empty when filtering only by fellowship/day/location." },
      fellowship: { type: "string", description: "Fellowship code, e.g. AA, NA, GA, Al-Anon, CoDA, SLAA." },
      day: { type: "integer", description: "0=Sunday .. 6=Saturday." },
      time_of_day: { type: "string", enum: ["morning", "noon", "afternoon", "evening", "night"] },
      online: { type: "boolean", description: "true = online only, false = in-person only." },
      near_lat: { type: "number" },
      near_lng: { type: "number" },
      radius_miles: { type: "number", description: "Default ~40 when a location is given." },
      limit: { type: "integer", description: "Max results (default 10, max 30)." },
    },
  },
}];

// Per-IP rate limiting to protect the (paid) chat endpoint from floods/bots. In-memory
// per warm instance — combined with the Anthropic monthly spend cap, this bounds abuse
// with zero external infrastructure. Tune via env if needed.
const RL_MAX = Number(process.env.CHAT_RL_MAX || 15);                 // max requests
const RL_WINDOW_MS = Number(process.env.CHAT_RL_WINDOW_MS || 60_000); // per this window
const _hits = new Map<string, number[]>();
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
}
function rateLimited(ip: string): boolean {
  if (!ip) return false; // unknown IP → fail open so real users are never blocked
  const now = Date.now();
  const arr = (_hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  _hits.set(ip, arr);
  if (_hits.size > 5000) {
    for (const [k, v] of _hits) if (!v.length || now - v[v.length - 1] > RL_WINDOW_MS) _hits.delete(k);
  }
  return arr.length > RL_MAX;
}

// De-dupe collected meetings by id, keeping first-seen order, capped at 12. The client re-sorts
// these by day-from-today, so order here only needs to be stable.
function dedupeMeetings(list: MeetingResult[]): MeetingResult[] {
  const seen = new Set<string>();
  return list.filter((m) => (m.id && !seen.has(m.id) ? (seen.add(m.id), true) : false)).slice(0, 12);
}

// Fellowships the model named in its final REPLY text (e.g. "Debtors Anonymous (DA)") even when it
// explained a gap topic WITHOUT calling search_meetings. Merge these into the recommended set so the
// "Groups that might fit" chip and the official-finder / web-search buttons still appear. Matches the
// full fellowship name or a "(CODE)" parenthetical — never a bare short code (those collide with state
// abbreviations like CA/GA/MA/PA/WA).
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function mergeReplyFellowships(text: string, into: string[]): void {
  if (!text) return;
  const lower = text.toLowerCase();
  for (const f of FELLOWSHIPS) {
    if (into.includes(f.code)) continue;
    if (lower.includes(f.name.toLowerCase()) || new RegExp(`\\(\\s*${escapeRe(f.code)}\\s*\\)`).test(text)) {
      into.push(f.code);
    }
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "Chat isn't configured yet." }, { status: 503 });

  if (rateLimited(clientIp(req))) {
    return Response.json(
      { error: "You're sending messages very quickly — please wait a few seconds and try again." },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }
  const incoming: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length) return Response.json({ error: "No messages." }, { status: 400 });

  // Email heads-up on a NEW conversation (no prior assistant turn = the first user message).
  // Kicked off here so it runs concurrently with the model call below, and awaited in `finally`
  // before the response returns (serverless can freeze after return, dropping un-awaited work).
  // Sends ZERO chat data — see notifyChatEngagement. No-op unless RESEND_API_KEY is set.
  const isNewConversation = !incoming.some((m) => m.role === "assistant");
  const notifyPromise = isNewConversation ? notifyChatEngagement() : null;

  // Basic guardrails: cap history + message length to bound cost.
  const trimmed = incoming.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" as const : "user" as const,
    content: String(m.content || "").slice(0, 2000),
  }));
  const loc = body?.location && typeof body.location.lat === "number"
    ? `\n\nContext — the user's approximate location is already known${body.location.label ? ` (${body.location.label})` : ""}: ${body.location.lat}, ${body.location.lng}. ALWAYS pass it as near_lat/near_lng and do NOT ask the user what area they're in. If they name a different place, use that instead.`
    : "\n\nContext — no location is available. If the request needs one, ask the user for a ZIP or city (once).";

  const anthropic = new Anthropic({ apiKey });
  const msgs: Anthropic.MessageParam[] = trimmed;
  const collected: MeetingResult[] = [];
  let lastInput: any = null; // remember the last search's inputs to build a web-search fallback
  // Canonical fellowship codes the model routed to this turn (every code it searched), in first-seen
  // order. Powers the "Groups that might fit" chips the client renders — each links to /[fellowship].
  const recommended: string[] = [];

  // When Fellow's index has nothing, offer a Google search the user can open in a new tab.
  // Built from what they were actually looking for (fellowship + place), never personal data.
  const lastUserMsg = [...trimmed].reverse().find((m) => m.role === "user")?.content || "";
  const buildWebSearch = () => {
    const fCode = lastInput?.fellowship ? String(lastInput.fellowship) : (recommended[0] || "");
    const fName = fCode ? fellowshipName(fCode) : "";
    const place = (lastInput?.query && String(lastInput.query).trim())
      || (body?.location?.label && body.location.label !== "your area" ? String(body.location.label) : "");
    let q = [fName, "meetings", place].filter(Boolean).join(" ").trim();
    if (!q || q === "meetings") q = lastUserMsg ? `${lastUserMsg} meetings` : "recovery meetings";
    // Prefer the fellowship's official, verified finder over a generic web search.
    // Pass coordinates so location-aware finders (e.g. SMART Recovery) deep-link to
    // pre-filled results near the user.
    const loc = {
      lat: lastInput?.near_lat ?? body?.location?.lat,
      lng: lastInput?.near_lng ?? body?.location?.lng,
      label: (lastInput?.query && String(lastInput.query).trim()) || body?.location?.label,
    };
    const official = officialFinder(fCode, loc) || undefined;
    return { query: q, url: `https://www.google.com/search?q=${encodeURIComponent(q)}`, official };
  };

  try {
    for (let i = 0; i < 7; i++) { // room for the "widen before giving up" retry ladder
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM + loc,
        tools: TOOLS,
        messages: msgs,
      });
      if (resp.stop_reason === "tool_use") {
        msgs.push({ role: "assistant", content: resp.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of resp.content) {
          if (block.type !== "tool_use") continue;
          const input = (block.input || {}) as any;
          lastInput = input || lastInput;
          // Record the routed fellowship (normalized to its canonical code) for the chips.
          const canon = CODE_BY_SLUG[String(input.fellowship || "").trim().toLowerCase()];
          if (canon && !recommended.includes(canon)) recommended.push(canon);
          let found = await searchMeetings(input);
          // Deterministic safety net for the widen ladder: if an in-person search with a location
          // or a specific day comes back empty, automatically retry online (nationwide) so we never
          // return "nothing found" without having actually tried the online option first.
          if (!found.length && input.online !== true && (input.near_lat != null || Number.isInteger(input.day))) {
            found = await searchMeetings({ ...input, online: true, near_lat: undefined, near_lng: undefined, radius_miles: undefined });
          }
          collected.push(...found);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(found.slice(0, 8)),
          });
        }
        msgs.push({ role: "user", content: toolResults });
        continue;
      }
      const reply = resp.content.filter((c) => c.type === "text").map((c: any) => c.text).join("").trim();
      // Capture any fellowship the model named in prose but didn't pass to search_meetings (common on
      // gap topics like DA) so the chip + handoff buttons still appear.
      mergeReplyFellowships(reply, recommended);
      const meetings = dedupeMeetings(collected);
      // Privacy-preserving analytics: aggregate counters only (no message text, place, or IP).
      await logChatEvent({ fellowship: lastInput?.fellowship, found: meetings.length > 0, online: lastInput?.online === true });
      return Response.json(meetings.length ? { reply, meetings, fellowships: recommended } : { reply, meetings, fellowships: recommended, webSearch: buildWebSearch() });
    }
    // Ran out of turns — never throw away what we already found. Return the collected meetings
    // (deduped) rather than an empty result, so the ladder's work isn't lost.
    const meetings = dedupeMeetings(collected);
    await logChatEvent({ fellowship: lastInput?.fellowship, found: meetings.length > 0, online: lastInput?.online === true });
    return Response.json(
      meetings.length
        ? { reply: "Here are the meetings I found for you:", meetings, fellowships: recommended }
        : { reply: "Sorry — I had trouble pulling that together. Mind trying that again, maybe with a bit more detail?", meetings, fellowships: recommended, webSearch: buildWebSearch() },
    );
  } catch (e: any) {
    const status = e?.status === 429 ? 429 : 500;
    const msg = status === 429 ? "We've hit today's chat limit — the regular search still works." : "Something went wrong. Please try again.";
    return Response.json({ error: msg }, { status });
  } finally {
    // Ensure the engagement email actually goes out before the function is frozen/reclaimed.
    // Runs after the return value is computed; overlaps the model call so it adds ~no latency.
    if (notifyPromise) await notifyPromise;
  }
}
