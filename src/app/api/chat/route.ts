// Fellow chatbot — phase 2a. A serverless route that runs Claude (Haiku) with a
// `search_meetings` tool over the Typesense index. The model may only present meetings
// the tool returns; it never invents them. Returns { reply, meetings }.
import Anthropic from "@anthropic-ai/sdk";
import { searchMeetings, type MeetingResult } from "@/lib/serverSearch";
import { FELLOWSHIPS, fellowshipName } from "@/lib/fellowships";
import { officialFinder } from "@/lib/finders";
import { logChatEvent } from "@/lib/analytics";
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

const SYSTEM = `You are Fellow, a warm, concise assistant that helps people find 12-step recovery meetings.

HOW YOU WORK
- Use the search_meetings tool to find meetings. You may ONLY tell the user about meetings the tool returns — never invent a meeting, time, address, or link. If the tool returns nothing, say so plainly and offer to widen the area, try another day/time, or show online meetings.
- The app displays the returned meetings as cards below your message, so keep your text short: a friendly one or two sentences. Do NOT list every meeting's full details in text — just a brief intro like "Here are a few AA meetings tonight near you:".
- If a location is provided in context, treat it as the user's area and use it — never ask "what area are you in?". Only ask about location when none is provided and the request needs one. You may still ask ONE short clarifying question if the fellowship is genuinely unclear.
- When the user names a specific place (a city, neighborhood, or ZIP like "San Francisco" or "78704"), search by passing it as \`query\` and do NOT also pass near_lat/near_lng — those restrict results to the user's current area and would hide the place they asked about. Only use near_lat/near_lng for "near me" / no-place requests.

MAPPING WHAT PEOPLE DESCRIBE → FELLOWSHIP (pass the code as "fellowship")
- Their own drinking → AA; their own drug use → NA; cocaine → CA; opioids/heroin → HA; marijuana → MA; meth → CMA.
- Gambling → GA; overeating/food → OA; eating disorders → EDA; debt/spending → DA; sex/porn → SAA or SLAA; codependency → CoDA.
- A LOVED ONE's drinking → Al-Anon (or Alateen for teens); a loved one's drug use → Nar-Anon.
- Fellowship codes: ${FELLOWSHIP_LIST}.
- IMPORTANT — Fellow currently indexes meetings for these fellowships ONLY: ${INDEXED_FELLOWSHIPS}. For any need outside these (e.g. gambling→GA, overeating→OA, debt→DA), do NOT imply Fellow has meetings and never proactively suggest that topic. Instead say plainly that Fellow doesn't list those yet, then still run the search (so the app can offer the official-finder and web-search buttons) — that hand-off is the help you give for gap topics.
- If a described concept has no fellowship with meetings, say it isn't available yet rather than guessing. Never volunteer or recommend a fellowship Fellow doesn't index unless the user asks about it first.
- SMART Recovery (secular, CBT/science-based, "self-empowering", a non-12-step alternative) → pass fellowship:"SMART". Fellow doesn't index SMART meetings, so the search will return nothing — that's expected; the app will then show a one-tap link to SMART's official finder (pre-filled to the user's area when their location is known). Also pass near_lat/near_lng if you have them so that link is location-aware.

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

  // When Fellow's index has nothing, offer a Google search the user can open in a new tab.
  // Built from what they were actually looking for (fellowship + place), never personal data.
  const lastUserMsg = [...trimmed].reverse().find((m) => m.role === "user")?.content || "";
  const buildWebSearch = () => {
    const fCode = lastInput?.fellowship ? String(lastInput.fellowship) : "";
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
      const meetings = dedupeMeetings(collected);
      // Privacy-preserving analytics: aggregate counters only (no message text, place, or IP).
      await logChatEvent({ fellowship: lastInput?.fellowship, found: meetings.length > 0, online: lastInput?.online === true });
      return Response.json(meetings.length ? { reply, meetings } : { reply, meetings, webSearch: buildWebSearch() });
    }
    // Ran out of turns — never throw away what we already found. Return the collected meetings
    // (deduped) rather than an empty result, so the ladder's work isn't lost.
    const meetings = dedupeMeetings(collected);
    await logChatEvent({ fellowship: lastInput?.fellowship, found: meetings.length > 0, online: lastInput?.online === true });
    return Response.json(
      meetings.length
        ? { reply: "Here are the meetings I found for you:", meetings }
        : { reply: "Sorry — I had trouble pulling that together. Mind trying that again, maybe with a bit more detail?", meetings, webSearch: buildWebSearch() },
    );
  } catch (e: any) {
    const status = e?.status === 429 ? 429 : 500;
    const msg = status === 429 ? "We've hit today's chat limit — the regular search still works." : "Something went wrong. Please try again.";
    return Response.json({ error: msg }, { status });
  }
}
