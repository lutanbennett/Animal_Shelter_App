import test from "node:test";
import assert from "node:assert/strict";
import { releaseOrderProblems } from "./lib/release-order.mjs";

const M = "0392_per_shelter_restrictive_policies.sql";
const files = { "worker/shelter.mjs": "a", "worker/index.mjs": "b" };
const readFrom = (refs) => (ref, path) => refs[ref]?.[path] ?? null;

test("planted bad case: 0392 pending and no Worker proof is refused", () => {
  assert.equal(releaseOrderProblems({ pending: [M], workerSha: null, read: readFrom({}) }).length, 1);
});
test("planted bad case: Worker files differ from main is refused", () => {
  const read = readFrom({ "origin/main": files, w1: { ...files, "worker/shelter.mjs": "OLD" } });
  const p = releaseOrderProblems({ pending: [M], workerSha: "w1", read });
  assert.equal(p.length, 1);
  assert.match(p[0], /differs from origin\/main/);
});
test("an unknown commit is refused", () => {
  assert.equal(releaseOrderProblems({ pending: [M], workerSha: "nope", read: readFrom({ "origin/main": files }) }).length, 2);
});
test("identical Worker files pass", () => {
  assert.deepEqual(releaseOrderProblems({ pending: [M], workerSha: "w1", read: readFrom({ "origin/main": files, w1: files }) }), []);
});
test("nothing guarded pending: passes without proof", () => {
  assert.deepEqual(releaseOrderProblems({ pending: ["0399_x.sql"], workerSha: null, read: readFrom({}) }), []);
});
