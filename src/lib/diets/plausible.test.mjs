import test from "node:test";
import assert from "node:assert/strict";
import { implausibleDiet } from "./plausible.ts";

const type = { daily_qty_small: 2, daily_qty_medium: 3, daily_qty_large: 4 };

test("the dry-run typo (22 meals, 22 cans) is caught", () => {
  assert.ok(implausibleDiet({ mealsPerDay: 22, dailyQuantity: 22, type }));
});
test("an ordinary diet passes", () => {
  assert.equal(implausibleDiet({ mealsPerDay: 2, dailyQuantity: 3, type }), null);
  assert.equal(implausibleDiet({ mealsPerDay: 3, dailyQuantity: null, type }), null);
});
test("a genuinely large eater (double the large default) passes", () => {
  assert.equal(implausibleDiet({ mealsPerDay: 4, dailyQuantity: 8, type }), null);
});
test("many meals alone, or a huge quantity alone, is caught", () => {
  assert.ok(implausibleDiet({ mealsPerDay: 12, dailyQuantity: 3, type }));
  assert.ok(implausibleDiet({ mealsPerDay: 2, dailyQuantity: 30, type }));
});
