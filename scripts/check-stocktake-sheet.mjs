// Checks the stocktake sheet's row rules in src/lib/management/stocktake.ts —
// the real exported functions, not a copy. Above all: a blank row is left
// out of what the sheet sends (left alone), never sent as "clear it", and
// "same as last time" sends the old figure.
//
//   node scripts/check-stocktake-sheet.mjs
//
// No database, no env. Exits 0 when every case holds.
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The lib imports "@/lib/units"; map "@/" onto src/ the way tsconfig does.
const src = pathToFileURL(join(process.cwd(), "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        return next(spec, ctx);
      }`),
);

const { rowOutcome, isBigChange, summarise, sizeRows } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/management/stocktake.ts")).href
);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

const item = (id, lastCount) => ({ id, name: id, unit: "tablet", lastCount, lastCountedAt: lastCount == null ? null : "2026-09-20T03:00:00Z" });
const counted = item("counted", 40);
const never = item("never", null);

// Blank vs unchanged
eq("no entry is untouched", rowOutcome(counted, undefined), { kind: "untouched" });
eq("blank is untouched, not a clear", rowOutcome(counted, { value: "", same: false }), { kind: "untouched" });
eq("whitespace is untouched", rowOutcome(counted, { value: "   ", same: false }), { kind: "untouched" });
eq("same sends the old figure", rowOutcome(counted, { value: "", same: true }), { kind: "confirmed", count: 40 });
eq("same on a never-counted item has nothing to confirm", rowOutcome(never, { value: "", same: true }), { kind: "untouched" });
eq("typing the same figure is a count", rowOutcome(counted, { value: "40", same: false }), { kind: "counted", count: 40 });
eq("zero is a count", rowOutcome(counted, { value: "0", same: false }), { kind: "counted", count: 0 });
eq("decimal", rowOutcome(never, { value: " 12.5 ", same: false }), { kind: "counted", count: 12.5 });
eq("negative is invalid", rowOutcome(counted, { value: "-1", same: false }), { kind: "invalid" });
eq("text is invalid", rowOutcome(counted, { value: "ten", same: false }), { kind: "invalid" });
eq("comma is invalid, not guessed", rowOutcome(counted, { value: "1,000", same: false }), { kind: "invalid" });

// Big differences
eq("first count is not big", isBigChange(null, 5), false);
eq("unchanged is not big", isBigChange(40, 40), false);
eq("49% down is not big", isBigChange(100, 51), false);
eq("50% down is big", isBigChange(100, 50), true);
eq("50% up is big", isBigChange(100, 150), true);
eq("to zero is big", isBigChange(10, 0), true);
eq("from zero is big", isBigChange(0, 3), true);

// The whole sheet: what is sent, what is left alone
const items = {
  medication: [counted, never, item("blank", 7), item("big", 100)],
  diet: [item("food", 2000), item("food-blank", 500)],
};
const entries = {
  medication: {
    counted: { value: "", same: true },
    never: { value: "3", same: false },
    blank: { value: "", same: false },
    big: { value: "20", same: false },
  },
  diet: { food: { value: "1800", same: false } },
};
const summary = summarise(items, entries);
eq("medication list: blank row absent, same row sends old figure", summary.medication, [
  { id: "counted", count: 40 },
  { id: "never", count: 3 },
  { id: "big", count: 20 },
]);
eq("diet list: only the counted row", summary.diet, [{ id: "food", count: 1800 }]);
eq("untouched = the blank rows", summary.untouched, 2);
eq("big flagged", summary.lines.filter((l) => l.big).map((l) => l.item.id), ["big"]);
eq("confirmed kept apart", summary.lines.filter((l) => l.outcome.kind === "confirmed").map((l) => l.item.id), ["counted"]);

const bad = summarise(items, { medication: { blank: { value: "x", same: false } }, diet: {} });
eq("invalid row is reported and not sent", [bad.invalid.map((r) => r.item.id), bad.medication], [["blank"], []]);

// Counting in sizes (Pack sizes, part b): kibble, base unit kg, in four bag sizes.
const conv = (unit, basePer, o = {}) => ({ id: unit, unit, unitTh: null, basePer, isPurchase: true, isCount: false, note: null, ...o });
const kibble = {
  id: "kibble",
  name: "kibble",
  unit: "kg",
  baseUnit: "kg",
  lastCount: 100,
  lastCountedAt: "2026-09-20T03:00:00Z",
  conversions: [conv("bag (5 kg)", 5), conv("bag (10 kg)", 10), conv("bag (14 kg)", 14), conv("bag (20 kg)", 20, { isCount: true, isDefaultPurchase: true })],
};
eq("rows: counted-in size first, loose last", sizeRows(kibble).map((r) => r.key), ["bag (20 kg)", "bag (14 kg)", "bag (10 kg)", "bag (5 kg)", ""]);
const sized = (sizes, open) => rowOutcome(kibble, { value: "", same: false, sizes, open });
eq("10x20 + 4x10 + 3x14 + 1x5 = 287 kg", sized({ "bag (20 kg)": 10, "bag (10 kg)": 4, "bag (14 kg)": 3, "bag (5 kg)": 1 }).count, 287);
eq("each row against its own size", sized({ "bag (14 kg)": 2, "": 3 }).count, 31);
eq("an open half bag adds half a bag, not a whole one", sized({ "bag (20 kg)": 2 }, [{ unit: "bag (20 kg)", level: "half" }]).count, 50);
eq("about full is below a whole bag", sized({}, [{ unit: "bag (20 kg)", level: "full" }]).count < 20, true);
eq("a chosen 0 is a count of none", sized({ "bag (20 kg)": 0 }), { kind: "counted", count: 0, lines: [] });
eq("nothing touched is left alone", rowOutcome(kibble, { value: "", same: false }), { kind: "untouched" });
eq("a decimal in a size row is refused", sized({ "bag (20 kg)": 1.5 }), { kind: "invalid" });
eq("a size the item does not have is refused", sized({ "pallet": 1 }), { kind: "invalid" });
const sum = summarise({ medication: [], diet: [kibble] }, { medication: {}, diet: { kibble: { value: "", same: false, sizes: { "bag (20 kg)": 2 }, open: [{ unit: "bag (14 kg)", level: "quarter" }] } } });
eq("save carries the lines", sum.diet, [{ id: "kibble", count: 43.5, lines: [{ quantity: 2, unit: "bag (20 kg)" }, { quantity: 0.25, unit: "bag (14 kg)" }] }]);
const again = { ...kibble, lastEntered: [{ quantity: 5, unit: "bag (20 kg)", factor: 20 }] };
eq("same as last time repeats the sizes", rowOutcome(again, { value: "", same: true }), {
  kind: "confirmed", count: 100, kept: [{ quantity: 5, unit: "bag (20 kg)", factor: 20 }],
});
const drifted = { ...kibble, lastEntered: [{ quantity: 4, unit: "bag (20 kg)", factor: 20 }] };
eq("sizes that no longer add up to the figure are not repeated", rowOutcome(drifted, { value: "", same: true }), { kind: "confirmed", count: 100 });

// Who may count is the stock.count activity now: scripts/check-permission-catalogue.mjs.

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
