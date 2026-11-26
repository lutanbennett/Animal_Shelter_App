import { test } from "node:test";
import assert from "node:assert/strict";
import { changedVars, applyingStep } from "./lib/wrangler-var-steps.mjs";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";

test("PUBLIC_SITE applies at the Pi build (the 0.49.2 fault)", () => {
  assert.equal(applyingStep("PUBLIC_SITE", RUNTIME_CONFIG), "pi-build");
});

test("every Pi-read wrangler var applies at the Pi build", () => {
  for (const c of RUNTIME_CONFIG.filter((c) => c.source === "wrangler" && c.where === "pi")) {
    assert.equal(applyingStep(c.name, RUNTIME_CONFIG), "pi-build", c.name);
  }
});

test("a Worker-only or unlisted var applies at the Worker deploy", () => {
  assert.equal(applyingStep("SUPABASE_URL", RUNTIME_CONFIG), "worker-deploy");
  assert.equal(applyingStep("NOT_A_REAL_VAR", RUNTIME_CONFIG), "worker-deploy");
});

test("changedVars finds changed, added and removed vars per env", () => {
  const before = { vars: { A: "1" }, env: { production: { vars: { PUBLIC_SITE: "locked", X: "x" } } } };
  const after = { vars: { A: "1" }, env: { production: { vars: { PUBLIC_SITE: "open", Y: "y" } } } };
  const got = changedVars(before, after).map((c) => `${c.env}.${c.name}`).sort();
  assert.deepEqual(got, ["production.PUBLIC_SITE", "production.X", "production.Y"]);
});
