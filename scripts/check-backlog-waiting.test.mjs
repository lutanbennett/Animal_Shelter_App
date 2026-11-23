// The one thing that must not happen here is a SILENT pass. .githooks/pre-commit refuses on exit 3
// and lets every other non-zero exit through ("commit allowed; CI checks the PR"), so a check that
// crashes on a corrupt docs/backlog-names.json waves the commit past without having verified a
// single item. These tests pin which failures are findings (3) and which are genuinely crashes (1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parseNames } from "./lib/backlog-waiting.mjs";

const SCRIPT = fileURLToPath(new URL("./check-backlog-waiting.mjs", import.meta.url));

// One valid open item, so nothing BUT the names file is ever what fails below.
const GOOD_ITEM = "- [ ] <!--#aaaaa--> **A title that reads as a job.** Body. <!--waiting:buildable since:2026-01-01-->";
const GOOD_NAMES = '{\n  "aaaaa": "A test item name"\n}\n';

// Runs the real script in a throwaway directory, so it reads these files and not the repo's.
// Outside a git repository on purpose: the HEAD lookup that locks names against renaming fails
// and is caught, which is the same path a brand-new names file takes.
function run({ backlog = `# Backlog\n\n## Security\n\n${GOOD_ITEM}\n\n## Completed\n`, names = GOOD_NAMES } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "backlog-waiting-"));
  try {
    mkdirSync(join(dir, "docs"));
    writeFileSync(join(dir, "docs", "backlog.md"), backlog);
    if (names !== null) writeFileSync(join(dir, "docs", "backlog-names.json"), names);
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a well-formed backlog and names file pass", () => {
  const r = run();
  assert.equal(r.code, 0, r.out);
});

test("a names file that is not JSON is REFUSED, not waved through", () => {
  const r = run({ names: '{\n  "aaaaa": "A test item name",\n' });
  assert.equal(r.code, 3, `exit 3 is what the hook refuses on; got ${r.code}\n${r.out}`);
  assert.match(r.out, /not valid JSON/);
});

test("a names file that is not a flat map of id to name is refused", () => {
  for (const names of ['["aaaaa"]', '"a string"', "null", "42"]) {
    const r = run({ names });
    assert.equal(r.code, 3, `${names} should be a finding, got ${r.code}\n${r.out}`);
  }
});

test("a name that is not text is refused", () => {
  const r = run({ names: '{\n  "aaaaa": 7\n}\n' });
  assert.equal(r.code, 3, r.out);
  assert.match(r.out, /"aaaaa" is number/);
});

test("the refusal says the file was unusable, so nobody reads it as the item's fault", () => {
  const r = run({ names: "{oh dear" });
  assert.match(r.out, /backlog-names\.json is unusable/);
  assert.match(r.out, /nothing at all was verified/);
});

test("a names file that is ABSENT is a crash, not a finding, so old branches still commit", () => {
  // A branch cut before #bkwai has no names file at all. Refusing there would block a stream
  // ticking its own item for a file it never had, so this one stays a crash on purpose and the
  // hook lets it through. CI still checks the PR.
  const r = run({ names: null });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /could not read/);
});

test("a real finding in the items themselves still exits 3", () => {
  // Proves the names path above did not swallow the ordinary case.
  const r = run({ backlog: "# Backlog\n\n- [ ] <!--#aaaaa--> **No tag at all.**\n\n## Completed\n" });
  assert.equal(r.code, 3, r.out);
});

test("parseNames accepts a flat map and names what is wrong with anything else", () => {
  assert.deepEqual(parseNames('{"a":"one two three"}'), { a: "one two three" });
  assert.deepEqual(parseNames("{}"), {});
  assert.throws(() => parseNames("{"), /not valid JSON/);
  assert.throws(() => parseNames("[]"), /an array/);
  assert.throws(() => parseNames("null"), /not a flat object/);
  assert.throws(() => parseNames('{"a":null}'), /"a" is null/);
  assert.throws(() => parseNames('{"a":{"b":"c"}}'), /"a" is object/);
});
