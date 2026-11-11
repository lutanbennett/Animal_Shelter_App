// The create-the-row button (#ipf1z b): the action inserts { id: true } only and asks website.content (the card the
// 0344 insert policy asks), and the page draws the button only behind the same check. Narrow on purpose: no render harness.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const actions = read("./actions.ts");
const page = read("./page.tsx");

test("createSiteContentRow asks website.content and inserts only the id", () => {
  const body = actions.slice(actions.indexOf("export async function createSiteContentRow("));
  const end = body.indexOf("\nexport async function ", 10);
  const fn = end > 0 ? body.slice(0, end) : body;
  assert.match(fn, /can\(await loadPermissions\(\), "website\.content"\)/);
  assert.match(fn, /\.insert\(\{ id: true \}\)/);
  assert.doesNotMatch(fn, /story_heading|story_body/);
  assert.match(fn, /runWriteAction\(/);
});

test("the button is drawn only when the login holds website.content", () => {
  assert.match(page, /canCreate && <CreateSiteContentRow canEdit=\{canCreate\} \/>/);
  assert.match(page, /const canCreate = perms \? can\(perms, "website\.content"\) : false/);
  assert.match(page, /<ContentProblem read=\{contentRead\} t=\{t\} perms=\{early\} \/>/);
  assert.doesNotMatch(page, /<ContentProblem read=\{draftRead\} t=\{t\} perms/);
});
