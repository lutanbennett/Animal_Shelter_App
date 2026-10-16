// Who created a public_* view that is live in the database but not on the
// PUBLIC_VIEWS allow-list? check-public-views.mjs runs against the shared dev
// database with the allow-list of the branch under test. The schema-first rule
// applies a migration to dev before its PR merges, so a view added by ANOTHER
// unmerged branch is live in dev yet unlisted here: not this branch's fault,
// and nothing it can fix. A view this branch (or main) created and did not list
// is exactly what the check exists to catch and must stay red.
//
// The rule is deliberately narrow: "foreign" needs positive proof, a
// `create view <name>` in a migration on another origin/* branch. No such proof
// (unknown name, no remote branches fetched, git failing) is "unowned", and
// the caller fails. Never guess towards skip.
// docs/decisions/2026-10-16-public-views-foreign-branch-skip.md

import { execFileSync } from "node:child_process";

const SAFE_NAME = /^[a-z0-9_]+$/;

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return ""; // no match (exit 1) or no git: both mean "no proof"
  }
}

function creates(ref, name, cwd) {
  const s = "[[:space:]]+";
  const pattern =
    `create${s}(or${s}replace${s})?(materialized${s})?view${s}(if${s}not${s}exists${s})?` +
    `(\\"?public\\"?\.)?\\"?${name}\\"?([^a-z0-9_]|$)`;
  return git(["grep", "-l", "-i", "-E", pattern, ref, "--", "supabase/migrations"], cwd).trim() !== "";
}

/**
 * @returns {{ own: string[], foreign: string[] }} refs (HEAD / origin/main) whose
 *   migrations create the view, and other origin/* branches that do.
 */
export function viewCreators(name, cwd = process.cwd()) {
  if (!SAFE_NAME.test(name)) return { own: ["(unrecognised name)"], foreign: [] };
  const own = ["HEAD", "origin/main"].filter((ref) => creates(ref, name, cwd));
  const branches = git(["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"], cwd)
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && b !== "origin" && b !== "origin/HEAD" && b !== "origin/main");
  return { own, foreign: branches.filter((b) => creates(b, name, cwd)) };
}

/** "foreign" only with proof and no own creator; everything else is "own". */
export function classifyUnlistedView(name, cwd) {
  const { own, foreign } = viewCreators(name, cwd);
  if (own.length === 0 && foreign.length > 0) return { kind: "foreign", branches: foreign };
  return { kind: "own", refs: own };
}
