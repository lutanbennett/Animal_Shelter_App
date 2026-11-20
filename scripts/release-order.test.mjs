import test from "node:test";
import assert from "node:assert/strict";
import { releaseOrderProblems } from "./lib/release-order.mjs";

const M = "0392_per_shelter_restrictive_policies.sql";
const files = { "worker/shelter.mjs": "a", "worker/index.mjs": "b" };
const live = { ok: true, version: "1.0.0" };
const readFrom = (refs) => (ref, path) => refs[ref]?.[path] ?? null;

test("planted bad case: 0392 pending and no Worker proof is refused", () => {
  assert.equal(releaseOrderProblems({ pending: [M], workerSha: null, read: readFrom({}) }).length, 1);
});
test("planted bad case: Worker files differ from main is refused", () => {
  const read = readFrom({ "origin/main": files, w1: { ...files, "worker/shelter.mjs": "OLD" } });
  const p = releaseOrderProblems({ pending: [M], workerSha: "w1", liveVersion: live, read });
  assert.equal(p.length, 1);
  assert.match(p[0], /differs from origin\/main/);
});
test("an unknown commit is refused", () => {
  assert.equal(releaseOrderProblems({ pending: [M], workerSha: "nope", liveVersion: live, read: readFrom({ "origin/main": files }) }).length, 2);
});
test("identical Worker files pass", () => {
  assert.deepEqual(releaseOrderProblems({ pending: [M], workerSha: "w1", liveVersion: live, read: readFrom({ "origin/main": files, w1: files }) }), []);
});
test("nothing guarded pending: passes without proof", () => {
  assert.deepEqual(releaseOrderProblems({ pending: ["0399_x.sql"], workerSha: null, read: readFrom({}) }), []);
});

const rel = (v) => ({ "src/lib/releases.ts": `x
  version: "${v}",` });
test("live version agrees with the named commit: passes", () => {
  const read = readFrom({ "origin/main": files, w1: { ...files, ...rel("1.0.0") } });
  assert.deepEqual(releaseOrderProblems({ pending: [M], workerSha: "w1", liveVersion: live, read }), []);
});
test("live version disagrees with the named commit: refused", () => {
  const read = readFrom({ "origin/main": files, w1: { ...files, ...rel("0.9.0") } });
  const p = releaseOrderProblems({ pending: [M], workerSha: "w1", liveVersion: live, read });
  assert.equal(p.length, 1);
  assert.match(p[0], /reports release 1.0.0/);
});
test("endpoint unreachable: refused, and says unreachable", () => {
  const read = readFrom({ "origin/main": files, w1: files });
  const p = releaseOrderProblems({ pending: [M], workerSha: "w1", liveVersion: { ok: false, reason: "timeout" }, read });
  assert.equal(p.length, 1);
  assert.match(p[0], /could not ask the live Worker/);
});

// #rlord: the opposite direction, a migration that must precede the Worker.
const P = "0426_shelter_public_site.sql";
const calls = { "worker/shelter.mjs": "await fetch(`${u}/rpc/resolve_shelter_site`)" };
test("planted bad case: 0426 pending and the named Worker already calls resolve_shelter_site is refused", () => {
  const p = releaseOrderProblems({ pending: [P], workerSha: "w2", liveVersion: live, read: readFrom({ w2: calls }) });
  assert.equal(p.length, 1);
  assert.match(p[0], /still pending.*resolve_shelter_site/);
});
test("0426 pending but the named Worker is older (does not call it): passes", () => {
  assert.deepEqual(releaseOrderProblems({ pending: [P], workerSha: "w0", liveVersion: live, read: readFrom({ w0: { "worker/shelter.mjs": "resolve_shelter_host" } }) }), []);
});
test("0426 pending and no Worker named: passes (ordinary order applies before the deploy)", () => {
  assert.deepEqual(releaseOrderProblems({ pending: [P], workerSha: null, read: readFrom({}) }), []);
});
test("0426 already applied: passes whatever the Worker calls", () => {
  assert.deepEqual(releaseOrderProblems({ pending: [], workerSha: "w2", liveVersion: live, read: readFrom({ w2: calls }) }), []);
});
test("the summary names both directions", async () => {
  const { releaseOrderSummary } = await import("./lib/release-order.mjs");
  const s = releaseOrderSummary({ pending: [P], workerSha: null }).join("\n");
  assert.match(s, /must-follow-Worker: none pending/);
  assert.match(s, /must-precede-Worker: 1 pending/);
});
