import test from "node:test";
import assert from "node:assert/strict";
import { implausibleDiet } from "./plausible.ts";

test("the dry-run typo (22 meals, 22 times the recipe) is caught", () => {
  assert.ok(implausibleDiet({ mealsPerDay: 22, portionFactor: 22 }));
});
test("an ordinary diet passes", () => {
  assert.equal(implausibleDiet({ mealsPerDay: 2, portionFactor: 0.75 }), null);
  assert.equal(implausibleDiet({ mealsPerDay: 3, portionFactor: null }), null);
});
test("a genuinely big eater (double the recipe) passes", () => {
  assert.equal(implausibleDiet({ mealsPerDay: 4, portionFactor: 2 }), null);
});
test("many meals alone, or a huge portion alone, is caught", () => {
  assert.ok(implausibleDiet({ mealsPerDay: 12, portionFactor: 1 }));
  assert.ok(implausibleDiet({ mealsPerDay: 2, portionFactor: 30 }));
});

import { implausibleServings } from "./plausible.ts";
test("servings: the defaults and a generous Large pass, a slipped finger is caught", () => {
  assert.equal(implausibleServings({ small: 1, medium: 1.5, large: 2 }), false);
  assert.equal(implausibleServings({ small: 1, medium: 1.5, large: 2.5 }), false);
  assert.equal(implausibleServings({ small: 1, medium: 1.5, large: 20 }), true);
});
