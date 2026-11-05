// A freshly copied test-plan template must fail check-test-plan.mjs only on
// fields a stream has to fill, never on the template's own guidance prose
// (#0f0ey; #1285 hit this on three pushes in a row).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function checkFreshCopy(mutate = (t) => t) {
  const dir = mkdtempSync(path.join(tmpdir(), "tpl-"));
  try {
    const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...a], { cwd: dir, stdio: "pipe" });
    git("init", "-q");
    writeFileSync(path.join(dir, "x.txt"), "x");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    mkdirSync(path.join(dir, "docs", "test-plans"), { recursive: true });
    copyFileSync(path.join(repo, "docs", "test-plan-template.md"), path.join(dir, "docs", "test-plans", "fresh.md"));
    const file = path.join(dir, "docs", "test-plans", "fresh.md");
    writeFileSync(file, mutate(readFileSync(file, "utf8")));
    git("add", "-A");
    const r = spawnSync(process.execPath, [path.join(repo, "scripts", "check-test-plan.mjs"), "--base", "HEAD"], { cwd: dir, encoding: "utf8" });
    const text = (r.stdout ?? "") + (r.stderr ?? "");
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    const hits = [...text.matchAll(/fresh\.md:(\d+) — unfilled template placeholder `<([^`]+)>`/g)].map((m) => ({ line: Number(m[1]), token: m[2], src: lines[Number(m[1]) - 1] }));
    return { text, hits, lines };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a fresh copy reports placeholders only on fields, none in the guidance prose", () => {
  const { hits, lines } = checkFreshCopy();
  assert.ok(hits.length > 0, "the fields are still unfilled, so they must still be reported");
  let guidance = false;
  const inGuidance = lines.map((l) => {
    if (/guidance:start/.test(l)) guidance = true;
    else if (/guidance:end/.test(l)) guidance = false;
    return guidance;
  });
  for (const h of hits) assert.ok(!inGuidance[h.line - 1], `line ${h.line} is guidance prose: ${h.src}`);
  const tokens = new Set(hits.map((h) => h.token));
  for (const t of ["feature", "name"]) assert.ok(tokens.has(t), `field placeholder <${t}> must still be reported`);
});

test("the error names the real cause", () => {
  const { text } = checkFreshCopy();
  assert.match(text, /if it is the template's own guidance prose \(not a field\), delete the line/);
});

test("unfilled fields are still caught when the guidance fences are removed from the same copy", () => {
  const { hits } = checkFreshCopy((t) => t.replace(/<!-- guidance:(start|end) -->\r?\n/g, ""));
  assert.ok(hits.some((h) => h.src.includes("docs/test-plans/<feature>.md")), "without a fence, guidance prose is read as before");
});
