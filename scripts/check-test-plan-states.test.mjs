// `pending:` on a checklist line passes and a half-written plan passes, while
// every genuinely wrong shape still fails (2026-11-05; Lutan: "Every stream is
// failing test plan"). The states are easy to widen by accident — a catch-all
// that swallows an unticked line would make this check assert almost nothing —
// so the five failing shapes are pinned here beside the two passing ones.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The smallest plan the checker calls complete: one box, a Result, two
// signatures. Built here rather than copied from the template so a template
// edit cannot quietly change what these tests are asserting.
const COMPLETE = `# Feature test plan — fixture

## 1. Scope and risk

- [x] Change is described in one sentence

## 8. Pre-production gate

- [ ] Deployed and checked — deferred: release manager

## Sign-off

Automated checks by: Someone  Date: 2026-11-05

Manual verification by: n/a: nothing to look at

Result: pass
`;

function check(body) {
  const dir = mkdtempSync(path.join(tmpdir(), "tps-"));
  try {
    const git = (...a) =>
      execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...a], { cwd: dir, stdio: "pipe" });
    git("init", "-q");
    writeFileSync(path.join(dir, "x.txt"), "x");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    mkdirSync(path.join(dir, "docs", "test-plans"), { recursive: true });
    writeFileSync(path.join(dir, "docs", "test-plans", "fixture.md"), body);
    git("add", "-A");
    const r = spawnSync(process.execPath, [path.join(repo, "scripts", "check-test-plan.mjs"), "--base", "HEAD"], {
      cwd: dir,
      encoding: "utf8",
    });
    return { code: r.status, text: (r.stdout ?? "") + (r.stderr ?? "") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Guard the guard: if the baseline itself stopped passing, every "still fails"
// assertion below would pass for the wrong reason.
test("the complete fixture passes, so the failures below mean something", () => {
  const { code, text } = check(COMPLETE);
  assert.equal(code, 0, `baseline must pass, got:\n${text}`);
});

test("`pending: <detail>` on a checklist line passes and is printed as awaiting a person", () => {
  const { code, text } = check(COMPLETE.replace("- [x] Change is described in one sentence", "- [ ] Change is described in one sentence — pending: Lutan's own upload after the Worker deploy"));
  assert.equal(code, 0, `an honest pending must not fail, got:\n${text}`);
  assert.match(text, /await/i);
  assert.match(text, /Lutan's own upload/);
});

test("a plan still being written passes and says so", () => {
  const { code, text } = check(COMPLETE.replace(/^Result: pass$/m, "").replace("Someone", "<name>").replace("2026-11-05", "<yyyy-mm-dd>"));
  assert.equal(code, 0, `a half-written plan must not fail, got:\n${text}`);
  assert.match(text, /still being written/i);
});

// Each of these was red before 2026-11-05 and must stay red: the change moved
// two states out of `problems`, not the floor underneath them.
for (const [name, body, expect] of [
  ["a line unticked with no marker at all", COMPLETE.replace("- [x] Change is described in one sentence", "- [ ] Change is described in one sentence"), /unticked and not marked/],
  ["`n/a` with no reason", COMPLETE.replace("- [x] Change is described in one sentence", "- [ ] Change is described in one sentence — n/a:"), /n\/a/i],
  ["`pending` with no detail", COMPLETE.replace("- [x] Change is described in one sentence", "- [ ] Change is described in one sentence — pending:"), /say what is outstanding/],
  ["`deferred:` outside the pre-production gate", COMPLETE.replace("- [x] Change is described in one sentence", "- [ ] Change is described in one sentence — deferred: somebody"), /only for the pre-production gate/],
  ["`Result: fail`", COMPLETE.replace("Result: pass", "Result: fail"), /does not merge/],
]) {
  test(`${name} still fails`, () => {
    const { code, text } = check(body);
    assert.equal(code, 1, `must still fail, got:\n${text}`);
    assert.match(text, expect);
  });
}
