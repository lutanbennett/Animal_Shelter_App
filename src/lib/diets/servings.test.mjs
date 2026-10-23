import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SERVINGS, dayAmount, perMealAmount, servingsFor, formatAmount } from "./servings.ts";

// Lutan's Standard diet, 2026-10-22: 1 serving = kibble 0.5 cup, egg 1, rice 0.5 cup, chicken 50 g.
const standard = { kibble: 0.5, egg: 1, rice: 0.5, chicken: 50 };

test("a Medium dog gets 0.75 cup kibble, 1.5 eggs, 0.75 cup rice, 75 g chicken a day", () => {
  const day = Object.values(standard).map((q) => dayAmount(q, DEFAULT_SERVINGS, "Medium"));
  assert.deepEqual(day, [0.75, 1.5, 0.75, 75]);
});
test("on 2 meals a Medium dog gets 0.375 / 0.75 / 0.375 / 37.5 per meal", () => {
  const meal = Object.values(standard).map((q) => perMealAmount(dayAmount(q, DEFAULT_SERVINGS, "Medium"), 2));
  assert.deepEqual(meal, [0.375, 0.75, 0.375, 37.5]);
  assert.equal(formatAmount(0.375), "0.375");
});
test("a Large dog gets kibble 1 cup, 2 eggs, rice 1 cup, chicken 100 g", () => {
  assert.deepEqual(Object.values(standard).map((q) => dayAmount(q, DEFAULT_SERVINGS, "Large")), [1, 2, 1, 100]);
});
test("changing Large to 2.5 moves only Large", () => {
  const s = { ...DEFAULT_SERVINGS, large: 2.5 };
  assert.equal(dayAmount(1, s, "Large"), 2.5);
  assert.equal(dayAmount(1, s, "Medium"), 1.5);
  assert.equal(dayAmount(1, s, "Small"), 1);
});
test("portion factor applies on top, and an unset size reads as Medium", () => {
  assert.equal(dayAmount(50, DEFAULT_SERVINGS, "Medium", 0.75), 56.25);
  assert.equal(servingsFor(DEFAULT_SERVINGS, null), 1.5);
});
test("nothing is rounded before a total", () => {
  const three = [0, 1, 2].map(() => dayAmount(1, { small: 1, medium: 1 / 3, large: 2 }, "Medium"));
  assert.ok(Math.abs(three.reduce((a, b) => a + b, 0) - 1) < 1e-12);
});
test("no meals on record is one round", () => assert.equal(perMealAmount(3, null), 3));
