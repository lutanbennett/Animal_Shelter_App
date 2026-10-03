#!/usr/bin/env node
/**
 * The manual-verification queue, read out of docs/test-plans/ and sorted.
 *
 *   node scripts/verification-queue.mjs            # the summary
 *   node scripts/verification-queue.mjs --items    # every item, grouped
 *   node scripts/verification-queue.mjs --kind work|closable|deploy|read|look
 *
 * Why this exists: on 2026-10-03 a count found 151 of 260 plans carrying
 * `Manual verification by: pending`, 455 items between them, the oldest from
 * 2026-09-24, and only 40 plans ever signed by a person. Nobody had read the
 * queue because reading it meant opening 151 files. A list written by hand
 * would have been stale the next day, which is the failure this whole exercise
 * is about, so it is a script instead.
 *
 * The important finding was not the size. It was that the queue holds three
 * different kinds of thing and only one of them is verification:
 *
 *   work     — a task someone must DO, written as if it were a check.
 *              "Turn off open sign-up in Supabase, dev and production."
 *              Nobody does these, because a queue of checks is read (when it is
 *              read at all) as a list of things to confirm, not to perform.
 *              These are the rows that matter most and the rows most likely to
 *              be skimmed past.
 *   closable — already true, never signed. The evidence is usually in CI or in
 *              a later plan.
 *   deploy   — a release-time gate. docs/test-plan-template.md says these do
 *              NOT belong in the handover table: they have their own
 *              `deferred: <owner>` state in section 8, and listing them twice
 *              gives them a second home nothing ever closes.
 *   read     — read a document, agree a recommendation, answer an open question.
 *   look     — a person at a screen, a phone, or a page in Thai.
 *
 * The classification is by regex over the item's own words, so it is a sorting
 * aid, not a verdict: re-read anything it calls `work` before trusting it, and
 * expect `look` to over-collect. It deliberately does not write to any plan.
 */
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(REPO, "docs", "test-plans");

const git = (...a) => {
  try {
    return execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

// `pending` with or without the colon: one plan writes `pending —`, and the
// checker accepts it, so the queue has to see it too.
const PENDING = /^pending\b/i;

const KINDS = [
  ["work", /\bturn (off|on)\b|\badd (repository )?secrets?\b|\bgenerate the\b|\brotate\b|\benrol|\bset up\b|\bput `?[A-Z_]{4,}`? in\b|\bcreate (a|the) \w+ (in|on) (supabase|google|cloudflare)/i],
  ["deploy", /after (the )?deploy|once (this|it) is deployed|the drill|cloudflared|post-deploy|at deploy time/i],
  ["read", /read the|reading the|wording|agree|decide whether|confirm the (table|recommendation)|judge|\bL\d+\b|paper\b/i],
  ["look", /real phone|375|on a phone|browser|in thai|by eye|on site|screen|looks? right|visually|both languages/i],
];
const SECURITY = /password|sign-?in|sign-?out|\bauth\b|permission|\btoken\b|secret|\bmfa\b|\b2fa\b|\brls\b|access request|takeover|sign-?up/i;

export function readQueue() {
  const plans = [];
  for (const f of readdirSync(DIR).filter((x) => x.endsWith(".md"))) {
    const src = readFileSync(join(DIR, f), "utf8").replace(/\r\n/g, "\n");
    const sig = src.match(/^Manual verification by:(.*)$/m)?.[1]?.trim() ?? "";
    if (!PENDING.test(sig)) continue;

    const section = src.split(/^## Left for manual verification\s*$/m)[1]?.split(/^## /m)[0] ?? "";
    const items = section
      .split("\n")
      .filter((l) => l.trim().startsWith("|"))
      .filter((l) => !/^\|\s*-+/.test(l.trim()))
      .filter((l) => !/\|\s*#\s*\|/.test(l))
      .map((l) => l.split("|").map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1))
      .filter((c) => c.length >= 2 && c.slice(1).join("").length > 3)
      .map((c) => c.slice(1).join(" — ").replace(/\s+/g, " "));

    const plan = f.replace(/\.md$/, "");
    const added = git("log", "--format=%as", "--diff-filter=A", "-1", "--", `docs/test-plans/${f}`);
    plans.push({
      plan,
      added,
      pending: sig,
      items: items.map((text) => ({
        text,
        kind: KINDS.find(([, re]) => re.test(text))?.[0] ?? "look",
        security: SECURITY.test(text),
      })),
    });
  }
  return plans;
}

const args = process.argv.slice(2);
const plans = readQueue();
const all = plans.flatMap((p) => p.items.map((i) => ({ ...i, plan: p.plan, added: p.added })));

const kindArg = args.indexOf("--kind");
if (kindArg !== -1) {
  const want = args[kindArg + 1];
  for (const i of all.filter((x) => x.kind === want).sort((a, b) => (b.added || "").localeCompare(a.added || "")))
    console.log(`[${i.added}] ${i.plan}${i.security ? " *" : ""}\n    ${i.text}\n`);
  process.exit(0);
}

console.log(`plans with an unsigned manual-verification line: ${plans.length}`);
console.log(`items in them: ${all.length}`);
console.log(`of which security-flavoured: ${all.filter((i) => i.security).length}`);
console.log("\nby kind:");
for (const [kind] of [...KINDS, ["look"]].filter((k, i, a) => a.findIndex((x) => x[0] === k[0]) === i))
  console.log(`  ${kind.padEnd(9)} ${all.filter((i) => i.kind === kind).length}`);
console.log(`\noldest: ${all.map((i) => i.added).filter(Boolean).sort()[0]}`);
console.log("\nthe `work` rows are tasks nobody has done, not checks nobody has made:");
for (const i of all.filter((x) => x.kind === "work").sort((a, b) => (b.added || "").localeCompare(a.added || "")).slice(0, 12))
  console.log(`  [${i.added}] ${i.plan}${i.security ? " *" : ""} — ${i.text.slice(0, 120)}`);

if (args.includes("--items")) {
  for (const p of plans.sort((a, b) => (b.added || "").localeCompare(a.added || ""))) {
    console.log(`\n== ${p.plan} (${p.added}) — ${p.items.length} item(s)`);
    for (const i of p.items) console.log(`   [${i.kind}]${i.security ? " *" : ""} ${i.text.slice(0, 160)}`);
  }
}
