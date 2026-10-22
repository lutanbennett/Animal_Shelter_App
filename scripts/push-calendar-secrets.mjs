/**
 * Push ONLY the two Google Calendar secrets to the production Worker.
 *
 * Why this exists rather than `deploy.mjs --env production --secrets`:
 * `--secrets` pushes every runtime secret, and four of them
 * (GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REFRESH_TOKEN, GOOGLE_DRIVE_ROOT_FOLDER_ID)
 * resolve only from `.env.local` — the DEV values — so the fallthrough guard
 * refuses, correctly. `--allow-dev-fallthrough` would silence the guard by
 * overwriting four secrets production already holds with dev ones, including
 * the Drive folder id that decides where resident photos are written.
 * Production is missing exactly two secrets, so push exactly those two.
 *
 * Verified against `wrangler secret list --env production` on 2026-10-22:
 * the four Drive values were present and both calendar values absent.
 *
 * This makes a new Worker version from the same code with no release tag, so
 * the Release tile on /admin/status goes amber until the next deploy through
 * deploy.mjs (docs/decisions/2026-10-16-untagged-worker-stays-amber.md). Run it
 * BEFORE the release deploy and that deploy re-tags, so the tile never goes
 * amber at all.
 *
 * Values are never printed. The script refuses unless both come from
 * .env.deploy.production.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { loadEnv, loadLayers, envFile } from "./lib/env.mjs";

const WANT = ["GOOGLE_CALENDAR_REFRESH_TOKEN", "GOOGLE_CALENDAR_ID"];

const env = loadEnv("production");
const { overlay } = loadLayers("production");

for (const key of WANT) {
  if (!env[key]) {
    console.error(`push-calendar-secrets: ${key} is not set for production.`);
    process.exit(2);
  }
  if (!overlay[key]) {
    console.error(
      `push-calendar-secrets: refusing — ${key} does not come from ${envFile("production")}.\n` +
        "  A dev value must not be pushed to the production Worker.",
    );
    process.exit(2);
  }
}

console.log(`push-calendar-secrets: pushing to the production Worker: ${WANT.join(", ")}`);

const WRANGLER = join(
  dirname(createRequire(import.meta.url).resolve("wrangler/package.json")),
  "bin",
  "wrangler.js",
);

const payload = JSON.stringify(Object.fromEntries(WANT.map((k) => [k, env[k]])));
const r = spawnSync(process.execPath, [WRANGLER, "secret", "bulk", "--env", "production"], {
  input: payload,
  stdio: ["pipe", "inherit", "inherit"],
});

if (r.status !== 0) {
  console.error(`push-calendar-secrets: wrangler exited ${r.status}`);
  process.exit(r.status ?? 1);
}
console.log("push-calendar-secrets: done. Deploy next so the Worker carries a release tag again.");
