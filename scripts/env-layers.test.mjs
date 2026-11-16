// mergeLayers: the shell wins over the env files, except for the account token, where an
// environment's own file wins (docs/decisions/2026-11-08-uat-go-live-findings.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeLayers, ACCOUNT_KEYS } from "./lib/env.mjs";

test("the access token is an account key", () => {
  assert.ok(ACCOUNT_KEYS.includes("SUPABASE_ACCESS_TOKEN"));
});

test("the Cloudflare deploy credentials are account keys too (2026-11-16)", () => {
  // They say which Cloudflare account a deploy acts as, so an environment's own file must win:
  // scripts/deploy.mjs hands them to wrangler in place of its expiring OAuth login.
  assert.ok(ACCOUNT_KEYS.includes("CLOUDFLARE_API_TOKEN"));
  assert.ok(ACCOUNT_KEYS.includes("CLOUDFLARE_ACCOUNT_ID"));
});

test("an environment file's Cloudflare token beats the shell's", () => {
  const env = mergeLayers(
    { CLOUDFLARE_API_TOKEN: "local" },
    { CLOUDFLARE_API_TOKEN: "uat-token", CLOUDFLARE_ACCOUNT_ID: "uat-account" },
    { CLOUDFLARE_API_TOKEN: "shell", CLOUDFLARE_ACCOUNT_ID: "shell-account" },
  );
  assert.equal(env.CLOUDFLARE_API_TOKEN, "uat-token");
  assert.equal(env.CLOUDFLARE_ACCOUNT_ID, "uat-account");
});

test("an empty Cloudflare token in the file does not blank the shell's", () => {
  const env = mergeLayers({}, { CLOUDFLARE_API_TOKEN: "" }, { CLOUDFLARE_API_TOKEN: "shell" });
  assert.equal(env.CLOUDFLARE_API_TOKEN, "shell");
});

test("an environment file's own token beats the shell's (UAT, second account)", () => {
  const env = mergeLayers({ SUPABASE_ACCESS_TOKEN: "first" }, { SUPABASE_ACCESS_TOKEN: "second" }, { SUPABASE_ACCESS_TOKEN: "first" });
  assert.equal(env.SUPABASE_ACCESS_TOKEN, "second");
});

test("a file with no token leaves the shell's (production today)", () => {
  const env = mergeLayers({ SUPABASE_ACCESS_TOKEN: "local" }, { NEXT_PUBLIC_SUPABASE_URL: "u" }, { SUPABASE_ACCESS_TOKEN: "shell" });
  assert.equal(env.SUPABASE_ACCESS_TOKEN, "shell");
});

test("an empty token in the file does not blank the shell's", () => {
  const env = mergeLayers({}, { SUPABASE_ACCESS_TOKEN: "" }, { SUPABASE_ACCESS_TOKEN: "shell" });
  assert.equal(env.SUPABASE_ACCESS_TOKEN, "shell");
});

test("every other key: the shell still wins", () => {
  const env = mergeLayers({ A: "base", B: "base" }, { A: "file", B: "file" }, { A: "shell" });
  assert.equal(env.A, "shell");
  assert.equal(env.B, "file");
});
