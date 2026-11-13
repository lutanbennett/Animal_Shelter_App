// Enforces CLAUDE.md's migration numbering: a new file under
// supabase/migrations/ is numbered exactly one past the highest on origin/main
// (two new files: the next two), and no two files share a number. Raised after
// two in-flight branches both shipped 0067, and then two both shipped 0069 and
// were both applied to dev before anyone noticed (backlog, 2026-09-22). Prose
// said the same thing throughout; nothing checked it.
//
//   node scripts/check-migration-numbers.mjs              # HEAD against origin/main
//   node scripts/check-migration-numbers.mjs --base <ref>
//   node scripts/check-migration-numbers.mjs --staged     # the index — .githooks/pre-commit
//
// The hook and CI (.github/workflows/ci.yml, job `migration-numbers`) both run
// this file, so they cannot disagree. What a migration file is, and how the
// origin/main list is read, comes from scripts/lib/migrations.mjs — the same
// code apply-migrations.mjs --drift uses. The boundary between the two: this
// compares files with files, before anything reaches a database; --drift
// compares a database's schema_migrations rows with origin/main's files, after.
//
// "New" means a name that is not on origin/main. Editing an applied file is
// forbidden too, but that is a different rule and not checked here; a commit
// that touches no migration file is never judged.
//
// --staged fails OPEN. A checked-in pre-commit hook runs in every worktree on
// the machine as soon as it merges, so a false positive — or a crash — would
// stop commits in every live stream at once, for people who have never heard
// of this script. So in the hook:
//   - a commit that adds no file under supabase/migrations/ exits at once;
//   - no origin/main, or any unexpected error, prints why and lets the commit through;
//   - it never fetches (slow on every commit, and fails offline), so when the
//     last fetch is over STALE_HOURS old a problem is printed as a warning and
//     the commit goes through — the local ref may simply not know what main
//     holds now. CI checks against a fresh origin/main either way.
// A refusal exits 1, or 3 under --staged: the hook blocks on 3 alone, so node
// dying before it reaches a verdict (exit 1 from a syntax error or a broken
// import) lets the commit through rather than reading as a refusal.
// Deliberately bypassing it is `git commit --no-verify`; CI will still say.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { MIGRATION_NAME, MIGRATIONS_DIR, KNOWN_DUPLICATES, collisionsWithOpenPrs, duplicateNumbers, numbersClaimedByOpenPrs, numberOf, parseLsTree } from "./lib/migrations.mjs";

const STALE_HOURS = 24;

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const baseArg = args.indexOf("--base");
const base = baseArg >= 0 ? args[baseArg + 1] : "origin/main";
const valueOf = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
// Fixtures for proving the checks: --names-file lists file names (one per line) in place of HEAD's tree,
// --prs-file is `gh pr list --json number,headRefName,files` output in place of the network, --branch names the PR.
const namesFile = valueOf("--names-file");
const prsFile = valueOf("--prs-file");
const branchArg = valueOf("--branch");
const noPrs = args.includes("--no-prs");
const flagValues = new Set(["--base", "--names-file", "--prs-file", "--branch"]);
const unknown = args.filter((a, i) => !["--staged", "--no-prs", ...flagValues].includes(a) && !flagValues.has(args[i - 1]));
if (unknown.length || (baseArg >= 0 && !base)) {
  console.error("usage: node scripts/check-migration-numbers.mjs [--staged] [--base <ref>] [--no-prs]");
  process.exit(2);
}

const TAG = "migration numbers";
const REFUSED = staged ? 3 : 1;

function git(gitArgs) {
  const r = spawnSync("git", gitArgs, { encoding: "utf8" });
  if (r.error) throw r.error;
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

// In the hook, anything that stops us from giving a verdict lets the commit
// through; by hand or in CI it is an error, because there is nobody to wedge.
function cannotCheck(why) {
  if (staged) {
    console.error(`${TAG}: not checked — ${why}. Commit allowed; CI checks the PR.`);
    process.exit(0);
  }
  console.error(`${TAG}: ${why}`);
  process.exit(2);
}

const pad = (n) => String(n).padStart(4, "0");
const basename = (path) => path.slice(MIGRATIONS_DIR.length + 1);

/** Hours since anything last fetched or pushed origin/main, or null if unknown. */
function hoursSinceFetch() {
  const times = [];
  for (const p of [git(["rev-parse", "--git-path", "FETCH_HEAD"]).out, `${git(["rev-parse", "--git-common-dir"]).out}/FETCH_HEAD`]) {
    try {
      times.push(statSync(p).mtimeMs);
    } catch {
      // No fetch recorded there.
    }
  }
  const reflog = git(["reflog", "show", "-1", "--format=%ct", `refs/remotes/${base}`]);
  if (reflog.ok && reflog.out) times.push(Number(reflog.out) * 1000);
  return times.length ? (Date.now() - Math.max(...times)) / 3_600_000 : null;
}

/**
 * The verdict, as data: every new file that is misnumbered or misnamed, with
 * what to do about it. `candidate` is every path under MIGRATIONS_DIR/ in the
 * tree being checked; `mainBlobs` is origin/main's files; `claimed` is number ->
 * { pr, file } for the numbers other OPEN PRs already add (empty in the hook,
 * which never reaches the network).
 *
 * "One past the highest on main" means one past the highest FREE number: a number
 * another open PR has taken is not free, so the next file takes the one after it.
 * Before 2026-11-12 the arithmetic read main alone, which left no legal number at
 * all when another PR held main's highest + 1 — that number failed as a collision
 * and the next failed as a gap, and the check's own advice ("take the next free
 * number") was rejected by its own gap rule.
 */
export function evaluate(candidate, mainBlobs, claimed = new Map(), { allowGap = false } = {}) {
  const mainNames = [...mainBlobs.keys()].sort();
  const highestName = mainNames.at(-1) ?? null;
  const highest = highestName ? numberOf(highestName) : 0;
  const mainByNumber = new Map(mainNames.map((n) => [numberOf(n), n]));

  const problems = [];
  const fresh = [];
  for (const path of candidate) {
    const name = basename(path);
    if (name.includes("/") || mainBlobs.has(name)) continue;
    if (MIGRATION_NAME.test(name)) fresh.push(name);
    else if (name.endsWith(".sql"))
      problems.push(`${name} is not named NNNN_<what>.sql, so apply-migrations.mjs would never apply it.`);
  }
  fresh.sort((a, b) => numberOf(a) - numberOf(b) || a.localeCompare(b));

  const ok = [];
  // The next number nobody holds: not on main, and not added by another open PR.
  let cursor = highest + 1;
  const nextFree = () => {
    while (mainByNumber.has(cursor) || claimed.has(cursor)) cursor += 1;
    return cursor++;
  };
  fresh.forEach((name, i) => {
    const n = numberOf(name);
    // A number another open PR adds is reported once, by the open-PR check in main(), which names the
    // PR and says who renumbers. Reporting it here as well would print two problems about one file,
    // and this file's own number consumes no free slot.
    if (claimed.has(n)) return;
    const want = nextFree();
    if (n === want) return ok.push(name);
    // The hook cannot read open PRs, so it cannot know `want` is held by another PR (#1546/#1547, 2026-11-13).
    // A number past it that nobody here uses is what CI told the stream to take: let it through. A duplicate or
    // a number main holds is still refused. CI stays strict.
    if (allowGap && n > want && !mainByNumber.has(n) && !fresh.slice(0, i).some((o) => numberOf(o) === n)) {
      cursor = n + 1;
      return ok.push(name);
    }
    let why;
    if (mainByNumber.has(n)) why = `${pad(n)} is already taken on ${base} by ${mainByNumber.get(n)}`;
    else if (fresh.slice(0, i).some((o) => numberOf(o) === n))
      why = `${pad(n)} is shared with ${fresh.find((o) => numberOf(o) === n)}, also new here`;
    else if (i === 0) why = `it leaves a gap: the next free number after ${base}'s highest (${highestName ?? "none"}) is ${pad(want)}`;
    else why = `it leaves a gap after ${fresh[i - 1]}`;
    const to = `${pad(want)}${name.slice(4)}`;
    problems.push(`${name}: ${why}.\n    Rename it to ${to}:\n      git mv ${MIGRATIONS_DIR}/${name} ${MIGRATIONS_DIR}/${to}`);
  });
  return { highestName, fresh, ok, problems };
}

/**
 * Is this exact file already recorded in the dev database? "yes" | "no" | "unknown" (no credentials,
 * no network, CI). Shells out to apply-migrations.mjs --is-applied, which owns the database access.
 */
function appliedToDev(name) {
  const r = spawnSync(process.execPath, ["scripts/apply-migrations.mjs", "--is-applied", name], { encoding: "utf8", timeout: 60000 });
  const out = (r.stdout ?? "").trim().split(/\s*\n\s*/).pop();
  return out === "applied" ? "yes" : out === "not applied" ? "no" : "unknown";
}

/** What a stream must do about a misnumbered file, depending on whether dev already holds it. */
export function renumberAdvice(name, state) {
  if (state === "yes")
    return `${name} is ALREADY APPLIED to dev. Do NOT renumber it: renaming leaves its old row behind as drift. Stop and report this to Lutan or the planner.`;
  if (state === "no") return `${name} is not applied to dev, so it is safe to renumber.`;
  return `Could not tell whether ${name} is applied to dev (no database access here). Before renaming, run: node scripts/apply-migrations.mjs --is-applied ${name} — if it says "applied", do NOT rename; stop and report.`;
}

function main() {
  const top = git(["rev-parse", "--show-toplevel"]);
  if (!top.ok) cannotCheck("not inside a git checkout");
  process.chdir(top.out);

  let added = null;
  if (staged) {
    // The same test .githooks/pre-commit makes before starting node, repeated
    // so the script gives the same answer run on its own. --no-renames so
    // `git mv 0082_x.sql 0083_x.sql` shows the new name as added and is judged.
    const diff = git(["diff", "--cached", "--name-only", "--no-renames", "--diff-filter=A", "--", `${MIGRATIONS_DIR}/`]);
    if (diff.ok && !diff.out) process.exit(0);
    added = diff.out.split("\n").filter(Boolean).map(basename);
  }

  if (!git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).ok)
    cannotCheck(`${base} does not exist here (git fetch origin main)`);
  const mainTree = git(["ls-tree", base, `${MIGRATIONS_DIR}/`]);
  if (!mainTree.ok) cannotCheck(`could not read ${base}: ${mainTree.err || "git ls-tree failed"}`);
  const mainBlobs = parseLsTree(mainTree.out);

  // A commit that adds only files main already has — resolving a conflicted
  // `worktree.mjs sync` — is not judged: blocking it would stop the sync, and
  // any clash it exposes with this branch's own file is the PR's to report.
  if (added && added.every((name) => mainBlobs.has(name))) process.exit(0);
  const baseSha = git(["rev-parse", "--short", base]).out;

  const tree = staged
    ? git(["ls-files", "--full-name", "--", `${MIGRATIONS_DIR}/`])
    : git(["ls-tree", "--name-only", "HEAD", `${MIGRATIONS_DIR}/`]);
  if (!tree.ok) cannotCheck(`could not list ${staged ? "the index" : "HEAD"}: ${tree.err}`);

  // The open PRs, read once: both the arithmetic in evaluate() and the collision report below need them.
  // Needs gh, so a run that cannot ask carries on without them, exactly as the collision half always has
  // (and the hook, --staged, never asks at all).
  let prs = null;
  if (!staged && !noPrs) {
    if (prsFile) prs = JSON.parse(readFileSync(prsFile, "utf8"));
    else {
      const r = spawnSync("gh", ["pr", "list", "--state", "open", "--limit", "200", "--json", "number,headRefName,files"], { encoding: "utf8" });
      if (r.status === 0) prs = JSON.parse(r.stdout);
      else console.error(`${TAG}: open-PR check skipped — gh could not list PRs (${(r.stderr || r.error?.message || "no gh").trim().split("\n")[0]}).`);
    }
  }
  const ownBranch = branchArg ?? process.env.GITHUB_HEAD_REF ?? git(["branch", "--show-current"]).out;
  const claimed = prs ? numbersClaimedByOpenPrs(prs, ownBranch) : new Map();

  const { highestName, fresh, ok, problems } = evaluate(tree.out.split("\n").filter(Boolean), mainBlobs, claimed, { allowGap: staged });

  // The durable half: a number used by two files in the tree. Pure filename read. Never in the hook.
  const dupNotes = [];
  if (!staged) {
    const names = (namesFile ? readFileSync(namesFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : tree.out.split("\n").filter(Boolean).map(basename));
    for (const [n, list] of duplicateNumbers(names)) {
      const known = KNOWN_DUPLICATES.get(n);
      if (known && list.join() === known.files.join()) dupNotes.push(`${pad(n)} is shared by ${list.join(" and ")} (known, left as is: ${known.why})`);
      else problems.push(`${pad(n)} is used by more than one file: ${list.join(", ")}.
    Rename the one that is not applied anywhere yet. Applied files cannot be renamed (schema_migrations records the filename).`);
    }
    // The preventing half: another open PR already adds the same number. The PRs were read above.
    if (fresh.length && prs) {
      for (const h of collisionsWithOpenPrs(fresh, prs, ownBranch))
        problems.push(`${h.name}: open PR ${h.pr} already adds ${h.other}, the same number ${pad(h.number)}.
    Whichever merges second must renumber; ask the other stream, or take the next free number — which this
    check now works out for you, counting the numbers open PRs hold.`);
    }
  }

  const against = `${base} ${baseSha}, highest ${highestName ?? "none"}`;
  for (const note of dupNotes) console.log(`${TAG}: note — ${note}`);
  if (!problems.length) {
    console.log(
      fresh.length
        ? `${TAG}: ok — ${ok.join(", ")} (against ${against})`
        : `${TAG}: ok — no new migration files (against ${against})`,
    );
    process.exit(0);
  }

  const report = problems.map((p) => `  - ${p}`).join("\n");
  const age = staged ? hoursSinceFetch() : 0;
  if (staged && (age === null || age > STALE_HOURS)) {
    const when = age === null ? "has no recorded fetch" : `was last fetched ${Math.round(age)} hours ago`;
    console.error(
      `${TAG}: warning, not blocking — ${base} ${when}, so it may not know what main holds now (against ${against}):\n` +
        `${report}\n` +
        `  Run \`git fetch origin main\` and commit again to get a real verdict; CI will check the PR against a fresh main.`,
    );
    process.exit(0);
  }
  console.error(
    `${TAG}: a new migration must be numbered one past the highest on ${base}, with no number used twice (against ${against}):\n` +
      `${report}\n` +
      `  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied\n` +
      `  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.`,
  );
  process.exit(REFUSED);
}

// Run only as a command. evaluate() is exported for scripts/check-migration-numbers.test.mjs, which must be
// able to import the rule without the script reading git and calling process.exit.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    main();
  } catch (e) {
    cannotCheck(`unexpected error: ${e?.message ?? e}`);
  }
}
