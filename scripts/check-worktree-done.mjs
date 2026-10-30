// Proves `worktree.mjs done <folder-name>` cannot reach a worktree whose folder and branch disagree.
// Builds a throwaway worktree, rebranches it so the two halves differ, then checks that:
//   done <folder-name>           refuses and names the command that works
//   done <folder-name> --force   still refuses
//   done <branch-name>           removes it properly
// Run from any checkout: node scripts/check-worktree-done.mjs
import { exitWith } from "./lib/exit.mjs";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "worktree.mjs");
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...a) => run("git", a, { cwd: path.dirname(here) });

const top = git("rev-parse", "--show-toplevel").stdout.trim();
const folderName = "zz-done-check";
const branchName = "zz-done-check-renamed";
const dir = path.join(path.dirname(top), `Animal_Shelter_${folderName}`);
let failed = 0;
const check = (ok, what, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) {
    failed++;
    if (detail) console.log(detail);
  }
};
const done = (...a) => run(process.execPath, [script, "done", ...a], { cwd: top });

try {
  if (existsSync(dir)) throw new Error(`${dir} already exists — remove it first`);
  git("fetch", "-q", "origin");
  const add = git("worktree", "add", dir, "-b", `claude/${folderName}`, "origin/main");
  if (add.status !== 0) throw new Error(add.stderr);
  const mv = run("git", ["branch", "-m", `claude/${branchName}`], { cwd: dir });
  if (mv.status !== 0) throw new Error(mv.stderr);

  const plain = done(folderName);
  const out = plain.stdout + plain.stderr;
  check(plain.status !== 0 && existsSync(dir), "done <folder-name> refuses and leaves the worktree", out);
  check(out.includes(`done ${branchName}`), "...and names the command that works", out);
  const forced = done(folderName, "--force");
  check(forced.status !== 0 && existsSync(dir), "done <folder-name> --force still refuses", forced.stdout + forced.stderr);
  const right = done(branchName);
  check(right.status === 0 && !existsSync(dir), "done <branch-name> removes it", right.stdout + right.stderr);
} finally {
  if (existsSync(dir)) git("worktree", "remove", "--force", dir);
  git("worktree", "prune");
  for (const b of [folderName, branchName]) git("branch", "-D", `claude/${b}`);
}
await exitWith(failed ? 1 : 0);
