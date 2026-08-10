// Fellow chatbot — phase 2a. A serverless route that runs Claude (Haiku) with a
// `search_meetings` tool over the Typesense index. The model may only present meetings
// the tool returns; it never invents them. Returns { reply, meetings }.
import Anthropic from "@anthropic-ai/sdk";
import { searchMeetings, type MeetingResult } from "@/lib/serverSearch";
import { FELLOWSHIPS } from "@/lib/fellowships";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const FELLOWSHIP_LIST = FELLOWSHIPS.map((f) => `${f.code} = ${f.name}`).join("; ");

const SYSTEM = `You are Fellow, a warm, concise assistant that helps people find 12-step recovery meetings.

HOW YOU WORK
- Use the search_meetings tool to find meetings. You may ONLY tell the user about meetings the tool returns — never invent a meeting, time, address, or link. If the tool returns nothing, say so plainly and offer to widen the area, try another day/time, or show online meetings.
- The app displays the returned meetings as cards below your message, so keep your text short: a friendly one or two sentences. Do NOT list every meeting's full details in text — just a brief intro like "Here are a few AA meetings tonight near you:".
- If a location is provided in context, treat it as the user's area and use it — never ask "what area are you in?". Only ask about location when none is provided and the request needs one. You may still ask ONE short clarifying question if the fellowship is genuinely unclear.

MAPPING WHAT PEOPLE DESCRIBE → FELLOWSHIP (pass the code as "fellowship")
- Their own drinking → AA; their own drug use → NA; cocaine → CA; opioids/heroin → HA; marijuana → MA; meth → CMA.
- Gambling → GA; overeating/food → OA; eating disorders → EDA; debt/spending → DA; sex/porn → SAA or SLAA; codependency → CoDA.
- A LOVED ONE's drinking → Al-Anon (or Alateen for teens); a loved one's drug use → Nar-Anon.
- Fellowship codes: ${FELLOWSHIP_LIST}.
- If a described concept has no fellowship with meetings, say it isn't available yet rather than guessing.

SCOPE & CARE
- You help find meetings. You are NOT a therapist and do not give medical, clinical, or legal advice.
- Fellow is independent and not affiliated with any fellowship; remind people to confirm details with the group.
- Respect anonymity — never ask for identifying details.
- If someone expresses crisis, self-harm, or is in danger, respond with brief compassion and share: 988 Suicide & Crisis Lifeline (call or text 988), and SAMHSA's free 24/7 National Helpline 1-800-662-4357. Then still offer to find a meeting if they'd like.`;

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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "Chat isn't configured yet." }, { status: 503 });

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

  try {
    for (let i = 0; i < 3; i++) {
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
          const found = await searchMeetings((block.input || {}) as any);
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
      // De-dupe collected meetings by id, keep first ~12.
      const seen = new Set<string>();
      const meetings = collected.filter((m) => (m.id && !seen.has(m.id) ? (seen.add(m.id), true) : false)).slice(0, 12);
      return Response.json({ reply, meetings });
    }
    return Response.json({ reply: "Sorry — I had trouble pulling that together. Try rephrasing?", meetings: [] });
  } catch (e: any) {
    const status = e?.status === 429 ? 429 : 500;
    const msg = status === 429 ? "We've hit today's chat limit — the regular search still works." : "Something went wrong. Please try again.";
    return Response.json({ error: msg }, { status });
  }
}
