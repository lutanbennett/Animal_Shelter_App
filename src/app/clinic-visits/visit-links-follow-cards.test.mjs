// Guard, third slice of "a button is shown only if the login's cards let it do that action" (CLAUDE.md).
// Narrow on purpose, like the first two: it asserts each gate is PRESENT and each page the link opens asks the
// same activity. It cannot detect a NEW ungated control (no render harness in the repo).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("the visit page's log links need the card the page they open asks", () => {
  const page = read("./[id]/page.tsx");
  for (const [flag, activity, target] of [
    ["canBlood", "medical.blood_tests", "../blood-tests/new/page.tsx"],
    ["canRx", "medical.prescriptions", "../prescriptions/new/page.tsx"],
    ["canWeight", "medical.weight", "../weight/new/page.tsx"],
    ["canProc", "medical.procedures", "../procedures/new/page.tsx"],
  ]) {
    assert.ok(page.includes(`const ${flag} = can(perms, "${activity}");`), `${flag} must ask ${activity}`);
    assert.match(page, new RegExp(`\{(started && )?${flag} && `), `${flag} must gate its link`);
    assert.ok(read(target).includes(`requirePermission("${activity}")`), `${target} must ask ${activity}`);
  }
});
