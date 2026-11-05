// Guard: the home-page settings draft path (0315) asks the activities it should and shares one validation with the publish.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const actions = read("./actions.ts");
const form = read("./SiteSettingsForm.tsx");

const body = (fn) => actions.slice(actions.indexOf(`export async function ${fn}(`), actions.indexOf("\n}\n", actions.indexOf(`export async function ${fn}(`)));

test("proposeSiteContent asks website.propose and drafts site_content through the RPC", () => {
  const b = body("proposeSiteContent");
  assert.match(b, /can\(await loadPermissions\(\), "website\.propose"\)/);
  assert.match(b, /p_target: "site_content"/);
  assert.match(b, /propose_website_draft/);
  assert.doesNotMatch(b, /from\("site_content"\)/);
});

test("the publish and the draft share one validation", () => {
  assert.match(body("updateSiteContent"), /siteContentPatch\(/);
  assert.match(body("proposeSiteContent"), /siteContentPatch\(/);
});

test("the settings form draws Save only for website.content or website.propose, both defaulting to false", () => {
  assert.match(form, /canEdit = false/);
  assert.match(form, /canPropose = false/);
  assert.match(form, /\(canEdit \|\| canPropose\) &&/);
});
