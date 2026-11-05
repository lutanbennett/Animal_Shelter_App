// `npm ci` that refuses to run while a build is using this checkout's
// node_modules (and the reverse: deploy.mjs refuses while this runs).
//
//   node scripts/guarded-install.mjs     # always the checkout this script lives in
//
// Exit 0 = installed; 1 = refused or npm failed. It never skips silently.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { takeTreeLock } from "./lib/tree-lock.mjs";
import { refuseIfServerRunning } from "./lib/live-servers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  // Before anything is deleted: a running server holds files open and `npm ci` would gut the tree.
  refuseIfServerRunning(root);
  takeTreeLock("install");
} catch (e) {
  console.error(`guarded-install: ${e.message}`);
  process.exit(1);
}
const r = spawnSync("npm ci", { cwd: root, stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
