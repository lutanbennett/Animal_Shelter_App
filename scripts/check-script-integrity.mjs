// Two things nothing checked about scripts/, both of which reached main in the
// same week (backlog, 2026-10-02):
//
//   1. Every tracked scripts/**/*.mjs parses (`node --check`). A syntax error in
//      deploy.mjs made every deploy impossible and CI was green on it (#302):
//      typecheck, lint and build never load scripts/.
//   2. Every `*.sh` that a tracked .service file names in ExecStart= is mode
//      100755 *in git's index*. spare-clone.sh was committed 100644 and systemd
//      runs it directly, so its timer would have failed with "Permission
//      denied" somewhere nobody looks.
//
//   node scripts/check-script-integrity.mjs
//
// The mode is read with `git ls-files -s`, not from the filesystem. The bit
// that was wrong is the one that was committed; a working tree says nothing
// reliable about it (on Windows every file reads as non-executable, and a CI
// checkout's bits are whatever git recorded). Reading the index fails on
// exactly the state that reached main.
//
// What it does NOT cover, and prints so on every run:
//   - ExecStart= that goes through an interpreter (`/bin/bash x.sh`, `node x.mjs`)
//     needs no bit, so the first word being a non-.sh file is skipped.
//   - ExecStartPre= / ExecStartPost= / ExecStop= and drop-in overrides.
//   - Paths that are absolute outside __REPO__ (e.g. /usr/bin/npm).
//   - .sh files not named by a .service (run by hand, or from a timer/cron).
//   - .cjs/.js/.ps1 scripts; only .mjs is syntax-checked.
// `__REPO__` is the placeholder the Pi setup scripts substitute with the clone
// path; it is stripped to give a repo-relative path.

import { spawnSync } from "node:child_process";

const git = (...args) => {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout;
};

const failures = [];
const notes = [];

// 1. Syntax of every tracked .mjs under scripts/.
const mjs = git("ls-files", ":(glob)scripts/**/*.mjs").split("\n").filter(Boolean);
for (const file of mjs) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (r.status !== 0) {
    failures.push(`${file} does not parse:\n${(r.stderr || "").trim().replace(/^/gm, "    ")}`);
  }
}

// 2. Executable bit on .sh files that systemd runs directly.
const modes = new Map();
for (const line of git("ls-files", "-s").split("\n").filter(Boolean)) {
  const [meta, file] = line.split("\t");
  modes.set(file, meta.split(" ")[0]);
}
const services = git("ls-files", "*.service").split("\n").filter(Boolean);
let checkedSh = 0;
for (const svc of services) {
  const text = git("show", `:${svc}`);
  for (const raw of text.split("\n")) {
    const m = /^\s*ExecStart\s*=\s*(.*)$/.exec(raw);
    if (!m) continue;
    // Strip systemd's prefix modifiers (-, @, :, +, !) from the command word.
    const word = m[1].trim().split(/\s+/)[0].replace(/^[-@:+!]+/, "");
    const rel = word.replace(/^__REPO__\//, "");
    if (!rel.endsWith(".sh")) continue;
    if (rel.startsWith("/")) {
      notes.push(`${svc}: ${word} is outside the repo; not checked`);
      continue;
    }
    checkedSh++;
    const mode = modes.get(rel);
    if (mode === undefined) {
      failures.push(`${svc}: ExecStart names ${rel}, which git does not track.`);
    } else if (mode !== "100755") {
      failures.push(
        `${svc}: ExecStart runs ${rel} directly, but git has it as mode ${mode}, not 100755; ` +
          `systemd will fail with "Permission denied".\n` +
          `    Fix: git update-index --chmod=+x ${rel}   (then commit; a clean \`git status\` proves nothing on Windows)`,
      );
    }
  }
}

console.log(`script-integrity: ${mjs.length} .mjs files parsed, ${checkedSh} ExecStart .sh file(s) checked in ${services.length} .service file(s).`);
for (const n of notes) console.log(`  note: ${n}`);
console.log(
  "  not covered: ExecStartPre/Post/Stop, drop-ins, ExecStart via an interpreter, .sh not named by a .service, .cjs/.ps1 syntax.",
);
if (failures.length) {
  console.error(`\nscript-integrity FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("script-integrity: ok");
