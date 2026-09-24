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

// Three buckets, because they mean different things to whoever reads the red.
// `problems` is work that is wrong or missing. `awaiting` is a correct plan
// waiting on a person. `deferred` is a pre-production gate that cannot be true
// yet and has an owner. Printing them as one flat list made a missing signature
// look identical to a skipped check, and a red nobody can read is a red people
// learn to ignore.
const problems = [];
const awaiting = [];
const deferred = [];
const note = (file, line, msg) =>
  problems.push(file ? `${file}${line ? `:${line}` : ""} — ${msg}` : msg);
const awaits = (file, msg) => awaiting.push(`${file} — ${msg}`);

const isPlan = (f) => /^docs\/test-plans\/.+\.md$/.test(f);

// Paths where a change is probably something a shelter user would notice: the
// pages, their components, the manual and translated copy, and the Worker
// (release mail, scheduled jobs). Deliberately broad — a refactor here gets an
// `n/a: <reason>` on the release-notes line, which costs a sentence, whereas a
// user-visible change that slips past leaves the release register quietly
// untrue. Noisy in the right direction.
const USER_VISIBLE = [/^src\/app\//, /^src\/components\//, /^src\/lib\/manual\//, /^src\/lib\/i18n\//, /^worker\//];
const RELEASES = "src/lib/releases.ts";

// Paths in porcelain output, parsed by matching the status field rather than
// cutting at a fixed offset. `git()` trims the whole output, which eats the
// leading space of porcelain's ` M path` — but only on the *first* line, so a
// plan that was modified but not staged silently vanished while a second entry
// parsed fine, making it look intermittent. The failure was the worst available
// shape: it told someone who had filled in a plan that they had not, under
// instructions to copy the template over it.
const porcelainPaths = (out) =>
  out
    .split("\n")
    .map((l) => {
      const m = l.match(/^\s*\S{1,2}\s+(.*)$/);
      if (!m) return "";
      // A rename reads "old -> new"; the new path is the one on disk.
      const path = m[1].includes(" -> ") ? m[1].split(" -> ").pop() : m[1];
      return path.trim().replace(/^"|"$/g, "");
    })
    .filter(Boolean);

let changed = [];
let touched = [];
try {
  // Committed on this branch...
  const committed = git(["diff", "--name-only", "--diff-filter=AM", `${base}...HEAD`])
    .split("\n")
    .filter(isPlan);
  // ...plus anything still in the working tree, so running this locally before
  // committing does not report a false failure. In CI the tree is clean, so this
  // adds nothing.
  const working = porcelainPaths(git(["status", "--porcelain"]));
  changed = [...new Set([...committed, ...working.filter(isPlan)])];
  // Every path the PR touches, deletions included, for the release-notes check.
  touched = [
    ...new Set([...git(["diff", "--name-only", `${base}...HEAD`]).split("\n").filter(Boolean), ...working]),
  ];
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

// The lines in `unreleased`, read as text rather than imported, because the base
// side only exists as a blob. Strings are pulled out of the array literal; a
// file without the declaration (none at the base, or renamed) reads as empty.
const unreleasedLines = (src) => {
  const block = src.match(/export const unreleased\b[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) return [];
  return [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map(
    (m) => m[1] ?? m[2] ?? m[3],
  );
};
let baseReleases = "";
try {
  baseReleases = git(["show", `${git(["merge-base", base, "HEAD"])}:${RELEASES}`]);
} catch {
  // Not on the base: nothing was unreleased there.
}
let headReleases = "";
try {
  headReleases = readFileSync(RELEASES, "utf8");
} catch {
  // Deleted on this branch; every line is gone, none added.
}
const before = new Set(unreleasedLines(baseReleases));
const added = unreleasedLines(headReleases).filter((l) => !before.has(l));
const visible = touched.filter((f) => USER_VISIBLE.some((p) => p.test(f)));

// The §7 checklist line that answers "would a shelter user notice this?", found
// by its bold label so the rest of the wording can change freely. Matching on
// what it mentions instead (`unreleased` and releases.ts) caught any other line
// that talked about the register — the first plan written against this check
// failed on its own evidence notes.
const isReleaseLine = (body) => /^\*\*Release notes\.?\*\*/i.test(body.trim());
let releaseAnswered = false;
const releaseNa = [];

// A release smoke record is a different document doing a different job, and it
// belongs in docs/releases/. Filed under docs/test-plans/ it would satisfy a
// feature PR's gate with no feature verified — a green check certifying nothing.
// Rejecting it explicitly means nobody has to know the path matters.
const RELEASE_MARKERS = [/^#\s+Release smoke test/m, /^\|\s*Deployed SHA\s*\|/m, /^Result:\s*(<\s*)?pass\s*\|\s*rolled back/m];

for (const file of changed) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  if (RELEASE_MARKERS.some((m) => m.test(text))) {
    note(
      file,
      0,
      "this looks like a release smoke record, not a feature test plan — move it to " +
        "`docs/releases/<yyyy-mm-dd>.md`. A release record here would satisfy a " +
        "feature PR's gate with no feature verified",
    );
    continue;
  }

  // Fenced code blocks hold pasted evidence, and evidence routinely quotes this
  // checker's own messages — which mention `<name>` and `<yyyy-mm-dd>`. Scanning
  // inside them flags the template's placeholders in text that is a faithful
  // record of a run, so the rule requiring unedited evidence would fight the rule
  // requiring filled placeholders. Checkbox lines inside a fence are examples
  // too, and would be miscounted.
  const inFence = [];
  {
    let open = false;
    for (const l of lines) {
      if (/^\s*```/.test(l)) {
        inFence.push(true); // the fence marker itself is never content
        open = !open;
        continue;
      }
      inFence.push(open);
    }
  }

  // Template placeholders must be replaced.
  lines.forEach((l, i) => {
    if (inFence[i]) return;
    const ph = l.match(/<(feature|name|yyyy-mm-dd|pass \| [^>]+)>/);
    if (ph) note(file, i + 1, `unfilled template placeholder \`<${ph[1]}>\``);
  });

  // Every checklist line is ticked, marked `n/a: <reason>`, or — in the
  // pre-production gate only — `deferred: <owner>`.
  //
  // The deploy gates cannot be true at PR time: there is no deployed build to
  // check, no production apply to have run. Writing them `n/a` is a lie in a box
  // labelled "did not apply", and once that habit forms people write `n/a` for
  // things they simply did not do. `deferred:` says the truthful thing — not yet,
  // and here is who picks it up — and it passes, because a PR cannot be held open
  // waiting for a deploy it precedes.
  //
  // It is confined to section 8 deliberately. Anywhere else it would be a
  // general-purpose escape hatch, which is the one thing this check exists to
  // prevent.
  let boxes = 0;
  let section = "";
  lines.forEach((l, i) => {
    if (inFence[i]) return;
    const heading = l.match(/^##\s+(.*)$/);
    if (heading) section = heading[1].trim();
    const box = l.match(/^\s*-\s\[( |x|X)\]\s*(.*)$/);
    if (!box) return;
    boxes += 1;
    const body = box[2];

    // Release notes: a tick claims `unreleased` gained a line, so it is held to
    // the diff. An `n/a` is the escape hatch for a change nobody would notice,
    // and its reason is echoed in the output so a reviewer reads it.
    if (isReleaseLine(body)) {
      releaseAnswered = true;
      if (box[1] !== " " && added.length === 0) {
        note(
          file,
          i + 1,
          `release-notes line is ticked, but \`unreleased\` in ${RELEASES} gained no line in this PR — ` +
            "add one written for a shelter user, or untick it and say `n/a: <why nobody would notice>`",
        );
        return;
      }
      const na = box[1] === " " && body.match(/n\/a\s*[:\-—]\s*(.+)$/i);
      if (na && na[1].trim().length >= 3) releaseNa.push(`${file}:${i + 1} — ${na[1].trim()}`);
    }

    if (box[1] !== " ") return;

    const na = body.match(/n\/a\s*[:\-—]\s*(.+)$/i);
    if (na) {
      if (na[1].trim().length < 3) note(file, i + 1, "`n/a` with no reason given");
      return;
    }

    // Match on the word, not on a well-formed `deferred: <owner>`, so a bare
    // `deferred:` reports its missing owner rather than falling through and
    // complaining that it is not an `n/a`.
    if (/\bdeferred\b/i.test(body)) {
      const def = body.match(/deferred\s*[:\-—]\s*(.+)$/i);
      if (!/pre-production/i.test(section)) {
        note(
          file,
          i + 1,
          `\`deferred:\` is only for the pre-production gate, not "${section}" — ` +
            "everywhere else a check is run, `n/a: <reason>`, or not done",
        );
      } else if (!def || def[1].trim().length < 3) {
        note(file, i + 1, "`deferred` with no owner — say who picks it up");
      } else {
        deferred.push(`${file}:${i + 1} — ${def[1].trim()}`);
      }
      return;
    }

    note(file, i + 1, `unticked and not marked \`n/a: <reason>\`: "${body.slice(0, 60)}"`);
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

  // Two signatures, certifying different things. The automated line may be
  // signed by whoever ran the scripts; the manual line is signed by the person
  // who actually looked, or marked `n/a: <reason>` when there was nothing to
  // look at. Neither is allowed to stand in for the other, because a signature
  // that does not correspond to someone having looked turns an unknown into a
  // false assurance.
  //
  // A signed line is anchored on `Date:`, so an empty name cannot be satisfied by
  // the date text that follows it. But `n/a:` and `pending:` carry no date, and
  // requiring a meaningless `Date: —` after them made the error message point at
  // the missing `Date:` rather than at anything real. So: try the dated form
  // first, and fall back to a bare line only when the value is an `n/a` or a
  // `pending` — a bare *name* still has to carry its date.
  for (const label of ["Automated checks by", "Manual verification by"]) {
    const dated = text.match(new RegExp(`^${label}:[ \\t]*(.*?)[ \\t]{2,}Date:[ \\t]*(.*)$`, "m"));
    const bare = text.match(new RegExp(`^${label}:[ \\t]*(.+)$`, "m"));
    const undatedOk = !dated && bare && /^(n\/a|pending)\b/i.test(bare[1].trim());
    const signoff = dated ?? (undatedOk ? [bare[0], bare[1], ""] : null);
    if (!signoff) {
      note(file, 0, `no \`${label}: <name>  Date: <yyyy-mm-dd>\` line`);
      continue;
    }
    const who = signoff[1].trim();
    const when = signoff[2].trim();

    // Anything starting `n/a` is an n/a signature and is judged as one, so a
    // bare `n/a:` reports the missing reason rather than falling through to the
    // date check and complaining about the wrong thing.
    if (/^n\/a\b/i.test(who)) {
      const na = who.match(/^n\/a\s*[:\-—]\s*(.+)$/i);
      if (!na || na[1].trim().length < 3) {
        note(file, 0, `\`${label}:\` marked n/a with no reason — say why there was nothing to check`);
      }
      continue; // An n/a signature carries no date.
    }

    // `pending: <what is outstanding>` is a real state, distinct from a badly
    // filled-in plan: the work is done and something genuinely needs a person.
    // It still fails — nobody has looked yet — but it says so in those words, so
    // a red check stays legible instead of looking like sloppiness. An illegible
    // red is one people learn to ignore.
    if (/^pending\b/i.test(who)) {
      const p = who.match(/^pending\s*[:\-—]\s*(.+)$/i);
      if (!p || p[1].trim().length < 3) {
        note(file, 0, `\`${label}:\` is pending with no detail — say what is outstanding`);
      } else {
        awaits(file, `${label.toLowerCase()}: ${p[1].trim()}`);
      }
      continue; // Pending carries no date.
    }

    if (who.length < 2 || /^_+$/.test(who)) {
      note(file, 0, `\`${label}:\` is empty — say who did this, \`n/a: <reason>\`, or \`pending: <what is outstanding>\``);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(when)) {
      note(file, 0, `\`${label}\` date must be yyyy-mm-dd — got "${when}"`);
    }
  }
}

// The combination that emptied the register before 0.1.0: pages changed, no
// `unreleased` line, and nobody asked. A plan copied from a template older than
// the release-notes line has nowhere to answer, so it is asked here instead.
const shown = visible.slice(0, 3).join(", ") + (visible.length > 3 ? `, +${visible.length - 3} more` : "");
if (visible.length && added.length === 0 && !releaseAnswered) {
  note(
    null,
    0,
    `this PR touches ${shown} and adds nothing to \`unreleased\` in ${RELEASES}, and no test plan ` +
      "has the §7 release-notes line — copy it from docs/test-plan-template.md and tick it with a " +
      "line added, or say `n/a: <why nobody would notice>`",
  );
}
const releaseNote =
  visible.length && added.length === 0 && releaseNa.length
    ? `\nNo release note, on the plan's word (touches ${shown}):\n` + releaseNa.map((r) => `  ${r}`).join("\n")
    : "";

// Say plainly which of the two reds this is. A correct plan is red for most of
// its life — it cannot be signed until a person has looked — so "red" on its own
// carries no information. The headline says whether anyone needs to fix
// something or merely to look.
const deferredNote = deferred.length
  ? `\n${deferred.length} pre-production gate(s) deferred to release:\n` +
    deferred.map((d) => `  ${d}`).join("\n")
  : "";

if (problems.length) {
  console.error(
    `check-test-plan: ${problems.length} problem(s)` +
      (awaiting.length ? `, and ${awaiting.length} item(s) awaiting a person` : "") +
      "\n",
  );
  for (const p of problems) console.error(`  ${p}`);
  if (awaiting.length) {
    console.error("\nAwaiting a person (not a defect — nobody has looked yet):");
    for (const a of awaiting) console.error(`  ${a}`);
  }
  console.error(deferredNote + releaseNote);
  console.error("\nEvery line is ticked, `n/a: <reason>`, or — in the pre-production gate — `deferred: <owner>`.");
  process.exit(1);
}

// A plan that is complete and correct but unsigned is the normal state for most
// of a PR's life, so it does NOT fail: red was permanent, and a permanent red is
// one people filter rather than act on (the reason ci.yml carried
// `continue-on-error: true` until 2026-09-24). The waiting is still printed, and
// still has to be resolved before the release manager deploys — it is just not
// the CI job's job to shout about it. Red now means a plan that is missing,
// incomplete or self-contradictory, which is always someone's mistake to fix.
if (awaiting.length) {
  console.log(`check-test-plan: the plan is complete and correct, and ${awaiting.length} item(s) await a person:\n`);
  for (const a of awaiting) console.log(`  ${a}`);
  console.log(deferredNote + releaseNote);
  console.log("\nNothing to fix. A person still has to look and sign before this ships.");
  process.exit(0);
}

console.log(`check-test-plan: ok — ${changed.join(", ")}${deferredNote}${releaseNote}`);
