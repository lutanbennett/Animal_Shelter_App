#!/usr/bin/env node
/**
 * Fails if this app starts using `next/og` while Next is below the patched version.
 *
 * GHSA-vcvr-r3jv-pc5j is a remote code execution in `next/og` `ImageResponse`,
 * affecting next 16.2.0 - 16.3.5 and fixed in 16.3.8. We are on 16.3.8 and
 * nothing in `src/` or `worker/` uses the API, so today this prints nothing and
 * passes. It exists for the person who adds an Open Graph image later without
 * knowing any of that: the warning lives in the path of the work, not in a
 * closed backlog item. See docs/decisions/2026-10-07-next-og-warning-lives-in-lint.md.
 *
 * It does NOT fail merely because `next/og` appears: with a patched Next that is
 * fine, and a check that cried wolf would be deleted. It fails on the dangerous
 * combination — usage present and Next older than FIXED — so it also catches a
 * downgrade (a stray `npm audit fix --force`, a bad lockfile merge) after the
 * feature exists.
 *
 *   node scripts/check-next-og.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const FIXED = [16, 3, 8];
const root = fileURLToPath(new URL("..", import.meta.url));

const installed = JSON.parse(readFileSync(join(root, "node_modules/next/package.json"), "utf8")).version;
const have = installed.split(/[.-]/).slice(0, 3).map(Number);
// First differing part decides; equal means not behind.
const i = have.findIndex((n, k) => n !== FIXED[k]);
const behind = i !== -1 && have[i] < FIXED[i];

// Convention files that use ImageResponse implicitly, with no import to grep for.
const CONVENTION = /^(opengraph-image|twitter-image|icon|apple-icon)(\d*)\.(tsx?|jsx?)$/;
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (CONVENTION.test(name)) hits.push(`${relative(root, p)} (generated-image convention file)`);
    else if (CODE.test(name) && /next\/og|ImageResponse/.test(readFileSync(p, "utf8"))) {
      hits.push(`${relative(root, p)} (mentions next/og or ImageResponse)`);
    }
  }
}
for (const d of ["src", "worker"]) walk(join(root, d));

if (hits.length && behind) {
  console.error(
    `check-next-og: next ${installed} is older than ${FIXED.join(".")} and the app uses next/og:\n` +
      hits.map((h) => `  - ${h}`).join("\n") +
      "\nGHSA-vcvr-r3jv-pc5j is a remote code execution in ImageResponse. Bump next to " +
      `${FIXED.join(".")} or later first. See docs/decisions/2026-10-01-next-og-advisory-handled-as-routine.md.`,
  );
  process.exit(1);
}
