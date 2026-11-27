import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveSince, releaseRecords } from "./lib/release-records.mjs";

const SHA = "ef022e14633c423279bfb81e1eab143ed878c640";
function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "release-records-"));
  mkdirSync(join(root, "docs", "releases"), { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(root, "docs", "releases", name), body);
  return root;
}

test("a record found: the newest record's commit is the default, with where it came from", () => {
  const root = repo({
    "2026-11-25-0-49-2.md": "# Release 0.49.2\n\n**Shipped** x. **Commit** `5344c037a0000000000000000000000000000000`.\n",
    "2026-11-26-0-49-3.md": `# Release 0.49.3\n\n**Shipped** 2026-11-27 (UTC). **Commit** \`${SHA}\`.\n`,
    "2026-09-30.md": "an old undated-version record, ignored\n",
  });
  assert.deepEqual(resolveSince({ root }), {
    sha: SHA, source: "record", version: "0.49.3", file: "docs/releases/2026-11-26-0-49-3.md",
  });
});

test("orders by version within a day, not by file name", () => {
  const root = repo({ "2026-11-25-0-49-10.md": "", "2026-11-25-0-49-9.md": "" });
  assert.equal(releaseRecords(root).at(-1).version, "0.49.10");
});

test("a record with no commit line refuses rather than guessing", () => {
  const root = repo({ "2026-11-26-0-49-3.md": "# Release 0.49.3\n\nnot shipped yet\n" });
  const r = resolveSince({ root });
  assert.equal(r.sha, undefined);
  assert.match(r.error, /2026-11-26-0-49-3\.md has no \*\*Commit\*\*/);
});

test("no records at all refuses, naming where it looked", () => {
  const r = resolveSince({ root: repo({}) });
  assert.equal(r.sha, undefined);
  assert.match(r.error, /no release record/);
});

test("an explicit argument overrides the default", () => {
  const root = repo({ "2026-11-26-0-49-3.md": `**Commit** \`${SHA}\`` });
  assert.deepEqual(resolveSince({ arg: "abc1234", root }), { sha: "abc1234", source: "argument" });
});
