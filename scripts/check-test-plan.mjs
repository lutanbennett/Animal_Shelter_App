// Enforces CLAUDE.md's "no merge without a signed-off test checklist".
//
// A PR must add or update a completed docs/test-plans/<feature>.md. There are no
// exemptions: a small change is not excused from the checklist, it just fills it
// out quickly, because most lines are honestly `n/a`. The point of the rule is
// that someone looked at every line and said why it did not apply — so an
// untouched `- [ ]` fails, and so does an `n/a` with no reason after it.
//
//   node scripts/check-test-plan.mjs                 # against origin/main
//   node scripts/check-test-plan.mjs --base <ref>
//
// CI runs this on pull requests (.github/workflows/ci.yml, job `test-plan`).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
const base =
  baseArg !== -1
    ? args[baseArg + 1]
    : process.env.GITHUB_BASE_REF
      ? `origin/${process.env.GITHUB_BASE_REF}`
      : "origin/main";

const git = (a) => execFileSync("git", a, { encoding: "utf8" }).trim();

const problems = [];
const note = (file, line, msg) =>
  problems.push(file ? `${file}${line ? `:${line}` : ""} — ${msg}` : msg);

const isPlan = (f) => /^docs\/test-plans\/.+\.md$/.test(f);

let changed = [];
try {
  // Committed on this branch...
  const committed = git(["diff", "--name-only", "--diff-filter=AM", `${base}...HEAD`])
    .split("\n")
    .filter(isPlan);
  // ...plus anything still in the working tree, so running this locally before
  // committing does not report a false failure. In CI the tree is clean, so this
  // adds nothing.
  const working = git(["status", "--porcelain", "--", "docs/test-plans"])
    .split("\n")
    .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""))
    .filter(isPlan);
  changed = [...new Set([...committed, ...working])];
} catch {
  console.error(
    `check-test-plan: cannot diff against ${base}. Fetch it first ` +
      `(git fetch origin main) or pass --base <ref>.`,
  );
  process.exit(2);
}

if (changed.length === 0) {
  console.error(
    [
      "check-test-plan: no completed test plan in this PR.",
      "",
      "  cp docs/test-plan-template.md docs/test-plans/<feature>.md",
      "",
      "Fill it in, tick what you ran, and mark the rest `n/a: <reason>`.",
      "There is no exemption for small changes — a docs-only or schema-only",
      "change is mostly `n/a`, and writing those reasons is the check.",
    ].join("\n"),
  );
  process.exit(1);
}

const RESULTS = ["pass", "pass with accepted defects", "fail"];

for (const file of changed) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  // Template placeholders must be replaced.
  lines.forEach((l, i) => {
    const ph = l.match(/<(feature|name|yyyy-mm-dd|pass \| [^>]+)>/);
    if (ph) note(file, i + 1, `unfilled template placeholder \`<${ph[1]}>\``);
  });

  // Every checklist line is ticked, or marked n/a with a reason.
  let boxes = 0;
  lines.forEach((l, i) => {
    const box = l.match(/^\s*-\s\[( |x|X)\]\s*(.*)$/);
    if (!box) return;
    boxes += 1;
    if (box[1] !== " ") return;
    const na = box[2].match(/n\/a\s*[:\-—]\s*(.+)$/i);
    if (!na) {
      note(file, i + 1, `unticked and not marked \`n/a: <reason>\`: "${box[2].slice(0, 60)}"`);
    } else if (na[1].trim().length < 3) {
      note(file, i + 1, "`n/a` with no reason given");
    }
  });
  if (boxes === 0) note(file, 0, "no checklist items found — is this a copy of the template?");

  // Sign-off.
  const result = text.match(/^Result:\s*(.+?)\s*$/m);
  if (!result) {
    note(file, 0, "no `Result:` line");
  } else {
    const value = result[1].replace(/\*\*/g, "").trim().toLowerCase();
    if (!RESULTS.includes(value)) {
      note(file, 0, `Result must be one of ${RESULTS.map((r) => `"${r}"`).join(", ")} — got "${result[1]}"`);
    } else if (value === "fail") {
      note(file, 0, "Result is `fail` — a failing test plan does not merge");
    }
  }

  // Anchor on `Date:` so an empty name cannot be satisfied by the date text
  // that follows it on the same line.
  const signoff = text.match(/^Tested by:[ \t]*(.*?)[ \t]{2,}Date:[ \t]*(.*)$/m);
  if (!signoff) {
    note(file, 0, "no `Tested by: <name>  Date: <yyyy-mm-dd>` line");
  } else {
    const [, who, when] = signoff;
    if (who.trim().length < 2 || /^_+$/.test(who.trim())) {
      note(file, 0, "`Tested by:` is empty — say who ran this");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(when.trim())) {
      note(file, 0, `\`Date:\` must be yyyy-mm-dd — got "${when.trim()}"`);
    }
  }
}

if (problems.length) {
  console.error(`check-test-plan: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("\nEvery line is ticked or `n/a: <reason>`. No exemptions.");
  process.exit(1);
}

console.log(`check-test-plan: ok — ${changed.join(", ")}`);
