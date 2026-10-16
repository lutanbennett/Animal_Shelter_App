// Proves the public-views foreign-branch rule in a throwaway git repo: a view
// created only on another unmerged branch is "foreign" (skipped); one this
// branch or main created, an unknown one, and one with no remote branches at
// all must stay "own" (FAIL). Offline, no database.
//
//   node scripts/check-public-view-owner.mjs

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classifyUnlistedView } from "./lib/public-view-owner.mjs";

const dir = mkdtempSync(join(tmpdir(), "pvo-"));
const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir, stdio: "pipe" });
let bad = 0;
const expect = (label, got, want) => {
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : ` (got ${got}, want ${want})`}`);
};
const mig = (name, sql) => {
  mkdirSync(join(dir, "supabase/migrations"), { recursive: true });
  writeFileSync(join(dir, "supabase/migrations", name), sql);
  git("add", "-A");
  git("commit", "-m", name);
};

try {
  git("init", "-q", "-b", "main");
  mig("0001_base.sql", "create view public.public_on_main as select 1;\n");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  git("checkout", "-q", "-b", "foreign");
  mig("0002_appeals.sql", 'CREATE OR REPLACE VIEW "public"."public_foreign_thing" AS select 1;\n');
  git("update-ref", "refs/remotes/origin/claude/foreign-schema", "HEAD");
  git("checkout", "-q", "main");
  git("checkout", "-q", "-b", "mine");
  mig("0003_mine.sql", "create view public_my_own as select 1;\n");

  const c = (n) => classifyUnlistedView(n, dir).kind;
  expect("view from an unmerged foreign branch is skipped", c("public_foreign_thing"), "foreign");
  expect("view this branch adds without listing it fails", c("public_my_own"), "own");
  expect("view already on main fails", c("public_on_main"), "own");
  expect("view nobody's migration creates fails", c("public_mystery"), "own");
  expect("a name that only prefixes a foreign view fails", c("public_foreign"), "own");
  expect("odd characters fail", c("public_x; drop"), "own");
  git("update-ref", "-d", "refs/remotes/origin/claude/foreign-schema");
  expect("no remote branches fetched: fails, never skips", c("public_foreign_thing"), "own");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(bad ? 1 : 0);
