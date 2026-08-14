// Routing invariants for the "which support group is right for me?" flow.
//
// Zero-dependency guard (Node's built-in test runner). The routing data lives in TypeScript under
// src/lib with a "@/..." path alias that plain Node can't resolve, so instead of importing the
// modules we read them as text and assert on the data the chatbot's "Groups that might fit" chips
// and the /support-groups CTAs depend on. This catches the drift that tsc can't: a problem that
// references a fellowship CODE that doesn't exist (→ a chip/CTA pointing at a 404 /[fellowship]
// page), or a code collision that would break BY_CODE / CODE_BY_SLUG normalization.
//
//   node --test scripts/            # runs this + the other scripts/ tests
//   node scripts/lib/routing.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const problemsSrc = read("../../src/lib/problems.ts");
const fellowshipsSrc = read("../../src/lib/fellowships.ts");

// Every `code: "X"` in fellowships.ts is a real fellowship (drives fellowshipName + the statically
// generated /[fellowship] pages). Every `code: "X"` in problems.ts is a route the router points to.
const fellowshipCodesRaw = [...fellowshipsSrc.matchAll(/code:\s*"([^"]+)"/g)].map((m) => m[1]);
const fellowshipCodes = new Set(fellowshipCodesRaw);
const problemCodes = [...problemsSrc.matchAll(/code:\s*"([^"]+)"/g)].map((m) => m[1]);

test("parsing sanity — the regexes actually found the data", () => {
  assert.ok(fellowshipCodes.size >= 25, `expected ≥25 fellowship codes, got ${fellowshipCodes.size}`);
  assert.ok(problemCodes.length >= 20, `expected ≥20 problem route codes, got ${problemCodes.length}`);
});

test("every fellowship code is unique (BY_CODE has no clobbered entries)", () => {
  const dups = fellowshipCodesRaw.filter((c, i) => fellowshipCodesRaw.indexOf(c) !== i);
  assert.deepEqual([...new Set(dups)], [], `duplicate fellowship codes: ${[...new Set(dups)].join(", ")}`);
});

test("lowercased codes are unique (CODE_BY_SLUG + /[fellowship] slugs can't collide)", () => {
  const lower = fellowshipCodesRaw.map((c) => c.toLowerCase());
  const dups = lower.filter((c, i) => lower.indexOf(c) !== i);
  assert.deepEqual([...new Set(dups)], [], `codes collide when lowercased: ${[...new Set(dups)].join(", ")}`);
});

test("every problem routes only to real fellowships (no chip/CTA → 404 page)", () => {
  const unknown = [...new Set(problemCodes.filter((c) => !fellowshipCodes.has(c)))];
  assert.deepEqual(unknown, [], `problems.ts references fellowship codes with no page: ${unknown.join(", ")}`);
});
