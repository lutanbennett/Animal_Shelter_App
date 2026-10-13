import test from "node:test";
import assert from "node:assert/strict";
import { dmyToIso, isoToDmy, autoSlash, normalizeTime } from "./date-input.ts";

test("day first: 13/10/2026 is 13 October, never month 13", () => {
  assert.equal(dmyToIso("13/10/2026"), "2026-10-13");
  assert.equal(dmyToIso("10/11/2026"), "2026-11-10"); // ambiguous: day 10, month 11
  assert.equal(dmyToIso("1/2/2026"), "2026-02-01");
  assert.equal(dmyToIso("13.10.2026"), "2026-10-13");
});
test("impossible days are refused, not rolled over", () => {
  for (const s of ["10/13/2026", "31/04/2026", "29/02/2027", "00/01/2026", "1/1/26", "", "abc"]) assert.equal(dmyToIso(s), "", s);
  assert.equal(dmyToIso("29/02/2028"), "2028-02-29");
});
test("round trip", () => {
  for (const iso of ["2026-10-13", "2026-01-31", "2028-02-29"]) assert.equal(dmyToIso(isoToDmy(iso)), iso);
  assert.equal(isoToDmy(""), "");
});
test("auto slash", () => {
  assert.equal(autoSlash("13"), "13");
  assert.equal(autoSlash("131"), "13/1");
  assert.equal(autoSlash("1310"), "13/10");
  assert.equal(autoSlash("13102026"), "13/10/2026");
  assert.equal(autoSlash("13/10/2026"), "13/10/2026");
});
test("time", () => {
  assert.equal(normalizeTime("14:05"), "14:05");
  assert.equal(normalizeTime("905"), "09:05");
  assert.equal(normalizeTime("24:00"), "");
});
