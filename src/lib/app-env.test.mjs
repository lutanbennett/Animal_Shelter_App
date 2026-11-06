import test from "node:test";
import assert from "node:assert/strict";
import { appEnvForSupabaseUrl } from "./app-env.ts";

// Each environment has its own Supabase project, so the project alone names it
// (docs/decisions/2026-11-06-uat-own-database.md).
const DEV = "https://qxkmhwybjggxvsfxsxbd.supabase.co";
const UAT = "https://fsjagxmxjosauwmxwype.supabase.co";
const PROD = "https://dbkodyyxxhtygxcxmfcu.supabase.co";

test("each known project names its own environment", () => {
  assert.equal(appEnvForSupabaseUrl(DEV), "dev");
  assert.equal(appEnvForSupabaseUrl(UAT), "uat");
  assert.equal(appEnvForSupabaseUrl(PROD), "production");
});

test("anything unknown renders as production, never badged", () => {
  assert.equal(appEnvForSupabaseUrl(""), "production");
  assert.equal(appEnvForSupabaseUrl("https://example.supabase.co"), "production");
});
