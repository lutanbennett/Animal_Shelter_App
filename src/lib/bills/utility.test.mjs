// A utility bill covers a month, and the database keeps the FIRST of it (0305 utility_bills.covers_month check).
import test from "node:test";
import assert from "node:assert/strict";
import { coversMonthDate, monthInputValue } from "./utility.ts";

test("a month input value becomes the first of that month", () => {
  assert.equal(coversMonthDate("2026-10"), "2026-10-01");
  assert.equal(coversMonthDate("2026-02"), "2026-02-01");
});
test("any day in the month becomes the first", () => {
  assert.equal(coversMonthDate("2026-10-17"), "2026-10-01");
});
test("anything else is refused", () => {
  for (const v of ["", null, undefined, "2026-13", "2026-00", "10-2026", "2026-1", "2026-10-1", "2026-10-171"]) assert.equal(coversMonthDate(v), null, String(v));
});
test("a stored month reads back as a month input value", () => {
  assert.equal(monthInputValue("2026-10-01"), "2026-10");
  assert.equal(monthInputValue(null), "");
});
