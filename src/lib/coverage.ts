// Server-only: build-time aggregation of the ingested meetings into per-state, per-fellowship
// counts for the /coverage heat map. Reads the same dataset as cities.ts; memoized so the
// ~8MB file is parsed once per build. Mirrors cities.ts's raw-or-gzip read + state parsing.
import "server-only";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "),
);

// Pull the 2-letter state out of a formatted address ("…, Melbourne, FL 32903, USA").
function stateOf(address: string): string | null {
  if (!address) return null;
  const parts = String(address).split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const m = parts[i].match(/^([A-Z]{2})\b/);
    if (m && US_STATES.has(m[1])) return m[1];
  }
  return null;
}

export type Coverage = {
  total: number;                                   // all meetings (in-person + online)
  placed: number;                                  // in-person meetings mapped to a state
  online: number;                                  // online meetings (not placed)
  statesCovered: number;                           // states+DC with ≥1 in-person meeting
  fellowships: string[];                           // codes, biggest in-person first
  inPerson: Record<string, number>;                // in-person total per fellowship (map totals)
  byState: Record<string, Record<string, number>>; // ST -> { <code>: n, __all: n }
};

let _cache: Coverage | null = null;

export async function getCoverage(): Promise<Coverage> {
  if (_cache) return _cache;
  let raw: any[] = [];
  const dir = path.join(process.cwd(), "public", "data");
  try {
    raw = JSON.parse(await readFile(path.join(dir, "meetings.json"), "utf8"));
  } catch {
    try { raw = JSON.parse(gunzipSync(await readFile(path.join(dir, "meetings.json.gz"))).toString("utf8")); }
    catch { raw = []; }
  }

  const byState: Record<string, Record<string, number>> = {};
  const inPerson: Record<string, number> = {};
  let placed = 0, online = 0;
  for (const m of raw) {
    const f = m.fellowship || "?";
    if (m.online) { online++; continue; }
    const st = stateOf(m.address);
    if (!st) continue;
    placed++;
    inPerson[f] = (inPerson[f] || 0) + 1;
    const s = (byState[st] ||= {});
    s[f] = (s[f] || 0) + 1;
    s.__all = (s.__all || 0) + 1;
  }
  const fellowships = Object.keys(inPerson).sort((a, b) => inPerson[b] - inPerson[a]);
  _cache = {
    total: raw.length, placed, online,
    statesCovered: Object.keys(byState).length,
    fellowships, inPerson, byState,
  };
  return _cache;
}
