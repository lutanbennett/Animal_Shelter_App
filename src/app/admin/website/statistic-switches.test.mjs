// Guard for the statistic switches (#jdoto, 0328): the tick is offered only to a login that can edit
// the website, asks the same activity as its action, and a null (switched-off) count is no tile.
// Source-level on purpose, like page-controls-follow-cards.test.mjs: there is no render harness.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const actions = read("./actions.ts");
const ui = read("./ImpactBaselines.tsx");
const page = read("./page.tsx");
const impact = read("../../../lib/site/impact.ts");

test("the action asks website.content at edit, the same activity the page passes as canEdit", () => {
  const body = actions.slice(actions.indexOf("export async function setStatisticShown("));
  assert.match(body.slice(0, 1200), /can\(await loadPermissions\(\), "website\.content"\)/);
  assert.match(page, /const canContent = can\(perms, "website\.content"\);/);
  assert.match(page, /canEdit=\{canContent\}/);
});

test("the tick draws nothing without canEdit, and no role is named", () => {
  assert.match(ui, /if \(!canEdit\) return null;/);
  assert.ok(!/role\.key|isAdmin|"volunteer"|"management"|"doctor"/.test(ui));
});

test("a null count is no tile and the threshold still applies", async () => {
  assert.match(impact, /stat\.value !== null && stat\.value >= LIVE_TILE_MIN/);
  assert.match(impact, /export const LIVE_TILE_MIN = 2;/);
});

test("the switch changes only the flag", () => {
  const body = actions.slice(actions.indexOf("export async function setStatisticShown("));
  const end = body.indexOf("\n}\n");
  assert.equal((body.slice(0, end).match(/\.update\(\{ show_on_website: shown \}\)/g) || []).length, 2);
  assert.ok(!/baseline_count|baseline_date|since_year/.test(body.slice(0, end)));
});
