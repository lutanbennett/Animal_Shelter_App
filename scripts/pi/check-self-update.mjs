#!/usr/bin/env node
// Proves deploy-pi.sh runs the script it just checked out, not the one bash had open.
// Builds a throwaway origin + clone with stubbed build/service commands, ships a changed
// deploy-pi.sh, runs the OLD copy against it and looks at what ran.
// Run: node scripts/pi/check-self-update.mjs   (needs bash and git; run in CI)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const real = readFileSync(join(repoRoot, "scripts/pi/deploy-pi.sh"), "utf8");
const MARK = 'echo "deploy-pi: at $(git rev-parse --short HEAD)';
if (!real.includes(MARK)) throw new Error("marker line missing from deploy-pi.sh");
const variant = (v) => real.replace(MARK, `echo "PAYLOAD-RAN=${v}"\n${MARK}`);

const tmp = mkdtempSync(join(tmpdir(), "self-update-"));
const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
const git = (cwd, ...a) => execFileSync("git", a, { cwd, env, encoding: "utf8" });
let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : "\n" + detail}`); if (!ok) failed++; };

try {
  // stubs for everything the script calls that a laptop/CI runner must not really do
  const bin = join(tmp, "bin"); mkdirSync(bin);
  for (const c of ["npm", "sudo", "curl", "sleep"]) { writeFileSync(join(bin, c), `#!/bin/sh\necho "STUB ${c} $*" >> "${tmp}/stubs.log"\n`); chmodSync(join(bin, c), 0o755); }
  writeFileSync(join(tmp, "meminfo"), "SwapTotal:       6291452 kB\n");

  const origin = join(tmp, "origin.git"); execFileSync("git", ["init", "--bare", "-b", "main", origin], { env });
  const dev = join(tmp, "dev"); mkdirSync(dev); git(dev, "init", "-b", "main"); git(dev, "remote", "add", "origin", origin);
  mkdirSync(join(dev, "scripts/pi"), { recursive: true });
  for (const f of ["guard-release.mjs", "write-env.mjs", "check-assets.mjs"]) writeFileSync(join(dev, "scripts/pi", f), "process.exit(0);\n");
  writeFileSync(join(dev, "scripts/pi/build-lib.sh"), readFileSync(join(repoRoot, "scripts/pi/build-lib.sh"), "utf8"));
  for (const f of ["actions-key.mjs", "apply-migrations.mjs"]) writeFileSync(join(dev, "scripts", f), "process.exit(0);\n");
  const ship = (text, msg) => { writeFileSync(join(dev, "scripts/pi/deploy-pi.sh"), text); git(dev, "add", "-A"); git(dev, "commit", "-qm", msg); git(dev, "push", "-q", "origin", "main"); };
  ship(variant("v1"), "v1");

  const clone = join(tmp, "Animal_Shelter_App"); // not *_test, so it is a production clone
  execFileSync("git", ["clone", "-q", origin, clone], { env });
  git(clone, "update-ref", "refs/remotes/origin/main", "HEAD");

  const run = (extraEnv = {}, args = []) => spawnSync("bash", ["./scripts/pi/deploy-pi.sh", "--env", "production", ...args], {
    cwd: clone, encoding: "utf8", env: { ...env, PATH: `${bin}:${process.env.PATH}`, MEMINFO: join(tmp, "meminfo"), ...extraEnv },
  });
  const out = (r) => r.stdout + r.stderr;

  // 1. the headline: a change to the script lands on the SAME deploy
  ship(variant("v2"), "v2: changed payload");
  let r = run();
  check("deploy exits 0", r.status === 0, out(r));
  check("the NEW script ran (v2), same deploy", out(r).includes("PAYLOAD-RAN=v2"), out(r));
  check("the old script's payload did not run", !out(r).includes("PAYLOAD-RAN=v1"), out(r));
  check("re-exec happened exactly once (no loop)", out(r).split("restarting under the script").length === 2, out(r));
  check("build ran once", (readFileSync(join(tmp, "stubs.log"), "utf8").match(/STUB npm run build/g) || []).length === 1);

  // 2. the guard: with it set, a changed file is NOT re-exec'd, so it cannot loop
  rmSync(join(tmp, "stubs.log"));
  ship(variant("v3"), "v3");
  r = run({ DEPLOY_PI_REEXECED: "1" });
  check("guard set: no second exec", !out(r).includes("restarting under"), out(r));

  // 3. arguments survive the exec
  r = run({}, ["--force", "because"]);
  check("arguments survive the exec (--force reason reaches the new script)", r.status === 0 && out(r).includes("PAYLOAD-RAN=v3"), out(r));

  // 4. a script that does not parse is refused BEFORE anything is built
  rmSync(join(tmp, "stubs.log"), { force: true });
  ship(real + "\nif then fi (\n", "v4 broken");
  r = run();
  check("unparseable new script: exit 2, refusing", r.status === 2 && out(r).includes("does not parse"), out(r));
  check("unparseable new script: nothing built or restarted", !existsSync(join(tmp, "stubs.log")), out(r));

  // 5. log redirect and detached wrapper survive the exec
  ship(variant("v5"), "v5");
  const log = join(tmp, "deploy.log");
  const detach = spawnSync("sh", ["-c", `command -v setsid >/dev/null && W="setsid nohup" || W="nohup"; $W bash ./scripts/pi/deploy-pi.sh --env production >> "${log}" 2>&1; echo done`], {
    cwd: clone, encoding: "utf8", env: { ...env, PATH: `${bin}:${process.env.PATH}`, MEMINFO: join(tmp, "meminfo") },
  });
  const logged = existsSync(log) ? readFileSync(log, "utf8") : "";
  check("log redirect + setsid/nohup: the new script's output lands in the log", logged.includes("PAYLOAD-RAN=v5") && logged.includes("restarting under"), detach.stdout + detach.stderr + logged);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\ncheck-self-update: all passed");
