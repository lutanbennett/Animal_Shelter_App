import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LOCK_FILE, takeTreeLock, takeTreeLockWaiting, treeProblems } from "./lib/tree-lock.mjs";

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

test("a child of the live holder runs under its lock instead of refusing it", () => {
  const root = tmp();
  writeFileSync(join(root, LOCK_FILE), JSON.stringify({ kind: "build", pid: process.ppid, since: "x" }));
  const before = process.env.TREE_LOCK_PID;
  process.env.TREE_LOCK_PID = String(process.ppid);
  try {
    takeTreeLock("build", root)();
    assert.equal(existsSync(join(root, LOCK_FILE)), true, "the parent's lock is left alone");
  } finally {
    if (before === undefined) delete process.env.TREE_LOCK_PID;
    else process.env.TREE_LOCK_PID = before;
  }
});

test("waiting still refuses a live holder at the timeout, and names how to end it", () => {
  const root = tmp();
  const release = takeTreeLock("build", root);
  assert.throws(() => takeTreeLockWaiting("build", 0, root, () => {}), /refusing to start a build.*end it yourself/s);
  release();
});

test("waiting takes a stale lock over at once", () => {
  const root = tmp();
  writeFileSync(join(root, LOCK_FILE), JSON.stringify({ kind: "build", pid: 2 ** 22 + 12345, since: "x" }));
  takeTreeLockWaiting("build", 0, root, () => {})();
});

import { spawn } from "node:child_process";
import { recordTreeLockChild } from "./lib/tree-lock.mjs";

test("owner dead and child dead: taken over", () => {
  const root = tmp();
  writeFileSync(join(root, LOCK_FILE), JSON.stringify({ kind: "build", pid: 2 ** 22 + 12345, child: 2 ** 22 + 54321, since: "x" }));
  takeTreeLock("install", root)();
});

test("owner dead but child ALIVE: not taken over, and the refusal names the child", () => {
  const root = tmp();
  const orphan = spawn(process.execPath, ["-e", "setTimeout(()=>{},30000)"], { stdio: "ignore" });
  try {
    writeFileSync(join(root, LOCK_FILE), JSON.stringify({ kind: "build", pid: 2 ** 22 + 12345, child: orphan.pid, since: "x" }));
    assert.throws(() => takeTreeLock("install", root), (e) => new RegExp(`child, pid ${orphan.pid}`).test(e.message) && e.message.includes(String(orphan.pid)) && !e.message.includes(String(2 ** 22 + 12345) + " /T"));
    assert.equal(existsSync(join(root, LOCK_FILE)), true, "the lock is left in place");
  } finally {
    orphan.kill();
  }
});

test("recordTreeLockChild writes only into a lock this process owns", () => {
  const root = tmp();
  const release = takeTreeLock("build", root);
  recordTreeLockChild(4242, root);
  assert.equal(JSON.parse(readFileSync(join(root, LOCK_FILE), "utf8")).child, 4242);
  recordTreeLockChild(null, root);
  assert.equal(JSON.parse(readFileSync(join(root, LOCK_FILE), "utf8")).child, undefined);
  release();
  recordTreeLockChild(1, root); // no lock: no throw
});
