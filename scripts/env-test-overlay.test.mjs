// Test's own values file is optional (docs/decisions/2026-11-22-test-deploy-token-file.md):
// envFile("test") names .env.deploy.test, a missing one falls back to .env.local silently, and a
// present one wins for the account keys. Dummy values only, in a temp directory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { envFile, loadEnv, loadLayers } from "./lib/env.mjs";

function inTempDir(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "env-test-overlay-"));
  const cwd = process.cwd();
  const saved = process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_API_TOKEN;
  try {
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    process.chdir(dir);
    fn();
  } finally {
    process.chdir(cwd);
    if (saved !== undefined) process.env.CLOUDFLARE_API_TOKEN = saved;
    rmSync(dir, { recursive: true, force: true });
  }
}

test("every environment, test included, names .env.deploy.<name>", () => {
  assert.equal(envFile("test"), ".env.deploy.test");
  assert.equal(envFile("uat"), ".env.deploy.uat");
});

test("with no .env.deploy.test, test runs on .env.local alone and does not exit", () => {
  inTempDir({ ".env.local": "FOO=base\n" }, () => {
    assert.equal(loadEnv("test").FOO, "base");
    assert.deepEqual(loadLayers("test").overlay, {});
  });
});

test("a .env.deploy.test overrides the shell for the account keys", () => {
  inTempDir({ ".env.local": "FOO=base\n", ".env.deploy.test": "CLOUDFLARE_API_TOKEN=dummy-test-value\n" }, () => {
    process.env.CLOUDFLARE_API_TOKEN = "shell-value";
    const env = loadEnv("test");
    assert.equal(env.CLOUDFLARE_API_TOKEN, "dummy-test-value");
    assert.equal(env.FOO, "base");
  });
});
