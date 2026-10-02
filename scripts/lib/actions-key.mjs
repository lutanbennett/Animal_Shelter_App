// The Server Actions encryption key: one value per environment, built into BOTH
// the Worker and the Pi's build.
//
// Next generates a random key for every build and uses it twice: to encrypt the
// variables a Server Action closes over, and as the salt of every action's id
// (webpack-config.js `serverReferenceHashSalt`). So a form rendered by one build
// and posted to another carries an id the second build has never heard of, and
// it answers 500 "Failed to find Server Action" — for every action, not only
// ones with bound arguments. Reproduced 2026-10-03 (docs/decisions/
// 2026-10-03-server-actions-encryption-key.md). The Worker serves writes whenever
// the tunnel answers 530, so a page the Pi rendered and a submit the Worker
// receives (or the reverse) is now an ordinary event.
//
// Setting NEXT_SERVER_ACTIONS_ENCRYPTION_KEY for `next build` makes both builds
// use it. It lives where every other per-environment value does (.env.local for
// test, .env.deploy.<env> for uat/production, on the dev machine AND on the Pi)
// and reaches the Worker build through scripts/deploy.mjs and the Pi build
// through scripts/pi/write-env.mjs.
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export const ACTIONS_KEY_VAR = "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY";

// Where `next build` records the key a build was made with; both a plain build
// (the Pi) and the OpenNext one (the Worker) leave it here.
export const BUILT_MANIFEST = ".next/server/server-reference-manifest.json";

export const GENERATE_HINT = `node scripts/actions-key.mjs --generate`;

/** Why `key` cannot be used, or null. Next wants base64 of 16, 24 or 32 bytes. */
export function actionsKeyProblem(key) {
  if (!key) {
    return (
      `${ACTIONS_KEY_VAR} is not set. The Worker and the Pi each build with their own random key ` +
      `otherwise, and a form rendered by one fails on the other ("Failed to find Server Action"). ` +
      `Make one with \`${GENERATE_HINT}\` and put the same line in this environment's values file ` +
      `on the dev machine and on the Pi.`
    );
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(key) || key.length % 4 !== 0) return `${ACTIONS_KEY_VAR} is not base64.`;
  const bytes = Buffer.from(key, "base64").length;
  if (![16, 24, 32].includes(bytes)) return `${ACTIONS_KEY_VAR} decodes to ${bytes} bytes; it must be 16, 24 or 32.`;
  return null;
}

/**
 * A short, non-reversible name for a key, safe to print and to compare by eye
 * between the dev machine and the Pi. The key itself is never printed.
 */
export function keyFingerprint(key) {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

/** A fresh key in the form Next generates: 32 random bytes, base64. */
export function generateActionsKey() {
  return randomBytes(32).toString("base64");
}

/**
 * Why the build in `.next` was NOT made with `key`, or null when it was.
 * Reads the key `next build` wrote down, so a stale build, a `--skip-build`
 * over an older one, or a shell that lost the variable all show up here and not
 * as a form failing in front of someone.
 */
export function builtKeyProblem(key, manifestPath = BUILT_MANIFEST) {
  if (!existsSync(manifestPath)) return `${manifestPath} not found — build first.`;
  let built;
  try {
    built = JSON.parse(readFileSync(manifestPath, "utf8")).encryptionKey;
  } catch (e) {
    return `could not read ${manifestPath}: ${e.message}`;
  }
  if (typeof built !== "string") return `${manifestPath} records no encryptionKey.`;
  if (built !== key) {
    return (
      `this build carries key ${keyFingerprint(built)}, not the configured ${keyFingerprint(key)} — ` +
      `it will not accept forms rendered by a build made with the configured key. Build again.`
    );
  }
  return null;
}
