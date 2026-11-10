import { test } from "node:test";
import assert from "node:assert/strict";
import { flatten, diffDictionaries, renderMarkdown } from "./list-thai-added.mjs";

const d = (en, th) => ({ en: flatten(en), th: flatten(th) });

test("flatten reaches nested keys, arrays and templated entries", () => {
  const f = flatten({ a: { b: "x", c: (n) => `n ${n}`, l: ["p", "q"] } });
  assert.equal(f["a.b"], "x");
  assert.match(f["a.c"], /^n /);
  assert.equal(f["a.l[1]"], "q");
});

test("the three kinds are told apart", () => {
  const before = d(
    { s: { keep: "Keep", reEn: "Old", reTh: "Same" } },
    { s: { keep: "เก็บ", reEn: "เก่า", reTh: "เดิม" } },
  );
  const after = d(
    { s: { keep: "Keep", reEn: "New wording", reTh: "Same", added: "Added" } },
    { s: { keep: "เก็บ", reEn: "เก่า", reTh: "แก้แล้ว", added: "เพิ่ม" } },
  );
  const got = Object.fromEntries(diffDictionaries(before, after).map((e) => [e.path, e.kind]));
  assert.deepEqual(got, { "s.reEn": "disagree", "s.added": "new", "s.reTh": "reworded" });
});

test("disagreements are listed first and unchanged entries are not listed", () => {
  const before = d({ a: { x: "X", y: "Y" } }, { a: { x: "เอ็กซ์", y: "วาย" } });
  const after = d({ a: { x: "X", y: "Y2", z: "Z" } }, { a: { x: "เอ็กซ์", y: "วาย", z: "แซด" } });
  assert.deepEqual(diffDictionaries(before, after).map((e) => e.kind), ["disagree", "new"]);
});

test("an empty base makes everything new; a dash needs no reading", () => {
  const after = d({ a: { x: "X", dash: "—" } }, { a: { x: "เอ็กซ์", dash: "—" } });
  assert.deepEqual(diffDictionaries(d({}, {}), after).map((e) => e.path), ["a.x"]);
});

test("a missing Thai is not this script's to report", () => {
  assert.equal(diffDictionaries(d({}, {}), { en: flatten({ a: "A" }), th: {} }).length, 0);
});

test("markdown shows both languages with placeholders as {a}; an empty list says so", () => {
  const e = diffDictionaries(d({}, {}), d({ s: { t: (n) => `Hi ${n}` } }, { s: { t: (n) => `สวัสดี ${n}` } }));
  const md = renderMarkdown(e, "2026-11-01");
  assert.match(md, /Hi \{a\}/);
  assert.match(md, /สวัสดี \{a\}/);
  assert.match(md, /1 strings in 1 areas/);
  assert.match(renderMarkdown([], "x"), /Nothing to read/);
});
