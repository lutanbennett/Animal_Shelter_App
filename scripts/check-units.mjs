// Checks src/lib/units.ts — the real exported functions, not a copy — against
// fixed cases, ending with a kibble walk-through: bought in bags, counted in
// bags, fed by the cup, priced per bag.
//
//   node scripts/check-units.mjs
//
// No database, no env. Exits 0 when every case holds.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const lib = await import(pathToFileURL(join(process.cwd(), "src/lib/units.ts")).href);
const { parseConversion, resolveEntered, enteredTotal, defaultUnit, inPurchaseUnit, inUnit, costPerBaseUnit, pricePerPurchaseUnit, groupConversions } = lib;

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

const conv = (id, unit, basePer, isPurchase = false, isCount = false) => ({ id, unit, basePer, isPurchase, isCount, note: null });
// Kibble: base unit cup.
const kg = conv("kg", "kg", 10, false, false);
const bag = conv("bag", "bag (20 kg)", 200, true, true);
const kibble = [kg, bag];

// --- parseConversion
const base = ["cup", "Cup"];
const p = (unit, factor, others = kibble, self = null) => parseConversion({ unit, factor, note: "" }, base, others, self);
eq("a good conversion", p("sack", "100"), { ok: true, unit: "sack", basePer: 100, note: null });
eq("name is trimmed and whitespace collapsed", p("  big   sack ", "100").unit, "big sack");
eq("blank name refused", p("  ", "5").reason, "unitRequired");
eq("zero factor refused", p("sack", "0").reason, "factorInvalid");
eq("negative factor refused", p("sack", "-3").reason, "factorInvalid");
eq("blank factor refused", p("sack", "").reason, "factorInvalid");
eq("text factor refused", p("sack", "ten").reason, "factorInvalid");
eq("named like the base unit (stored spelling)", p("cup", "1").reason, "sameAsBase");
eq("named like the base unit (any case)", p(" CUP ", "1").reason, "sameAsBase");
eq("named like the base unit (translated label)", p("Cup", "1").reason, "sameAsBase");
eq("duplicate of another unit, case-insensitive", p("KG", "10").reason, "duplicate");
eq("editing a unit may keep its own name", p("kg", "11", kibble, "kg").ok, true);

// --- resolveEntered: the factor is stamped from the conversions passed in
eq("2 bags = 400 cups, factor stamped", resolveEntered(2, "bag (20 kg)", kibble, ["cup"]), {
  ok: true,
  base: 400,
  entered: [{ quantity: 2, unit: "bag (20 kg)", factor: 200 }],
});
eq("unit lookup ignores case", resolveEntered(1, "KG", kibble).base, 10);
eq("blank unit = base, entered stays null", resolveEntered(5, "", kibble), { ok: true, base: 5, entered: null });
eq("the base unit's own name = base", resolveEntered(5, "cup", kibble, ["cup"]), { ok: true, base: 5, entered: null });
eq("an unknown unit is refused", resolveEntered(1, "pallet", kibble, ["cup"]), { ok: false, reason: "unknownUnit" });
eq("negative refused", resolveEntered(-1, "kg", kibble).reason, "quantityInvalid");
eq("NaN refused", resolveEntered(NaN, "kg", kibble).reason, "quantityInvalid");
eq("fractions round to the CHECK's 6 places", resolveEntered(1 / 3, "kg", [conv("x", "kg", 3)]).base, 1);
{
  // 0118's CHECK: |sum(quantity x factor) - total| <= 1e-6 * max(1, total)
  const r = resolveEntered(0.3333333, "kg", [conv("x", "kg", 7)]);
  const drift = Math.abs(enteredTotal(r.entered) - r.base);
  eq("stored total and the entered lines agree within the CHECK", drift <= 1e-6 * Math.max(1, r.base), true);
}

// --- defaults and display
eq("purchase default", defaultUnit(kibble, "purchase").unit, "bag (20 kg)");
eq("count default", defaultUnit(kibble, "count").unit, "bag (20 kg)");
eq("no default when none marked", defaultUnit([kg], "count"), null);
eq("480 cups in the purchase unit", inPurchaseUnit(480, kibble), { quantity: 2.4, unit: "bag (20 kg)" });
eq("never counted has no purchase-unit figure", inPurchaseUnit(null, kibble), null);
eq("no purchase unit, no figure", inPurchaseUnit(480, [kg]), null);
eq("inUnit rounds to 2 places", inUnit(100, bag), 0.5);
eq("groupConversions sorts by size per item", Object.keys(groupConversions([
  { id: "1", medication_id: null, diet_type_id: "d", unit: "bag", base_units_per: "200", is_purchase_unit: true, is_count_unit: false, note: null },
  { id: "2", medication_id: null, diet_type_id: "d", unit: "kg", base_units_per: 10, is_purchase_unit: false, is_count_unit: false, note: null },
])), ["d"]);

// --- cost
eq("850 a bag of 200 cups is 4.25 a cup", costPerBaseUnit(850, 200), { ok: true, value: 4.25 });
eq("850 a bag of 180 cups rounds to 4.72 (0.05% off, accepted)", costPerBaseUnit(850, 180), { ok: true, value: 4.72 });
eq("35 a kg per gram would round 0.035 to 0.04: refused", costPerBaseUnit(35, 1000), { ok: false, reason: "tooCoarse" });
eq("a negative price is refused", costPerBaseUnit(-1, 200), { ok: false, reason: "priceInvalid" });
eq("price per purchase unit derived from the cost", pricePerPurchaseUnit(4.25, kibble), { price: 850, unit: "bag (20 kg)" });

// --- the kibble walk-through, end to end
{
  // Last count, in bags: 2.4 bags.
  const prev = resolveEntered(2.4, "bag (20 kg)", kibble);
  // A delivery of 2 bags.
  const delivery = resolveEntered(2, "bag (20 kg)", kibble);
  // This count, 1.5 bags.
  const next = resolveEntered(1.5, "bag (20 kg)", kibble);
  eq("last count 2.4 bags = 480 cups", prev.base, 480);
  eq("delivery 2 bags = 400 cups", delivery.base, 400);
  eq("this count 1.5 bags = 300 cups", next.base, 300);
  // Stock between counts: used = previous + received - new (all base units).
  const used = prev.base + delivery.base - next.base;
  eq("used between the counts: 580 cups, each factor applied once", used, 580);
  // Cashflow multiplies base-unit use by cost per base unit.
  const perCup = costPerBaseUnit(850, 200).value;
  eq("that use costs 2465 baht at 850 a bag", used * perCup, 2465);
  eq("a factor applied twice would be wildly out", used * perCup === 2465 * 200, false);

  // Correcting the bag to 180 cups changes the next save, not the saved rows.
  const corrected = [kg, conv("bag", "bag (20 kg)", 180, true, true)];
  eq("a saved delivery keeps its stamped factor", enteredTotal(delivery.entered), 400);
  eq("a new delivery uses the corrected factor", resolveEntered(2, "bag (20 kg)", corrected).base, 360);
}

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exit(fails ? 1 : 0);
