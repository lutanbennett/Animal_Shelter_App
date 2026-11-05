import test from "node:test";
import assert from "node:assert/strict";
import { appEnvFor, appEnvForSupabaseUrl } from "./app-env.ts";

// UAT shares the dev project (docs/decisions/2026-11-05-uat-shares-the-dev-database.md), so the
// badge comes from a pin in the UAT build. The pin must never relabel any other project.
const DEV = "https://qxkmhwybjggxvsfxsxbd.supabase.co";
const PROD = "https://dbkodyyxxhtygxcxmfcu.supabase.co";

test("no pin: the project decides", () => {
  assert.equal(appEnvFor(DEV, undefined), "dev");
  assert.equal(appEnvFor(DEV, ""), "dev");
  assert.equal(appEnvFor(PROD, undefined), "production");
});

test("the uat pin on the dev project makes a UAT build", () => {
  assert.equal(appEnvFor(DEV, "uat"), "uat");
});

test("the uat pin can never relabel production or an unknown project", () => {
  assert.equal(appEnvFor(PROD, "uat"), "production");
  assert.equal(appEnvFor("", "uat"), "production");
});

test("any other pin value is ignored", () => {
  assert.equal(appEnvFor(DEV, "production"), "dev");
  assert.equal(appEnvFor(DEV, "UAT"), "dev");
});

test("appEnvForSupabaseUrl stays project-only, so the correction scripts still see dev as dev", () => {
  assert.equal(appEnvForSupabaseUrl(DEV), "dev");
  assert.equal(appEnvForSupabaseUrl(PROD), "production");
});
