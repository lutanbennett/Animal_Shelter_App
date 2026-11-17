import { test } from "node:test";
import assert from "node:assert/strict";
import { findSites, compare, unfilteredClaims } from "./lib/service-role-sites.mjs";

const reg = (...ids) => ({ sites: ids.map((id) => ({ id, classification: "needs-shelter-filter", reason: "a real reason here, long enough" })) });
const src = (body) => `export async function load() {\n${body}\n}\n`;

test("a recorded call passes", () => {
  const sites = findSites({ "src/a.ts": src("  const db = createAdminClient();") });
  const r = compare(sites, reg("src/a.ts#load"));
  assert.equal(r.unregistered.length + r.stale.length + r.noReason.length, 0);
});
test("PLANTED: a new unregistered call fails", () => {
  const sites = findSites({ "src/a.ts": src("  const db = createAdminClient();"), "src/b.ts": src("  createAdminClient().from('x');") });
  assert.deepEqual(compare(sites, reg("src/a.ts#load")).unregistered.map((s) => s.id), ["src/b.ts#load"]);
});
test("PLANTED: a second call in an already-recorded function fails", () => {
  const sites = findSites({ "src/a.ts": src("  createAdminClient();\n  createAdminClient();") });
  assert.deepEqual(compare(sites, reg("src/a.ts#load")).unregistered.map((s) => s.id), ["src/a.ts#load#2"]);
});
test("a record whose call is gone is stale", () => {
  assert.deepEqual(compare([], reg("src/a.ts#load")).stale, ["src/a.ts#load"]);
});
test("a bare classification with no reason fails", () => {
  const sites = findSites({ "src/a.ts": src("  createAdminClient();") });
  const r = compare(sites, { sites: [{ id: "src/a.ts#load", classification: "cross-shelter", reason: "" }] });
  assert.deepEqual(r.noReason, ["src/a.ts#load"]);
});
test("comments and the definition do not count", () => {
  const sites = findSites({ "src/a.ts": "// createAdminClient() is fenced\nexport function createAdminClient() {}", "src/lib/supabase/admin.ts": "createAdminClient(" });
  assert.equal(sites.length, 0);
});

const filteredReg = (id) => ({ sites: [{ id, classification: "filtered", reason: "a real reason here, long enough" }] });

test("a site recorded filtered with a shelter filter passes", () => {
  const files = { "src/a.ts": src('  const db = createAdminClient();\n  db.from("x").eq("shelter_id", shelterId);') };
  assert.deepEqual(unfilteredClaims(files, findSites(files), filteredReg("src/a.ts#load")), []);
});

test("PLANTED: a site recorded filtered with no shelter filter fails", () => {
  const files = { "src/a.ts": src('  const db = createAdminClient();\n  db.from("x").select("*");') };
  assert.deepEqual(unfilteredClaims(files, findSites(files), filteredReg("src/a.ts#load")), ["src/a.ts#load"]);
});

test("a shelter filter in a different function does not count", () => {
  const files = { "src/a.ts": `${src('  const db = createAdminClient();')}export async function other() {\n  return shelterId;\n}\n` };
  assert.deepEqual(unfilteredClaims(files, findSites(files), filteredReg("src/a.ts#load")), ["src/a.ts#load"]);
});
