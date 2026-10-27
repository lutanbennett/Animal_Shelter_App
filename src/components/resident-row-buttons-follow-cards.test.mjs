// Guard, second slice of "a button is shown only if the login's cards let it do that action" (CLAUDE.md).
// Narrow on purpose, like the photo-gallery guard: it reads the source and asserts each gate is PRESENT and
// fails loudly when a pattern is missing. It cannot detect a NEW ungated control (no render harness here).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("blood test and procedure file controls need the card their actions ask", () => {
  for (const [list, section, api, activity] of [
    ["./BloodTestList.tsx", "../app/residents/[id]/[section]/sections/blood-tests.tsx", "../app/api/blood-tests/[id]/attachments/route.ts", "medical.blood_tests"],
    ["./ProcedureList.tsx", "../app/residents/[id]/[section]/sections/procedures.tsx", "../app/api/procedures/[id]/attachments/route.ts", "medical.procedures"],
  ]) {
    const src = read(list);
    assert.match(src, /canManage = false,/, `${list}: canManage must default to false`);
    assert.equal(src.match(/!readOnly && canManage/g)?.length, 2, `${list}: remove and attach must both sit behind canManage`);
    assert.ok(read(section).includes(`canManage={can(perms, "${activity}")}`), `${section} must pass ${activity}`);
    assert.ok(read(api).includes(`can(perms, "${activity}")`), `${api} must ask ${activity}`);
  }
});

test("the edit form links to the return pages only for logins that may use them", () => {
  const form = read("../app/residents/[id]/edit/EditResidentForm.tsx");
  assert.match(form, /canReturnFromHospital = false,/);
  assert.match(form, /canReturnFromCarer = false,/);
  assert.match(form, /\{canReturnFromHospital && \(/);
  assert.match(form, /\{canReturnFromCarer && \(/);
  const page = read("../app/residents/[id]/edit/page.tsx");
  assert.match(page, /canReturnFromHospital=\{can\(perms, "placement\.hospital"\)\}/);
  assert.match(page, /canReturnFromCarer=\{can\(perms, "placement\.rehome"\)\}/);
  assert.match(read("../app/residents/[id]/hospital/return/page.tsx"), /can\(perms, "placement\.hospital"\)/);
  assert.match(read("../app/residents/[id]/rehome/return/page.tsx"), /can\(perms, "placement\.rehome"\)/);
});
