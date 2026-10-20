// The gate that decides whether CI's heavy jobs run. Its only dangerous answer
// is a false "docs-only", which would skip real checks on real code — so most of
// what is asserted here is that it says "false" whenever it is unsure.
import { test } from "node:test";
import assert from "node:assert/strict";

import { classify, isDocPath } from "./check-docs-only.mjs";

test("docs/ and root markdown are documents", () => {
  assert.equal(isDocPath("docs/release-handover.md"), true);
  assert.equal(isDocPath("docs/test-plans/cut-release-0-38-0.md"), true);
  assert.equal(isDocPath("docs/releases/2026-10-20.md"), true);
  assert.equal(isDocPath("README.md"), true);
  assert.equal(isDocPath("CLAUDE.md"), true);
  assert.equal(isDocPath("AGENTS.md"), true);
});

test("anything that a build, script or database check reads is not", () => {
  for (const p of [
    "src/lib/releases.ts",
    "src/app/page.tsx",
    "worker/security-headers.mjs",
    "scripts/deploy.mjs",
    "scripts/check-public-views.mjs",
    "supabase/migrations/0233_desexing_drives.sql",
    "package.json",
    "package-lock.json",
    ".github/workflows/ci.yml",
    // Nested markdown stays code: it may be imported as content.
    "src/lib/manual/notes.md",
  ]) {
    assert.equal(isDocPath(p), false, `${p} must not count as a document`);
  }
});

test("a documents-only diff is docs-only", () => {
  const r = classify(["docs/releases/2026-10-20.md", "docs/release-handover.md"]);
  assert.equal(r.docsOnly, true);
});

test("one code path among many documents is enough to run everything", () => {
  const r = classify([
    "docs/releases/2026-10-20.md",
    "docs/release-handover.md",
    "src/lib/releases.ts",
  ]);
  assert.equal(r.docsOnly, false);
  assert.deepEqual(r.paths, ["src/lib/releases.ts"], "it names what made it code");
});

test("an empty diff runs everything rather than skipping", () => {
  // Nothing read is not the same as nothing changed, and guessing "docs" here
  // would skip every check on a PR whose diff could not be computed.
  const r = classify([]);
  assert.equal(r.docsOnly, false);
  assert.match(r.reason, /no changed files/);
});

test("a migration alone is never docs-only", () => {
  // The case that matters most: 0231 narrowed a public view, and public-views is
  // one of the jobs this gate can skip.
  assert.equal(classify(["supabase/migrations/0231_public_photos_exclude_videos.sql"]).docsOnly, false);
});
