import test from "node:test";
import assert from "node:assert/strict";
import { ALLOW_FLAG, fallthroughRefusal, localOnly, sourcesFor } from "../../scripts/lib/secret-sources.mjs";

const FILE = ".env.deploy.production";
const layers = {
  shell: { FROM_SHELL: "s" },
  overlay: { SUPABASE_SERVICE_ROLE_KEY: "p", FROM_SHELL: "p" },
  base: { SUPABASE_SERVICE_ROLE_KEY: "d", GOOGLE_DRIVE_ROOT_FOLDER_ID: "dev-folder", GOOGLE_OAUTH_CLIENT_ID: "dev" },
};
const names = ["FROM_SHELL", "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_DRIVE_ROOT_FOLDER_ID", "GOOGLE_OAUTH_CLIENT_ID", "NOWHERE"];
const sources = sourcesFor(names, layers, FILE);

test("each name reports the highest layer that has it", () => {
  assert.deepEqual(sources.map((s) => s.source), ["shell", FILE, ".env.local", ".env.local", null]);
});

test("localOnly lists only names that fell through to the dev file", () => {
  assert.deepEqual(localOnly(sources), ["GOOGLE_DRIVE_ROOT_FOLDER_ID", "GOOGLE_OAUTH_CLIENT_ID"]);
});

test("a push with a secret missing from the production file is refused, naming it", () => {
  const msg = fallthroughRefusal({ envName: "production", sources, overlayName: FILE, allowed: false });
  assert.match(msg, /GOOGLE_DRIVE_ROOT_FOLDER_ID/);
  assert.match(msg, /GOOGLE_OAUTH_CLIENT_ID/);
  assert.doesNotMatch(msg, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(msg, new RegExp(FILE.replace(/\./g, "\.")));
  assert.ok(msg.includes(ALLOW_FLAG));
});

test("the refusal never contains a value", () => {
  const msg = fallthroughRefusal({ envName: "production", sources, overlayName: FILE, allowed: false });
  assert.doesNotMatch(msg, /dev-folder/);
});

test("the explicit flag keeps the deliberate fall-through possible", () => {
  assert.equal(fallthroughRefusal({ envName: "production", sources, overlayName: FILE, allowed: true }), null);
});

test("nothing falling through means no refusal", () => {
  const ok = sourcesFor(["SUPABASE_SERVICE_ROLE_KEY"], layers, FILE);
  assert.equal(fallthroughRefusal({ envName: "production", sources: ok, overlayName: FILE, allowed: false }), null);
});
