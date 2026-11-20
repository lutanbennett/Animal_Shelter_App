import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findProblems, readRegistry } from "./lib/platform-files.mjs";

test("the real repository is clean", () => {
  assert.deepEqual(findProblems(readRegistry("."), "."), []);
});

function fixture(files, registry) {
  const root = mkdtempSync(join(tmpdir(), "platfiles-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  for (const [f, t] of Object.entries(files)) writeFileSync(join(root, f), t);
  return findProblems(registry, root);
}
const reg = { platformPaths: [{ path: "/X", writer: "scripts/a.mjs", env: "PLATFORM_DRIVE_FOLDER_ID", reason: "r" }], otherDriveWriters: [] };

test("a NEW script writing to Drive that is not in the registry is caught", () => {
  const p = fixture({ "scripts/a.mjs": "use(env.PLATFORM_DRIVE_FOLDER_ID); drive.files.create({})", "scripts/new-thing.mjs": "await drive.files.create({})" }, reg);
  assert.equal(p.length, 1);
  assert.match(p[0], /new-thing\.mjs writes to Google Drive/);
});
test("a platform writer falling back to a shelter root is caught", () => {
  const p = fixture({ "scripts/a.mjs": "const t = env.PLATFORM_DRIVE_FOLDER_ID ?? env.GOOGLE_DRIVE_ROOT_FOLDER_ID; drive.files.create({})" }, reg);
  assert.match(p.join(), /reads GOOGLE_DRIVE_ROOT_FOLDER_ID/);
});
test("a declared writer that never reads its folder variable is caught", () => {
  const p = fixture({ "scripts/a.mjs": "drive.files.create({})" }, reg);
  assert.match(p.join(), /PLATFORM_DRIVE_FOLDER_ID but never reads it/);
});
test("a registered script passes", () => {
  assert.deepEqual(fixture({ "scripts/a.mjs": "use(env.PLATFORM_DRIVE_FOLDER_ID); drive.files.create({})" }, reg), []);
});
