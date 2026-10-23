import test from "node:test";
import assert from "node:assert/strict";
import { blocksFor, feedDogs, groupByPlace } from "./feeding-build.ts";
import { DEFAULT_SERVINGS, formatAmount } from "./servings.ts";

// The item's acceptance case: Standard = kibble 0.5 cup, egg 1, rice 0.5 cup, chicken 50 g per serving.
const line = (id, name, unit, qtyPerServing) => ({ ingredientId: id, name, unit, qtyPerServing });
const standard = {
  id: "std", name: "Standard", isStandard: true, servings: DEFAULT_SERVINGS,
  lines: [line("k", "Kibble", "cup", 0.5), line("e", "Egg", "egg", 1), line("r", "Rice", "cup", 0.5), line("c", "Chicken", "g", 50)],
};
const special = { id: "sp", name: "Kidney diet", isStandard: false, servings: DEFAULT_SERVINGS, lines: [line("k", "Kibble", "cup", 1)] };
const diets = new Map([[standard.id, standard], [special.id, special]]);
const place = (zone, enclosure) => ({ zone: { name: zone, nameTh: null, colour: null }, enclosure: { id: enclosure, name: enclosure, nameTh: null } });
const dog = (id, size, extra = {}) => ({
  id, name: id, thaiName: null, photoFileId: null, size, status: "Resident", place: place("Left Zone", "Pen 1"),
  dietId: "std", mealsPerDay: 2, portionFactor: null, rounds: ["morning", "evening"], notes: null, ...extra,
});
const order = { compareZones: (a, b) => String(a).localeCompare(String(b)), compareEnclosures: (a, b) => String(a.name).localeCompare(String(b.name)) };
const totals = (blocks) => Object.fromEntries(blocks[0].lines.map((l) => [l.name, l.total]));

test("Small + Medium + Large on Standard = 4.5 servings a day, 2.25 a meal", () => {
  const fed = feedDogs([dog("s", "Small"), dog("m", "Medium"), dog("l", "Large")], diets, "morning");
  assert.deepEqual(totals(blocksFor(fed)), { Chicken: 112.5, Egg: 2.25, Kibble: 1.125, Rice: 1.125 });
});
test("a portion factor of 0.75 counts three-quarters", () => {
  const fed = feedDogs([dog("l", "Large", { portionFactor: 0.75 })], diets, "morning");
  assert.equal(totals(blocksFor(fed)).Egg, 0.75 * 2 / 2);
});
test("sums are exact; only display rounds", () => {
  const fed = feedDogs([dog("a", "Medium"), dog("b", "Medium"), dog("c", "Medium")], diets, "evening");
  const egg = totals(blocksFor(fed)).Egg; // 3 x (1 x 1.5 / 2) = 2.25
  assert.equal(egg, 2.25);
  assert.equal(formatAmount(egg), "2.25");
});
test("a special diet gets its own block, Standard first, and counts its own dogs", () => {
  const fed = feedDogs([dog("a", "Small"), dog("k", "Small", { dietId: "sp" })], diets, "morning");
  const blocks = blocksFor(fed);
  assert.deepEqual(blocks.map((b) => [b.diet.name, b.dogCount]), [["Standard", 1], ["Kidney diet", 1]]);
  assert.equal(blocks[1].lines[0].total, 0.5); // 1 cup x 1 serving / 2 meals, not merged with the Standard kibble
});
test("a diet fed only in the evening is not in the morning batch; one with no round is in both, flagged", () => {
  const dogs = [dog("e", "Small", { rounds: ["evening"] }), dog("n", "Small", { rounds: [] })];
  const morning = feedDogs(dogs, diets, "morning");
  assert.deepEqual(morning.map((d) => [d.id, d.noRound]), [["n", true]]);
  assert.equal(feedDogs(dogs, diets, "evening").length, 2);
});
test("moving a dog to another zone moves its share; dogs with no place are kept apart", () => {
  const fed = feedDogs([dog("a", "Medium"), dog("b", "Medium", { place: place("Right Zone", "Pen 9") }), dog("h", "Medium", { place: null })], diets, "morning");
  const g = groupByPlace(fed, order);
  assert.deepEqual(g.zones.map((z) => [z.zone.name, z.dogs.length]), [["Left Zone", 1], ["Right Zone", 1]]);
  assert.equal(g.apart.dogs.length, 1);
});
