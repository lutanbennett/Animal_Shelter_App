#!/usr/bin/env node
// One worktree per workstream. Each feature branch gets its own sibling
// folder, its own node_modules/.next, its own dev-server port and its own
// Claude session, so several features can be built at once without ever
// touching the main checkout (which stays on `main`). See CLAUDE.md
// "Workstreams".
//
//   node scripts/worktree.mjs new <feature> [--no-install]
//       ../Animal_Shelter_<feature> on branch claude/<feature> from
//       origin/main, with .env.local copied in, npm ci run and the next
//       free port recorded in .port.
//   node scripts/worktree.mjs dev
//       next dev on this worktree's port (3000 in the main checkout).
//   node scripts/worktree.mjs sync
//       fetch and merge origin/main into this worktree's branch.
//   node scripts/worktree.mjs list
//       every worktree: branch, port, dirty files, ahead/behind main.
//   node scripts/worktree.mjs done <feature> [--force]
//       once the PR is merged: remove the folder, delete the branch
//       locally and on origin. Refuses if the branch isn't in origin/main
//       or the tree is dirty unless --force.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const ENV_FILES = [".env.local", ".dev.vars"];
const FIRST_PORT = 3001;
const BRANCH_PREFIX = "claude/";
const FOLDER_PREFIX = "Animal_Shelter_";

function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: opts.cwd ?? repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", opts.quiet ? "ignore" : "inherit"],
  }).trim();
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} exited with ${r.status}`);
}

function fail(msg) {
  console.error(`worktree: ${msg}`);
  process.exit(1);
}

/** All worktrees as { dir, branch, main } — the first one is the main checkout. */
function worktrees() {
  const out = git(["worktree", "list", "--porcelain"]);
  const list = [];
  for (const block of out.split(/\n\n+/)) {
    const dir = block.match(/^worktree (.+)$/m)?.[1];
    if (!dir) continue;
    const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1] ?? "(detached)";
    list.push({ dir: path.resolve(dir), branch, main: list.length === 0 });
  }
  return list;
}

function readPort(dir) {
  const f = path.join(dir, ".port");
  if (!existsSync(f)) return null;
  const n = Number.parseInt(readFileSync(f, "utf8").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function nextFreePort(trees) {
  const used = new Set(trees.map((t) => readPort(t.dir)).filter(Boolean));
  let p = FIRST_PORT;
  while (used.has(p)) p++;
  return p;
}

function featureName(raw) {
  const name = raw?.replace(/^claude\//, "");
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    fail(`feature name must be kebab-case (got ${JSON.stringify(raw)})`);
  }
  return name;
}

function folderFor(trees, name) {
  return path.join(path.dirname(trees[0].dir), FOLDER_PREFIX + name);
}

// ---------------------------------------------------------------- commands

function cmdNew(args) {
  const name = featureName(args[0]);
  const install = !args.includes("--no-install");
  const trees = worktrees();
  const branch = BRANCH_PREFIX + name;
  const dir = folderFor(trees, name);

  if (existsSync(dir)) fail(`${dir} already exists`);
  if (trees.some((t) => t.branch === branch)) fail(`${branch} is already checked out`);
  if (git(["branch", "--list", branch])) fail(`${branch} already exists — pick another name or 'done' it first`);

  console.log(`fetching origin/main`);
  git(["fetch", "-q", "origin", "main"]);
  console.log(`creating ${dir} on ${branch}`);
  git(["worktree", "add", "--no-track", "-b", branch, dir, "origin/main"]);

  for (const f of ENV_FILES) {
    const src = path.join(trees[0].dir, f);
    if (existsSync(src)) {
      copyFileSync(src, path.join(dir, f));
      console.log(`copied ${f}`);
    }
  }

  const port = nextFreePort(trees);
  writeFileSync(path.join(dir, ".port"), `${port}\n`);
  console.log(`dev-server port ${port} (.port)`);

  if (install) {
    console.log(`npm ci`);
    run("npm", ["ci", "--no-audit", "--no-fund"], dir);
  }

  console.log(`
Ready. Next:
  1. Open a Claude session on ${dir}
  2. node scripts/worktree.mjs dev        -> http://localhost:${port}
  3. If Google sign-in bounces, add http://localhost:${port}/auth/callback
     to the dev Supabase project's Redirect URLs (once per port).
`);
}

function cmdDev() {
  const port = readPort(repo) ?? 3000;
  console.log(`next dev on port ${port} (${repo})`);
  run("npm", ["run", "dev", "--", "--port", String(port)], repo);
}

function cmdSync() {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "main") fail("run 'git pull' in the main checkout instead");
  git(["fetch", "-q", "origin", "main"]);
  console.log(`merging origin/main into ${branch}`);
  run("git", ["merge", "origin/main"], repo);
}

function cmdList() {
  git(["fetch", "-q", "origin", "main"], { quiet: true });
  const rows = worktrees().map((t) => {
    const dirty = git(["status", "--porcelain"], { cwd: t.dir }).split("\n").filter(Boolean).length;
    let ahead = "-", behind = "-";
    if (t.branch !== "(detached)" && t.branch !== "main") {
      const [a, b] = git(["rev-list", "--left-right", "--count", `${t.branch}...origin/main`]).split(/\s+/);
      ahead = a; behind = b;
    }
    const merged = t.branch.startsWith(BRANCH_PREFIX) && ahead === "0" ? " (nothing beyond main)" : "";
    return {
      folder: path.basename(t.dir),
      branch: t.branch + merged,
      port: t.main ? 3000 : readPort(t.dir) ?? "-",
      dirty,
      ahead,
      behind,
    };
  });
  console.table(rows);
}

function cmdDone(args) {
  const force = args.includes("--force");
  const trees = worktrees();
  const name = featureName(args[0] ?? (trees.find((t) => t.dir === repo)?.branch ?? ""));
  const branch = BRANCH_PREFIX + name;
  const tree = trees.find((t) => t.branch === branch);
  const dir = tree?.dir ?? folderFor(trees, name);
  if (dir === repo) fail("run this from another worktree (the main checkout is simplest)");

  git(["fetch", "-q", "origin", "main"]);
  const exists = Boolean(git(["branch", "--list", branch]));
  if (exists) {
    const mergedRefs = git(["branch", "--merged", "origin/main", "--format=%(refname:short)"]).split("\n");
    if (!mergedRefs.includes(branch) && !force) {
      fail(`${branch} is not merged into origin/main — merge the PR first, or --force to discard it`);
    }
  }

  if (tree) {
    const dirty = git(["status", "--porcelain"], { cwd: dir });
    if (dirty && !force) fail(`${dir} has uncommitted changes:\n${dirty}\n(--force to discard)`);
    console.log(`removing worktree ${dir}`);
    git(["worktree", "remove", ...(force ? ["--force"] : []), dir]);
  }
  if (exists) {
    console.log(`deleting local branch ${branch}`);
    git(["branch", force ? "-D" : "-d", branch]);
  }
  if (git(["ls-remote", "--heads", "origin", branch], { quiet: true })) {
    console.log(`deleting origin/${branch}`);
    git(["push", "-q", "origin", "--delete", branch]);
  }
  git(["worktree", "prune"]);
  console.log("done");
}

// ---------------------------------------------------------------- main

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "new": cmdNew(rest); break;
  case "dev": cmdDev(); break;
  case "sync": cmdSync(); break;
  case "list": cmdList(); break;
  case "done": cmdDone(rest); break;
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 21).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    process.exit(cmd ? 1 : 0);
}
