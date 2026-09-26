// Checks src/lib/management/stock-usage.ts — the real exported functions,
// not a copy — against fixed counts: the interval and plan-window maths,
// the reading of a fall / rise against the plan, and the two caveats
// (edited since the count, residents who left during the interval).
//
//   node scripts/check-stock-usage.mjs            (local zone)
//   TZ=UTC node scripts/check-stock-usage.mjs     (the Workers case)
//
// No database, no env. Exits 0 when every case holds.
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The lib imports "@/lib/format"; map "@/" onto src/ the way tsconfig does.
const src = pathToFileURL(join(process.cwd(), "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const lib = await import(pathToFileURL(join(process.cwd(), "src/lib/management/stock-usage.ts")).href);
const { latestPairs, stocktakePairs, stocktakeSessions, planWindow, readUsage, standsOut, editedSince, departedDuring } = lib;

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};
const row = (stocktake, item, qty, at, unit = "tablet") => ({
  stocktake_id: stocktake, item_id: item, counted_quantity: qty, unit, counted_at: at,
});

// Thailand is UTC+7: 17:00Z is midnight at the shelter.
const s1 = "2026-09-01T03:00:00Z"; // 1 Sep, 10:00
const s2 = "2026-09-15T03:00:00Z"; // 15 Sep
const s2b = "2026-09-15T09:00:00Z"; // 15 Sep again, a recount
const late = "2026-09-14T18:00:00Z"; // 15 Sep 01:00 at the shelter
const rows = [
  row("A", "pill", 100, s1),
  row("B", "pill", 60, s2),
  row("C", "pill", 58, s2b),
  row("A", "food", 5000, s1, "g"),
  row("B", "food", 5000, s2, "g"),
  row("B", "once", 10, s2),
];

// --- pairs ---
const latest = latestPairs(rows);
eq("latest: recount is `to`, earlier-day count is `from`", [latest.get("pill").from.stocktake_id, latest.get("pill").to.stocktake_id], ["A", "C"]);
eq("latest: counted once -> no pair", latest.has("once"), false);
eq("latest: same-day-only history -> no pair", latestPairs([row("B", "x", 1, s2), row("C", "x", 2, s2b)]).has("x"), false);
eq("latest: 01:00 shelter time is the next day", latestPairs([row("A", "x", 1, s1), row("L", "x", 1, late), row("B", "x", 2, s2)]).get("x").from.stocktake_id, "A");
const picked = stocktakePairs(rows, "B", "A");
eq("picked: order-free, earlier is from", [picked.get("pill").from.stocktake_id, picked.get("pill").to.stocktake_id], ["A", "B"]);
eq("picked: only items in both", [...picked.keys()].sort(), ["food", "pill"]);
eq("sessions newest first, item counts", stocktakeSessions(rows).map((s) => [s.id, s.items]), [["C", 1], ["B", 3], ["A", 2]]);

// --- plan window: day of first count to the day before the second ---
const ab = { from: rows[0], to: rows[1] };
eq("window 1 Sep -> 15 Sep", planWindow(ab), { from: "2026-09-01", to: "2026-09-14", days: 14 });
eq("window same day -> null", planWindow({ from: rows[1], to: rows[2] }), null);
eq("window across the 17:00Z line", planWindow({ from: row("x", "i", 1, "2026-09-01T16:59:00Z"), to: row("y", "i", 1, "2026-09-01T17:01:00Z") }), { from: "2026-09-01", to: "2026-09-01", days: 1 });

// --- readings. 100 -> 60 = fell 40 ---
eq("fell 40, planned 40", readUsage(ab, 40, "tablet"), { state: "asPlanned", fall: 40, gap: 0 });
eq("fell 40, planned 35 (within 25%)", readUsage(ab, 35, "tablet").state, "asPlanned");
eq("fell 40, planned 20 -> at least 20 more", readUsage(ab, 20, "tablet"), { state: "moreThanPlanned", fall: 40, gap: 20 });
eq("fell 40, planned 80 -> 40 short", readUsage(ab, 80, "tablet"), { state: "lessThanPlanned", fall: 40, gap: 40 });
eq("edge: gap exactly 25% is as planned", readUsage(ab, 32, "tablet").state, "asPlanned");
eq("fell, nothing planned", readUsage(ab, 0, "tablet"), { state: "fellUnplanned", fall: 40 });
const rose = { from: rows[1], to: row("D", "pill", 90, "2026-09-20T03:00:00Z") };
eq("rose 30 -> delivery, no usage", readUsage(rose, 25, "tablet"), { state: "rose", rise: 30 });
const held = { from: rows[3], to: rows[4] };
eq("held, planned 700 g -> short by all of it", readUsage(held, 700, "g"), { state: "lessThanPlanned", fall: 0, gap: 700 });
eq("held, nothing planned", readUsage(held, 0, "g"), { state: "unchangedUnplanned" });
eq("float noise is not a fall", readUsage({ from: row("a", "i", 0.3, s1), to: row("b", "i", 0.1 + 0.2, s2) }, 0, "tablet").state, "unchangedUnplanned");
eq("unit changed between counts", readUsage({ from: rows[0], to: row("b", "pill", 60, s2, "ml") }, 10, "ml"), { state: "unitChanged" });
eq("unit changed since the count", readUsage(ab, 10, "ml"), { state: "unitChanged" });
eq("same day", readUsage({ from: rows[1], to: rows[2] }, 10, "tablet"), { state: "sameDay" });
eq("standsOut", ["asPlanned", "moreThanPlanned", "lessThanPlanned", "fellUnplanned", "rose"].map((s) => standsOut({ state: s })), [false, true, true, true, false]);

// --- caveats ---
eq("edited: same instant", editedSince(ab, s2), false);
eq("edited: later", editedSince(ab, "2026-09-16T03:00:00Z"), true);
eq("edited: none", editedSince(ab, null), false);
const window = { from: "2026-09-01", to: "2026-09-14" };
const assignments = [
  { item_id: "pill", resident_id: "adoptedMid", start_date: "2026-08-01", end_date: null },
  { item_id: "pill", resident_id: "adoptedBefore", start_date: "2026-08-01", end_date: null },
  { item_id: "pill", resident_id: "stillHere", start_date: "2026-08-01", end_date: null },
  { item_id: "pill", resident_id: "adoptedAfter", start_date: "2026-08-01", end_date: "2026-08-20" },
  { item_id: "pill", resident_id: "adoptedMid", start_date: "2026-09-10", end_date: null },
  { item_id: "food", resident_id: "adoptedMid", start_date: "2026-08-01", end_date: null },
];
const excluded = new Map([["adoptedMid", "2026-09-05"], ["adoptedBefore", "2026-09-01"], ["adoptedAfter", "2026-09-20"]]);
// adoptedMid counts once for two prescriptions; adoptedBefore left on the
// first day (not in the plan, not in the cupboard either); adoptedAfter's
// prescription ended before the window.
eq("departed during the window", departedDuring(assignments, excluded, "pill", window), 1);
eq("departed: other item", departedDuring(assignments, excluded, "food", window), 1);

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
