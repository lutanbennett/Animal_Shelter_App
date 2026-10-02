#!/usr/bin/env node
/**
 * Checks the Server Actions encryption key plumbing (scripts/lib/actions-key.mjs):
 * the Worker build and the Pi build must be made with the same key, or a form
 * rendered by one fails on the other with "Failed to find Server Action".
 *
 *   node scripts/check-actions-key.mjs
 *
 * Two parts. The first exercises the helpers on throwaway manifests: what makes
 * a key unusable, and that a build made with another key (or none recorded) is
 * caught. The second reads the three places that must carry the key to a build
 * and fails if one stops doing so — deploy.mjs (Worker), write-env.mjs (the Pi's
 * env file) and deploy-pi.sh (the check before the restart) — because dropping
 * any one of them is silent: the site keeps working until the Pi drops and a
 * form crosses over. It does NOT build anything; the cross-build behaviour
 * itself was reproduced by hand (docs/decisions/2026-10-03-server-actions-encryption-key.md).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { actionsKeyProblem, builtKeyProblem, generateActionsKey, keyFingerprint } from "./lib/actions-key.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

// ── Part 1: the helpers ─────────────────────────────────────────────────────

const key = generateActionsKey();
const other = generateActionsKey();
check("a generated key is usable", actionsKeyProblem(key) === null, String(actionsKeyProblem(key)));
check("two generated keys differ", key !== other);
check("a missing key is refused", /not set/.test(actionsKeyProblem(undefined) ?? ""));
check("an empty key is refused", actionsKeyProblem("") !== null);
check("a non-base64 key is refused", /not base64/.test(actionsKeyProblem("not a key!!") ?? ""));
check("a 10-byte key is refused", /10 bytes/.test(actionsKeyProblem(Buffer.alloc(10).toString("base64")) ?? ""));
for (const n of [16, 24, 32]) check(`a ${n}-byte key is accepted`, actionsKeyProblem(Buffer.alloc(n, 7).toString("base64")) === null);
check("the fingerprint is stable and short", keyFingerprint(key) === keyFingerprint(key) && keyFingerprint(key).length === 12);
check("the fingerprint tells keys apart", keyFingerprint(key) !== keyFingerprint(other));
check("the fingerprint does not contain the key", !key.includes(keyFingerprint(key)) && !keyFingerprint(key).includes(key.slice(0, 8)));

const dir = mkdtempSync(join(tmpdir(), "actions-key-"));
try {
  const manifest = (body) => {
    const path = join(dir, `m${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(path, JSON.stringify(body));
    return path;
  };
  check("a build made with the key passes", builtKeyProblem(key, manifest({ node: {}, encryptionKey: key })) === null);
  const wrong = builtKeyProblem(key, manifest({ node: {}, encryptionKey: other }));
  check("a build made with another key is caught", /carries key .* not the configured/.test(wrong ?? ""), String(wrong));
  check("the message names fingerprints, not keys", wrong !== null && !wrong.includes(key) && !wrong.includes(other));
  check("a manifest with no key is caught", /no encryptionKey/.test(builtKeyProblem(key, manifest({ node: {} })) ?? ""));
  check("a missing build is caught", /not found/.test(builtKeyProblem(key, join(dir, "nope.json")) ?? ""));
  const garbage = join(dir, "garbage.json");
  writeFileSync(garbage, "{");
  check("an unreadable manifest is caught", /could not read/.test(builtKeyProblem(key, garbage) ?? ""));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// ── Part 2: every build path carries the key ────────────────────────────────

const text = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const deploy = text("./deploy.mjs");
const writeEnv = text("./pi/write-env.mjs");
const deployPi = text("./pi/deploy-pi.sh");

check("deploy.mjs refuses to build without the key", /actionsKeyProblem\(env\[ACTIONS_KEY_VAR\]\)/.test(deploy));
check("deploy.mjs puts the key in the build's environment", /\[\.\.\.BUILD_VARS, ACTIONS_KEY_VAR\]/.test(deploy));
check("deploy.mjs checks the build it made", /builtKeyProblem\(env\[ACTIONS_KEY_VAR\]\)/.test(deploy));
check("write-env.mjs refuses to write a file without the key", /actionsKeyProblem\(env\[ACTIONS_KEY_VAR\]\)/.test(writeEnv));
check("write-env.mjs writes the key to .env.production.local", /`\$\{ACTIONS_KEY_VAR\}=\$\{env\[ACTIONS_KEY_VAR\]\}`/.test(writeEnv));
const afterBuild = deployPi.split(/npm run build\n/)[1] ?? "";
check(
  "deploy-pi.sh checks the build before restarting the service",
  /actions-key\.mjs --env "\$ENV_NAME" --built/.test(afterBuild) &&
    afterBuild.indexOf("actions-key.mjs") < afterBuild.indexOf("systemctl restart"),
);

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
