/**
 * Which live database refusals can a shelter worker meet? Classification for
 * docs/decisions/2026-11-03-sql-refusal-english-count.md, kept as data and grouped by REASON,
 * the shape of english-in-ts-classes.mjs. Rules are tried in order; first match wins. Each
 * function (not each message) is classified, and its messages inherit the class.
 *
 *   "user"       a src file calls the function and forwards the error's message to the screen.
 *   "maybe"      reachable, caller not settled: a trigger (fires on ANY write to its table, the writers are
 *                not traced), only called from other SQL, or a caller file that both forwards and masks.
 *   "masked"     a src file calls it but only through databaseFailure()/unexpectedFailure() or never reads
 *                .message, so the English goes to the server log and the person sees dictionary words.
 *   "developer"  nothing in src/ or worker/ names it and no trigger fires it.
 *
 * Input per function: { isTrigger, srcCallers: [{rel, forwardsMessage, masksMessage}], sqlCallers: [name] }
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { readMigrations, liveFunctions, messagesOf } from "./sql-refusals.mjs";

export const CLASSES = [
  { id: "trigger", reads: "maybe", why: "A trigger function fires on any write to its table, from any app path or a hand-run script. Which writers hit each guard is not traced.", match: (f) => f.isTrigger },
  { id: "called-and-forwarded", reads: "user", why: "A src file calls it by name and passes error.message (or a value derived from it) into what the person sees. Every caller forwards.", match: (f) => f.srcCallers.length > 0 && f.srcCallers.every((c) => c.forwardsMessage && !c.masksMessage) },
  { id: "called-forwarded-and-masked", reads: "maybe", why: "A calling file both forwards a message somewhere and masks another, or only some callers forward; which one this rpc takes is not traced.", match: (f) => f.srcCallers.some((c) => c.forwardsMessage) },
  { id: "called-and-masked", reads: "masked", why: "Callers never forward .message: the English reaches the log, not the screen.", match: (f) => f.srcCallers.length > 0 },
  { id: "sql-only-caller", reads: "maybe", why: "No src file names it, but another live SQL function calls it; the message surfaces through that function.", match: (f) => f.sqlCallers.length > 0 },
  { id: "uncalled", reads: "developer", why: "No src/worker file names it, no trigger, no SQL caller. A person cannot reach it through the app.", match: () => true },
];

export function classify(f) {
  return CLASSES.find((c) => c.match(f));
}

/**
 * Every live function with a refusal, classified. Shared by scripts/measure-sql-refusals.mjs (the count) and
 * scripts/check-sql-refusal-keys.mjs (the gate), so there is one parser and one caller search, not two.
 * Returns { rows: [{ f, m, cls, srcCallers }], live, rawHits, doBlocks }.
 */

// A caller file "forwards" when it hands an error's .message to what the person sees; "masks" when it uses the
// dictionary-worded helpers in src/lib/action-result.ts. Both are per FILE, not per call: a stated limit.
// A file that routes the error through dbRefusal() (src/lib/db-refusal.ts) shows the person the error, worded from
// the dictionary when it carries a key, so it counts as forwarding: the class is about what reaches the screen.
export const FORWARDS = /(?:error|reason|message)\s*:\s*[\w.?]*[eE]rr(?:or)?\??\.message|refuse\(\s*(?:await \w+\()?[\w.?]*\.message|return\s+[\w.?]*[eE]rr(?:or)?\??\.message|new Error\([^)]*\.message|dbRefusal\(/;
export const MASKS = /databaseFailure\(|unexpectedFailure\(/;

function walk(d, o = []) {
  for (const e of readdirSync(d)) {
    if (e === "node_modules" || e === ".next") continue;
    const f = path.join(d, e);
    if (statSync(f).isDirectory()) walk(f, o);
    else if (/\.(ts|tsx|mjs)$/.test(f) && !/\.test\./.test(f)) o.push(f);
  }
  return o;
}

export function classifyLiveRefusals(root) {
  const files = [...walk(path.join(root, "src")), ...walk(path.join(root, "worker"))].map((f) => ({
    rel: path.relative(root, f).replaceAll("\\", "/"),
    text: readFileSync(f, "utf8"),
  }));
  const { live, rawHits, doBlocks } = liveFunctions(readMigrations(path.join(root, "supabase/migrations")));
  const rows = [];
  for (const f of live) {
    const m = messagesOf(f.body);
    if (!m.all) continue;
    const q = [`"${f.name}"`, `'${f.name}'`, "`" + f.name + "`"];
    const srcCallers = files
      .filter((x) => q.some((s) => x.text.includes(s)))
      .map((x) => ({ rel: x.rel, forwardsMessage: FORWARDS.test(x.text), masksMessage: MASKS.test(x.text) }));
    const sqlCallers = live.filter((g) => g !== f && g.body.includes(f.name + "(")).map((g) => g.name);
    const cls = classify({ isTrigger: /trigger/i.test(f.returns), srcCallers, sqlCallers });
    rows.push({ f, m, cls, srcCallers });
  }
  return { rows, live, rawHits, doBlocks };
}
