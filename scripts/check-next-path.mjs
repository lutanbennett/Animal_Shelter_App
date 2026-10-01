#!/usr/bin/env node
/**
 * Checks safeNextPath (src/lib/auth/next-path.ts) — the gate on the `next`
 * parameter that sends someone back to where they were going after signing
 * in. Legitimate deep links must round-trip; everything that could leave the
 * site must come back null. The hole this guards (WEB-1, 2026-09-30):
 * `/\evil.com` slipped past a `//` check, and browsers read it as `//evil.com`.
 *
 *   node scripts/check-next-path.mjs
 *
 * No database: imports the helper directly (Node strips its types). Exits 1
 * if any case is wrong.
 */
import { safeNextPath } from "../src/lib/auth/next-path.ts";

const cases = [
  // [input, expected]
  // --- legitimate deep links round-trip ---
  ["/residents", "/residents"],
  ["/residents?zone=1", "/residents?zone=1"],
  ["/residents?zone=1&q=a%20b", "/residents?zone=1&q=a%20b"],
  ["/residents/caf%C3%A9", "/residents/caf%C3%A9"],
  ["/residents/%5Cevil.com", "/residents/%5Cevil.com"],
  ["/a//b", "/a//b"],
  ["/", "/"],
  // --- a fragment does not survive ---
  ["/residents#frag", "/residents"],
  // --- off-site or ambiguous: refused ---
  ["//evil.com", null],
  ["/\\evil.com", null],
  ["/\\/evil.com", null],
  ["/\\\\evil.com", null],
  ["/residents\\evil.com", null],
  ["/residents?next=a\\b", null],
  ["http://evil.com", null],
  ["https://evil.com", null],
  ["https://evil.com/residents", null],
  ["javascript:alert(1)", null],
  ["evil.com", null],
  ["residents", null],
  ["/\t/evil.com", null],
  ["/\n/evil.com", null],
  ["/\r/evil.com", null],
  ["/res\u0000idents", null],
  ["/res\u007fidents", null],
  ["", null],
  [null, null],
  [undefined, null],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = safeNextPath(input);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(input)} -> ${JSON.stringify(got)}${ok ? "" : ` (expected ${JSON.stringify(expected)})`}`);
}

console.log(failed ? `\n${failed} failed` : `\nall ${cases.length} passed`);
process.exit(failed ? 1 : 0);
