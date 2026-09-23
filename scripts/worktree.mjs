#!/usr/bin/env node
// One worktree per workstream. Each feature branch gets its own sibling
// folder, its own node_modules/.next, its own dev-server port and its own
// Claude session, so several features can be built at once without ever
// touching the main checkout (which stays on `main`). See CLAUDE.md
// "Workstreams".
//
//   node scripts/worktree.mjs new <feature> [--no-install]
//       ../Animal_Shelter_<feature> on branch claude/<feature> from
//       origin/main, with .env.local copied in, npm ci run, the next free
//       port recorded in .port and .claude/launch.json aimed at it.
//   node scripts/worktree.mjs dev
//       next dev on this worktree's port (3000 in the main checkout).
//   node scripts/worktree.mjs sync
//       fetch and merge origin/main into this worktree's branch, then push.
//   node scripts/worktree.mjs list
//       every worktree: branch, port, dirty files, ahead/behind main,
//       unpushed commits, whether a process holds the folder; then any
//       husk folders git no longer knows about.
//   node scripts/worktree.mjs launch [--quiet]
//       rewrite this checkout's .claude/launch.json for its .port (the
//       post-merge hook does this after every pull).
//   node scripts/worktree.mjs done <feature> [--force] [--stop-servers]
//       once the PR is merged: remove the folder, delete the branch locally
//       and on origin, prune git's registry, and check all three happened.
//       Refuses if the branch isn't in origin/main or the tree is dirty
//       (--force overrides both), if the branch has commits origin does not
//       (never overridden), or if a process holds the folder (--stop-servers
//       ends the dev servers it can identify there and tries again). Also
//       clears a husk: a leftover folder of that name git has forgotten.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const ENV_FILES = [".env.local", ".dev.vars"];
const MAIN_PORT = 3000;
const FIRST_PORT = 3001;
const BRANCH_PREFIX = "claude/";
const FOLDER_PREFIX = "Animal_Shelter_";
const WINDOWS = process.platform === "win32";
// What a finished worktree leaves behind that is safe to delete unasked.
const BUILD_OUTPUT = [".next", ".open-next", ".wrangler", "node_modules"];

function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: opts.cwd ?? repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", opts.quiet ? "ignore" : "inherit"],
  }).trim();
}

/** git that answers null instead of throwing — for probing worktrees that may be broken. */
function tryGit(args, opts = {}) {
  try {
    return git(args, { ...opts, quiet: true });
  } catch {
    return null;
  }
}

function run(cmd, args, cwd) {
  // npm is a .cmd shim on Windows and needs a shell; git does not.
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: WINDOWS && cmd === "npm" });
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} exited with ${r.status}`);
}

function fail(msg) {
  console.error(`worktree: ${msg}`);
  process.exit(1);
}

/** All worktrees as { dir, branch, main, prunable } — the first one is the main checkout. */
function worktrees() {
  const out = git(["worktree", "list", "--porcelain"]);
  const list = [];
  for (const block of out.split(/\n\n+/)) {
    const dir = block.match(/^worktree (.+)$/m)?.[1];
    if (!dir) continue;
    const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1] ?? "(detached)";
    const prunable = /^prunable/m.test(block);
    list.push({ dir: path.resolve(dir), branch, main: list.length === 0, prunable });
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

/** Commits on `branch` that no origin ref has — work that dies with the local branch. */
function unpushed(branch) {
  const n = tryGit(["rev-list", "--count", branch, "--not", "--remotes=origin"]);
  return n === null ? null : Number(n);
}

// ------------------------------------------------------ who holds a folder

// Windows will not rename (or delete) a directory while any process has its
// working directory inside it or a file in it open — which is exactly why
// `done` used to leave husks behind a live Claude session. Renaming the folder
// to a sibling name and straight back is therefore a dependable, side-effect
// free test: it only succeeds when nothing has anything under it open, and
// then there is nobody to notice. It cannot say *who* the holder is; that is
// what liveSessions() and holders() are for. Elsewhere a held directory can
// still be removed, so the question has no answer and the probe returns null.
function held(dir) {
  if (!WINDOWS || !existsSync(dir)) return null;
  const probe = `${dir}.__worktree-probe`;
  try {
    renameSync(dir, probe);
  } catch {
    return true;
  }
  renameSync(probe, dir);
  return false;
}

/**
 * Processes running *from* one of `dirs` — an executable inside it, or a
 * node.exe running a script under its node_modules (next dev, wrangler) — as
 * Map<dir, [{pid, name}]>. Deliberately not "mentions the path": a shell
 * whose command line merely names the folder is somebody's session (a
 * Claude tool call, a terminal), and --stop-servers must never end one.
 */
function holders(dirs) {
  const found = new Map(dirs.map((d) => [d, []]));
  if (!WINDOWS || dirs.length === 0) return found;
  const r = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process -Property ProcessId,Name,CommandLine,ExecutablePath | " +
        "Select-Object ProcessId,Name,CommandLine,ExecutablePath | ConvertTo-Json -Compress",
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0 || !r.stdout) return found;
  const norm = (s) => s.replaceAll("/", "\\").toLowerCase();
  for (const p of [].concat(JSON.parse(r.stdout))) {
    if (p.ProcessId === process.pid) continue;
    const cmd = norm(p.CommandLine ?? "");
    const exe = norm(p.ExecutablePath ?? "");
    for (const d of dirs) {
      const needle = norm(d) + "\\";
      const nodeScript = p.Name?.toLowerCase() === "node.exe" && cmd.includes(needle + "node_modules\\");
      if (exe.startsWith(needle) || nodeScript) {
        found.get(d).push({ pid: p.ProcessId, name: p.Name });
      }
    }
  }
  return found;
}

// Claude Code writes ~/.claude/sessions/<pid>.json for each running session,
// with its cwd, name and procStart (the process start time as a Windows
// FILETIME, kept as a string because it overflows a JS number). A file whose
// pid is alive *with that start time* is a live session; anything else is a
// leftover or a reused pid. This is an undocumented format, so it only ever
// adds names: held() stays the authority on whether a folder is in use, and a
// missing or changed format just means "held by something unidentified" —
// never a confident "no session". Only the .json files are read; the .key
// files beside them are secrets.
function liveSessions() {
  const home = process.env.USERPROFILE ?? process.env.HOME;
  const dir = home && path.join(home, ".claude", "sessions");
  if (!WINDOWS || !dir || !existsSync(dir)) return [];
  const candidates = [];
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    try {
      const s = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
      if (s.cwd && s.pid && s.procStart) candidates.push({ pid: Number(s.pid), start: String(s.procStart), cwd: path.resolve(s.cwd), name: s.name ?? "(unnamed)" });
    } catch {
      // unreadable or half-written — skip it
    }
  }
  if (candidates.length === 0) return [];
  // Get-Process with several ids errors (exit 1) if any one has exited, so
  // look each up separately and always exit 0.
  const ids = candidates.map((c) => c.pid).join(",");
  const r = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `foreach ($i in @(${ids})) { $p = Get-Process -Id $i -ErrorAction SilentlyContinue; ` +
        `if ($p) { "$i $($p.StartTime.ToFileTimeUtc())" } }; exit 0`,
    ],
    { encoding: "utf8" },
  );
  const alive = new Map(
    (r.stdout ?? "").split(/\r?\n/).filter(Boolean).map((l) => l.trim().split(" ")).map(([pid, start]) => [Number(pid), start]),
  );
  return candidates.filter((c) => alive.get(c.pid) === c.start);
}

/** Live sessions whose working directory is `dir` or inside it. */
function sessionsIn(sessions, dir) {
  const d = dir.toLowerCase();
  return sessions.filter((s) => {
    const c = s.cwd.toLowerCase();
    return c === d || c.startsWith(d + path.sep);
  });
}

function describeHolders(procs, sessions) {
  const named = [
    ...sessions.map((s) => `Claude session "${s.name}" (pid ${s.pid})`),
    ...procs.map((p) => `${p.name} (pid ${p.pid})`),
  ];
  if (named.length === 0) {
    return "a process that cannot be identified — usually a Claude session or terminal whose working directory is inside it";
  }
  return named.join(", ");
}

/** Sibling Animal_Shelter_* folders that are neither a registered worktree nor a repo of their own. */
function husks(trees) {
  const parent = path.dirname(trees[0].dir);
  const known = new Set(trees.map((t) => t.dir.toLowerCase()));
  return readdirSync(parent, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith(FOLDER_PREFIX))
    .map((e) => path.join(parent, e.name))
    .filter((d) => !known.has(d.toLowerCase()) && !existsSync(path.join(d, ".git")));
}

// ------------------------------------------------------ .claude/launch.json

// The browser pane starts dev servers from .claude/launch.json by name, and a
// committed file can only name one port. So the file is per checkout and
// gitignored, and written from .port whenever a worktree is created, synced or
// started.
function writeLaunch(dir, { quiet = false } = {}) {
  const port = readPort(dir) ?? MAIN_PORT;
  const config = {
    version: "0.0.1",
    configurations: [
      { name: "dev", runtimeExecutable: "npm", runtimeArgs: ["run", "dev", "--", "--port", String(port)], port },
      {
        name: "cf-preview",
        runtimeExecutable: "npx",
        runtimeArgs: ["opennextjs-cloudflare", "preview", "--", "--port", "8787"],
        port: 8787,
      },
    ],
  };
  const file = path.join(dir, ".claude", "launch.json");
  // Branches cut before launch.json was untracked still carry the committed
  // copy; overwriting it would make the tree dirty (and 'done' refuse it).
  // Their first sync removes it from the index, and this runs again then.
  if (tryGit(["ls-files", "--error-unmatch", ".claude/launch.json"], { cwd: dir }) !== null) return;
  mkdirSync(path.join(dir, ".claude"), { recursive: true });
  const text = JSON.stringify(config, null, 2) + "\n";
  if (existsSync(file) && readFileSync(file, "utf8") === text) return;
  writeFileSync(file, text);
  if (!quiet) console.log(`.claude/launch.json: dev on port ${port}`);
}

// ---------------------------------------------------------------- commands

function cmdNew(args) {
  const name = featureName(args[0]);
  const install = !args.includes("--no-install");
  const trees = worktrees();
  const branch = BRANCH_PREFIX + name;
  const dir = folderFor(trees, name);

  if (existsSync(dir)) fail(`${dir} already exists${husks(trees).includes(dir) ? ` — a husk; 'done ${name}' clears it` : ""}`);
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
  writeLaunch(dir);

  if (install) {
    console.log(`npm ci`);
    run("npm", ["ci", "--no-audit", "--no-fund"], dir);
    // node_modules/next can exist before the .bin links do, and then every
    // npm script fails with "'next' is not recognized" — check the thing the
    // scripts actually run.
    const bin = path.join(dir, "node_modules", ".bin", WINDOWS ? "next.cmd" : "next");
    if (!existsSync(bin)) fail(`npm ci finished but ${bin} is missing — the install is not usable; re-run npm ci in ${dir}`);
  } else {
    console.log(`skipped npm ci (--no-install) — run it before any npm script`);
  }

  console.log(`
Ready. Next:
  1. Open a Claude session on ${dir}
  2. node scripts/worktree.mjs dev        -> http://localhost:${port}
     (or preview_start "dev" from that session)
  3. If Google sign-in bounces, add http://localhost:${port}/auth/callback
     to the dev Supabase project's Redirect URLs (once per port).
`);
}

function cmdDev() {
  const port = readPort(repo) ?? MAIN_PORT;
  writeLaunch(repo);
  console.log(`next dev on port ${port} (${repo})`);
  run("npm", ["run", "dev", "--", "--port", String(port)], repo);
}

function cmdSync() {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "main") fail("run 'git pull' in the main checkout instead");
  git(["fetch", "-q", "origin", "main"]);
  console.log(`merging origin/main into ${branch}`);
  run("git", ["merge", "origin/main"], repo);
  // post-commit does not fire for merge commits, so without this a synced
  // branch sits ahead of origin until someone happens to notice.
  console.log(`pushing ${branch}`);
  run("git", ["push", "-q", "-u", "origin", branch], repo);
  writeLaunch(repo);
}

function cmdLaunch(args) {
  writeLaunch(repo, { quiet: args.includes("--quiet") });
}

function cmdList() {
  const fetched = tryGit(["fetch", "-q", "--prune", "origin"]) !== null;
  const trees = worktrees();
  const sessions = liveSessions();
  const who = (dir) => sessionsIn(sessions, dir).map((s) => s.name).join(", ");
  const rows = trees.map((t) => {
    const row = { folder: path.basename(t.dir), branch: t.branch, port: t.main ? MAIN_PORT : readPort(t.dir) ?? "-" };
    // A worktree whose folder is gone, or survives without its .git, must not
    // take the whole listing down with it — it is exactly the row that most
    // needs to be seen.
    const dirty = existsSync(t.dir) ? tryGit(["status", "--porcelain"], { cwd: t.dir }) : null;
    if (t.prunable || dirty === null) {
      const why = !existsSync(t.dir) ? "folder gone" : "not a repo";
      return { ...row, dirty: "-", ahead: "-", behind: "-", unpushed: "-", held: "-", state: `STALE (${why}) — 'done' or 'git worktree prune'` };
    }
    let ahead = "-", behind = "-", ahead0 = false;
    if (t.branch !== "(detached)" && t.branch !== "main" && t.branch !== "backlog") {
      const counts = tryGit(["rev-list", "--left-right", "--count", `${t.branch}...origin/main`]);
      if (counts) [ahead, behind] = counts.split(/\s+/);
      ahead0 = t.branch.startsWith(BRANCH_PREFIX) && ahead === "0";
    }
    const up = t.branch === "(detached)" ? null : unpushed(t.branch);
    // Only feature worktrees are probed: the main checkout and backlog are
    // never torn down, and this checkout is held by whoever is running us.
    let h = "-";
    if (t.branch.startsWith(BRANCH_PREFIX) && t.dir !== repo) {
      const v = held(t.dir);
      h = v === null ? "?" : v ? "HELD" : "free";
    } else if (t.dir === repo) {
      h = "(here)";
    }
    if (who(t.dir)) h = h === "-" ? `session: ${who(t.dir)}` : `${h} — ${who(t.dir)}`;
    return {
      ...row,
      dirty: dirty.split("\n").filter(Boolean).length,
      ahead,
      behind,
      unpushed: up ?? "-",
      held: h,
      state: ahead0 ? "nothing beyond main" : "",
    };
  });
  if (!fetched) console.log("could not reach origin — ahead/behind/unpushed are as of the last fetch");
  console.table(rows);
  if (WINDOWS) {
    console.log("held: HELD = some process has the folder open (a Claude session, a terminal, a dev server) — do not 'done' it.");
    console.log("      Named sessions come from ~/.claude/sessions; HELD with no name is still held.");
    console.log("      free = nothing has it open right now. A session can still attach a moment later.");
  }

  const orphans = husks(trees);
  if (orphans.length) {
    console.log(`\nHusks — folders git no longer tracks (clear with 'done <name>'):`);
    for (const d of orphans) {
      const v = held(d);
      const contents = readdirSync(d).join(", ") || "empty";
      const holder = v ? `  HELD by ${who(d) ? `session "${who(d)}"` : "an unidentified process (probably a session)"}` : "";
      console.log(`  ${path.basename(d)}  [${contents}]${holder}`);
    }
  }
}

/** Remove a folder that nothing should be using, and say plainly whether it went. */
function removeFolder(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // fall through to the existence check, which is the real answer
  }
  return !existsSync(dir);
}

function heldMessage(dir) {
  const who = describeHolders(holders([dir]).get(dir), sessionsIn(liveSessions(), dir));
  return (
    `${dir} is in use by ${who}.\n` +
    `Windows cannot delete a folder a process is sitting in, and removing the worktree anyway would\n` +
    `pull git out from under that session and leave a husk. Close the Claude session / terminal /\n` +
    `dev server there (--stop-servers ends identifiable dev servers), then re-run.`
  );
}

function stopServers(dir) {
  const list = holders([dir]).get(dir);
  for (const p of list) {
    console.log(`stopping ${p.name} (pid ${p.pid})`);
    spawnSync("taskkill", ["/PID", String(p.pid), "/T", "/F"], { stdio: "ignore" });
  }
  if (list.length) spawnSync(process.execPath, ["-e", "setTimeout(()=>{},1000)"]);
}

function cmdDone(args) {
  const force = args.includes("--force");
  const stop = args.includes("--stop-servers");
  const trees = worktrees();
  const positional = args.find((a) => !a.startsWith("--"));
  const name = featureName(positional ?? (trees.find((t) => t.dir === repo)?.branch ?? ""));
  const branch = BRANCH_PREFIX + name;
  const tree = trees.find((t) => t.branch === branch);
  const dir = tree?.dir ?? folderFor(trees, name);
  if (dir.toLowerCase() === repo.toLowerCase()) fail("run this from another worktree (the main checkout is simplest)");

  // Whether the branch is merged and pushed is judged against origin, so a
  // stale view of origin is not good enough to delete anything on.
  if (tryGit(["fetch", "-q", "--prune", "origin"]) === null) fail("could not fetch origin — cannot tell what is merged or pushed; try again when online");
  const exists = Boolean(git(["branch", "--list", branch]));
  if (exists) {
    const mergedRefs = git(["branch", "--merged", "origin/main", "--format=%(refname:short)"]).split("\n");
    if (!mergedRefs.includes(branch) && !force) {
      fail(`${branch} is not merged into origin/main — merge the PR first, or --force to discard it`);
    }
    // Deterministic and unrecoverable if wrong, so no flag gets past it: push
    // the commits (or delete the branch by hand, knowingly) first.
    const n = unpushed(branch);
    if (n) {
      fail(
        `${branch} has ${n} commit(s) that no branch on origin has — deleting it would lose them.\n` +
          `Push first (git -C ${dir} push -u origin ${branch}); --force does not override this.`,
      );
    }
  }

  const folderThere = existsSync(dir);
  const isRepo = folderThere && tryGit(["rev-parse", "--git-dir"], { cwd: dir }) !== null;
  if (tree && isRepo) {
    const dirty = git(["status", "--porcelain"], { cwd: dir });
    if (dirty && !force) fail(`${dir} has uncommitted changes:\n${dirty}\n(--force to discard)`);
  } else if (folderThere && !force) {
    // Git can no longer say what in here is uncommitted work, so only build
    // output is deleted without being asked.
    const other = readdirSync(dir).filter((e) => !BUILD_OUTPUT.includes(e));
    if (other.length) {
      fail(`${dir} is not a git repo any more, so its contents cannot be checked for uncommitted work:\n  ${other.join(", ")}\n(--force to delete it anyway)`);
    }
  }
  if (!tree && !exists && !folderThere && !git(["ls-remote", "--heads", "origin", branch], { quiet: true })) {
    fail(`nothing called ${name}: no worktree, no branch, no folder`);
  }

  if (folderThere) {
    if (held(dir) && stop) stopServers(dir);
    if (held(dir)) fail(heldMessage(dir));
    if (tree && isRepo) {
      console.log(`removing worktree ${dir}`);
      if (tryGit(["worktree", "remove", "--force", dir]) === null) console.log("git worktree remove failed; deleting the folder directly");
    } else {
      console.log(`removing ${tree ? "broken worktree" : "husk"} ${dir}`);
    }
    if (existsSync(dir) && !removeFolder(dir)) {
      git(["worktree", "prune"]);
      fail(`${dir} is still on disk — ${heldMessage(dir)}\nThe branch was left alone; re-run 'done ${name}' once it is free.`);
    }
  }
  git(["worktree", "prune"]);

  if (exists) {
    console.log(`deleting local branch ${branch}`);
    git(["branch", "-D", branch]);
  }
  if (git(["ls-remote", "--heads", "origin", branch], { quiet: true })) {
    console.log(`deleting origin/${branch}`);
    git(["push", "-q", "origin", "--delete", branch]);
  }

  // Say what is true, not what was attempted.
  const problems = [];
  if (existsSync(dir)) problems.push(`${dir} still exists`);
  if (worktrees().some((t) => t.dir.toLowerCase() === dir.toLowerCase())) problems.push(`git worktree list still has ${dir}`);
  if (git(["branch", "--list", branch])) problems.push(`local branch ${branch} still exists`);
  if (git(["ls-remote", "--heads", "origin", branch], { quiet: true })) problems.push(`origin/${branch} still exists`);
  if (problems.length) fail(`not done:\n  ${problems.join("\n  ")}`);
  console.log(`done — folder removed, worktree unregistered, ${branch} gone locally and on origin`);
}

// ---------------------------------------------------------------- main

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "new": cmdNew(rest); break;
  case "dev": cmdDev(); break;
  case "sync": cmdSync(); break;
  case "list": cmdList(); break;
  case "launch": cmdLaunch(rest); break;
  case "done": cmdDone(rest); break;
  default: {
    const lines = readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n");
    const end = lines.findIndex((l) => l.startsWith("import "));
    console.log(lines.slice(1, end - 1).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    process.exit(cmd ? 1 : 0);
  }
}
