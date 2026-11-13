// The income side's folding (cashflow-income.ts) and its gate. Narrow on purpose: no render harness.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { incomeHistory, incomeWindow, INCOME_MONTHS } from "./cashflow-income.ts";

const gift = (received_on, ...amounts) => ({ received_on, donation_lines: amounts.map((amount) => ({ amount })) });

test("the window is the six complete months before the current one", () => {
  assert.deepEqual(incomeWindow("2026-11-13"), { from: "2026-05-01", to: "2026-11-01" });
  assert.equal(INCOME_MONTHS, 6);
});

test("a gift with several lines counts once, by its date; in-kind is counted not summed", () => {
  const h = incomeHistory(
    [gift("2026-10-02", 100.1, 200.2), gift("2026-10-20", 50), gift("2026-10-21", null), gift("2026-11-02", 999)],
    "2026-11-13",
  );
  const oct = h.months.find((m) => m.month === "2026-10-01");
  assert.equal(oct.amount, 350.3);
  assert.equal(oct.inKind, 1);
  assert.equal(h.months.length, 6);
  // November is the current month: outside the window, never counted.
  assert.equal(h.months.some((m) => m.month === "2026-11-01"), false);
  assert.equal(h.average, 350.3 / 6);
});

test("the page reads gifts only behind donation.receipt and the income prop defaults to nothing", () => {
  const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const page = read("../../app/management/cashflow/page.tsx");
  const view = read("../../app/management/cashflow/CashflowView.tsx");
  assert.match(page, /const canSeeIncome = can\(perms, "donation\.receipt"\);\n  let income = null;/);
  assert.match(page, /if \(canSeeIncome\) \{[\s\S]*?from\("donations"\)/);
  assert.match(view, /income = null,/);
});
