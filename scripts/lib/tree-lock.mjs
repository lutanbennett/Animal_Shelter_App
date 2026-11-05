// One lock for "this checkout's node_modules is in use": `npm ci` deletes the
// whole tree before it reinstalls it, so it must never overlap a build that is
// reading it. On 2026-11-03 the daily sync's `npm ci` ran in the main checkout
// 3m50s into a release's `opennext:build`; it died unlinking a file the build
// held open, and the build then failed with an ENOENT storm over a half-removed
// tree (docs/decisions/2026-11-04-build-install-collision-guard.md).
//
// The lock is a file in the checkout root, created with the `wx` flag so two
// starters cannot both win. It FAILS CLOSED: if the lock is held by a live
// process, takeTreeLock() throws a message saying who and what to do, and the
// caller stops. Only a lock whose process is gone is taken over, and the
// takeover is said out loud.
import { closeSync, openSync, readFileSync, rmSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LOCK_FILE = ".tree.lock";

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM"; // exists, not ours to signal
  }
}

function describe(h) {
  return `\`${h.kind}\` (pid ${h.pid}, since ${h.since})`;
}

/**
 * Take the lock for `kind` ("install" | "build"). Returns a release function
 * (also run on process exit). Throws if a live process holds it.
 */
export function takeTreeLock(kind, root = ROOT) {
  const file = join(root, LOCK_FILE);
  // A child of the process that holds the lock (deploy.mjs -> opennext:build)
  // runs under that lock; it must not refuse its own parent.
  try {
    const parent = Number(process.env.TREE_LOCK_PID);
    if (parent && JSON.parse(readFileSync(file, "utf8")).pid === parent && alive(parent)) return () => {};
  } catch {
    // no lock file, or unreadable: take it the ordinary way below
  }
  const mine = { kind, pid: process.pid, since: new Date().toISOString() };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(file, "wx");
      writeSync(fd, JSON.stringify(mine));
      closeSync(fd);
      const release = () => {
        try {
          if (JSON.parse(readFileSync(file, "utf8")).pid === process.pid) rmSync(file, { force: true });
        } catch {
          // already gone
        }
      };
      process.on("exit", release);
      process.env.TREE_LOCK_PID = String(process.pid); // children then run under this lock
      return release;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
    let held;
    try {
      held = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      throw new Error(`${file} exists but cannot be read. Another run may be starting; if none is, delete it and try again.`);
    }
    if (alive(held.pid)) {
      throw new Error(
        `refusing to start a ${kind}: a ${describe(held)} is using node_modules in ${root}.\n` +
          `  Running both at once wrecks the tree (npm ci deletes it while the build reads it).\n` +
          `  Wait for that ${held.kind} to finish, then run this again.`,
      );
    }
    console.warn(`tree-lock: taking over a stale lock left by a ${describe(held)} whose process has gone.`);
    rmSync(file, { force: true });
  }
  throw new Error(`could not take ${file}; another run won the race. Try again.`);
}

// A handful of packages every build needs. A tree `npm ci` half-removed has
// the directories but not these files. This is a clearer error, not a cure.
const MUST_EXIST = ["next", "esbuild", "react", "wrangler", "@opennextjs/aws", "@opennextjs/cloudflare"];

export function treeProblems(root = ROOT) {
  const bad = [];
  for (const p of MUST_EXIST) {
    try {
      JSON.parse(readFileSync(join(root, "node_modules", p, "package.json"), "utf8"));
    } catch {
      bad.push(p);
    }
  }
  return bad.length
    ? `node_modules is damaged: no readable package.json for ${bad.join(", ")}. ` +
        `This is a half-finished or interrupted \`npm ci\`, not a code fault. Run \`node scripts/guarded-install.mjs\` and retry.`
    : null;
}
