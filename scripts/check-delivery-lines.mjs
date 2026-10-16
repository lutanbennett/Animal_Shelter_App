// Checks src/lib/management/delivery-lines.ts: several sizes in one delivery
// add up to what a person would total by hand, each line against its OWN
// factor, and a delivery is priced only when every line is.
//
//   node scripts/check-delivery-lines.mjs
//
// No database, no env. Exits 0 when every case holds.
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The libs import "@/lib/..."; map "@/" onto src/ the way tsconfig does.
const src = pathToFileURL(join(process.cwd(), "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        return next(spec, ctx);
      }`),
);

const { resolveDeliveryLines, previewBase } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/management/delivery-lines.ts")).href
);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

const conv = (unit, basePer) => ({ id: unit, unit, unitTh: null, basePer, isPurchase: true, isCount: false, note: null });
// Kibble, base unit kg.
const c = [conv("bag (20 kg)", 20), conv("bag (14 kg)", 14), conv("bag (5 kg)", 5)];
const line = (quantity, unit = "", cost = "") => ({ quantity, unit, cost });

const mixed = resolveDeliveryLines([line("2", "bag (20 kg)"), line("1", "bag (14 kg)"), line("3", "bag (5 kg)")], c, ["kg"]);
eq("2x20 + 1x14 + 3x5 = 69 kg", mixed.base, 69);
eq("each line kept with its own factor", mixed.entered.map((e) => [e.quantity, e.factor]), [[2, 20], [1, 14], [3, 5]]);
eq("no prices = no cost", mixed.cost, null);

const priced = resolveDeliveryLines(
  [line("2", "bag (20 kg)", "1600"), line("1", "bag (14 kg)", "700.50")],
  c,
  ["kg"],
);
eq("cost is the sum of the lines", priced.cost, 2300.5);
eq("priced total", priced.base, 54);

eq("one priced, one not = refused", resolveDeliveryLines([line("2", "bag (20 kg)", "1600"), line("1", "bag (14 kg)")], c, ["kg"]),
  { ok: false, reason: "costIncomplete", line: 1 });
const gift = resolveDeliveryLines([line("2", "bag (20 kg)", "0"), line("1", "bag (14 kg)", "0")], c, ["kg"]);
eq("all 0 = donated, cost 0", gift.cost, 0);

const single = resolveDeliveryLines([line("40")], c, ["kg"]);
eq("one base-unit line: entered stays null, as before", [single.base, single.entered], [40, null]);
const singleBag = resolveDeliveryLines([line("2", "bag (20 kg)")], c, ["kg"]);
eq("one bag line", [singleBag.base, singleBag.entered], [40, [{ quantity: 2, unit: "bag (20 kg)", factor: 20 }]]);

const loose = resolveDeliveryLines([line("2", "bag (20 kg)"), line("3")], c, ["kg"]);
eq("a loose-kg line beside a bag line", [loose.base, loose.entered], [
  43,
  [{ quantity: 2, unit: "bag (20 kg)", factor: 20 }, { quantity: 3, unit: "kg", factor: 1 }],
]);

eq("no lines", resolveDeliveryLines([], c, ["kg"]), { ok: false, reason: "noLines" });
eq("bad quantity names its line", resolveDeliveryLines([line("2", "bag (20 kg)"), line("0", "bag (14 kg)")], c, ["kg"]),
  { ok: false, reason: "quantityInvalid", line: 1 });
eq("unknown size", resolveDeliveryLines([line("1", "pallet")], c, ["kg"]), { ok: false, reason: "unknownUnit", line: 0 });
eq("bad cost", resolveDeliveryLines([line("1", "bag (20 kg)", "abc")], c, ["kg"]), { ok: false, reason: "costInvalid", line: 0 });

eq("previewBase skips an unfinished line", previewBase([line("2", "bag (20 kg)"), line("")], c), 40);
eq("previewBase of nothing", previewBase([line("")], c), null);

// The tablet case from the backlog: 1 box of 50 + 3 sleeves of 10 = 80 tablets.
const t = [conv("box", 50), conv("sleeve", 10)];
eq("1 box + 3 sleeves = 80 tablets", resolveDeliveryLines([line("1", "box"), line("3", "sleeve")], t, ["tablet"]).base, 80);

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exit(fails ? 1 : 0);
