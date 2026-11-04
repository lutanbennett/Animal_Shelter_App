import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LOCK_FILE, takeTreeLock, treeProblems } from "./lib/tree-lock.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "treelock-"));

test("a live holder makes the second taker refuse, naming what and what to do", () => {
  const root = tmp();
  const release = takeTreeLock("build", root);
  assert.throws(() => takeTreeLock("install", root), /refusing to start a install.*`build`.*Wait for that build/s);
  release();
  assert.equal(existsSync(join(root, LOCK_FILE)), false);
  takeTreeLock("install", root)();
});

test("a lock whose process is gone is taken over, not obeyed", () => {
  const root = tmp();
  writeFileSync(join(root, LOCK_FILE), JSON.stringify({ kind: "build", pid: 2 ** 22 + 12345, since: "x" }));
  takeTreeLock("install", root)();
});

test("an unreadable lock fails closed", () => {
  const root = tmp();
  writeFileSync(join(root, LOCK_FILE), "not json");
  assert.throws(() => takeTreeLock("build", root), /cannot be read/);
});

test("a gutted tree is named; a whole one passes", () => {
  const root = tmp();
  assert.match(treeProblems(root), /damaged.*next.*esbuild/s);
  for (const p of ["next", "esbuild", "react", "wrangler", "@opennextjs/aws", "@opennextjs/cloudflare"]) {
    mkdirSync(join(root, "node_modules", p), { recursive: true });
    writeFileSync(join(root, "node_modules", p, "package.json"), "{}");
  }
  assert.equal(treeProblems(root), null);
  rmSync(root, { recursive: true, force: true });
});
