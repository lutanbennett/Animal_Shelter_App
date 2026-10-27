// Guard, slice 4 of "a button is shown only if the login's cards let it do that action" (CLAUDE.md).
// Narrow on purpose, like the earlier slices: it asserts the job photo gate is PRESENT and that the upload route
// asks the same activity. It cannot detect a NEW ungated control (no render harness in the repo).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("a job's photo add and remove controls need maintenance.photos, the activity the upload route asks", () => {
  const page = read("./[id]/page.tsx");
  const view = read("./[id]/MaintenanceJobView.tsx");
  assert.ok(page.includes('canPhotos={can(perms, "maintenance.photos")}'));
  assert.ok(read("../api/maintenance/[id]/attachments/route.ts").includes('"maintenance.photos"'));
  assert.equal(view.split("canRemove={canPhotos}").length - 1, 2, "both photo sections remove on canPhotos");
  assert.equal(view.split("canAdd={canPhotos}").length - 1, 2, "both photo sections add on canPhotos");
  assert.match(view, /\{canAdd && \(\n\s+<ActionButton/, "the add button must sit behind canAdd");
  assert.ok(!view.includes("canRemove={canWrite}"), "remove must not ride on maintenance.jobs");
});
