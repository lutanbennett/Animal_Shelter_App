import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const lib = join(dirname(fileURLToPath(import.meta.url)), "build-lib.sh").split(String.fromCharCode(92)).join("/");
const sh = (cmd) => spawnSync("bash", ["-c", `source "${lib}"; ${cmd}`], { encoding: "utf8" });

test("a failed build is reported loudly, with the OOM kill named", () => {
  const r = sh("report_build_failure 137");
  assert.match(r.stderr, /DEPLOY FAILED/);
  assert.match(r.stderr, /exit code 137/);
  assert.match(r.stderr, /KILLED/);
  assert.match(r.stderr, /OLD version/);
});

test("a served version that differs from the build fails", () => {
  const r = sh("curl() { echo '{\"version\":\"0.34.0\",\"sha\":null}'; }; check_served_version http://x 0.35.0");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /DEPLOY FAILED/);
  assert.match(r.stderr, /0\.34\.0/);
});

test("a matching served version passes", () => {
  const r = sh("curl() { echo '{\"version\":\"0.35.0\",\"sha\":null}'; }; check_served_version http://x 0.35.0");
  assert.equal(r.status, 0);
});

test("prune removes an oversized .next/cache and keeps a small one", () => {
  const root = mkdtempSync(join(tmpdir(), "pc-")).split(String.fromCharCode(92)).join("/");
  const cache = `${root}/.next/cache`;
  mkdirSync(cache, { recursive: true });
  writeFileSync(`${cache}/big`, Buffer.alloc(3 * 1024 * 1024));
  const keep = sh(`prune_build_cache "${cache}" 100`);
  assert.equal(keep.status, 0);
  assert.ok(existsSync(`${cache}/big`));
  const gone = sh(`prune_build_cache "${cache}" 1`);
  assert.match(gone.stdout, /removing/);
  assert.ok(!existsSync(cache));
  assert.ok(existsSync(`${root}/.next`));
});

test("prune refuses any path that is not a .next/cache", () => {
  const root = mkdtempSync(join(tmpdir(), "pc-")).split(String.fromCharCode(92)).join("/");
  writeFileSync(`${root}/keep`, "x");
  const r = sh(`prune_build_cache "${root}" 0`);
  assert.equal(r.status, 2);
  assert.ok(existsSync(`${root}/keep`));
});
