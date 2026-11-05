// `npm run opennext:build` under the checkout's tree lock, so a bare build and a
// guarded `npm ci` (scripts/guarded-install.mjs) cannot overlap. When deploy.mjs
// runs it, deploy already holds the lock and this runs under it (TREE_LOCK_PID).
// docs/decisions/2026-11-05-planner-tooling-follow-ups.md
import { spawnSync } from "node:child_process";
import { takeTreeLock } from "./lib/tree-lock.mjs";

try {
  takeTreeLock("build");
} catch (e) {
  console.error(`opennext:build: ${e.message}`);
  process.exit(2);
}
const r = spawnSync(
  process.execPath,
  ["-r", "./scripts/win-junction-symlinks.cjs", "node_modules/@opennextjs/cloudflare/dist/cli/index.js", "build", ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(r.status ?? 1);
