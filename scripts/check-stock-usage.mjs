// Checks src/lib/management/stock-usage.ts — the real exported functions,
// not a copy — against fixed counts: the interval and plan-window maths,
// adding up stock_count_intervals (0096) across a pair, the reading of
// usage against the plan, and the two caveats
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
const { latestPairs, stocktakePairs, stocktakeSessions, planWindow, receivedBetween, readUsage, standsOut, countMargin, difference, editedSince, departedDuring } = lib;

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};
const row = (stocktake, item, qty, at, unit = "tablet") => ({
  id: `${stocktake}:${item}`, stocktake_id: stocktake, item_id: item, counted_quantity: qty, unit, counted_at: at,
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
eq("window 1 Sep -> 15 Sep", planWindow({ from: rows[0], to: rows[1] }), { from: "2026-09-01", to: "2026-09-14", days: 14 });
eq("window same day -> null", planWindow({ from: rows[1], to: rows[2] }), null);
eq("window across the 17:00Z line", planWindow({ from: row("x", "i", 1, "2026-09-01T16:59:00Z"), to: row("y", "i", 1, "2026-09-01T17:01:00Z") }), { from: "2026-09-01", to: "2026-09-01", days: 1 });

// --- the view's intervals, added up across a pair ---
// What stock_count_intervals returns for the pill: A -> B (100 -> 60, 30
// received in 2 deliveries), B -> C (60 -> 58, nothing received).
const iv = (from, to, received, receipts, used) => ({ from_count_id: from, to_count_id: to, received, receipts, used });
const intervals = [iv("A:pill", "B:pill", 30, 2, 70), iv("B:pill", "C:pill", 0, 0, 2), iv("A:food", "B:food", 0, 0, 0)];
eq("between: consecutive pair is the view's row", receivedBetween(intervals, { from: rows[0], to: rows[1] }), { received: 30, receipts: 2, used: 70 });
eq("between: A -> C adds both intervals", receivedBetween(intervals, latest.get("pill")), { received: 30, receipts: 2, used: 72 });
eq("between: telescopes to from + received - to", 100 + 30 - 58, 72);
eq("between: unit change anywhere -> used null", receivedBetween([iv("A:pill", "B:pill", 30, 2, null), intervals[1]], latest.get("pill")).used, null);
eq("between: chain does not reach -> null", receivedBetween([intervals[0]], latest.get("pill")), null);
eq("between: no view rows -> null", receivedBetween([], latest.get("pill")), null);

// --- readings. 100 -> 60 with deliveries between ---
const ab = { from: rows[0], to: rows[1] };
const got = (used, received = 0, receipts = received ? 1 : 0) => ({ received, receipts, used });
eq("used 40, planned 40", readUsage(ab, got(40), 40, "tablet"), { state: "asPlanned", used: 40, gap: 0 });
eq("used 40, planned 35 (within 25%)", readUsage(ab, got(40), 35, "tablet").state, "asPlanned");
eq("used 70 (fell 40 + 30 received), planned 40 -> 30 more", readUsage(ab, got(70, 30), 40, "tablet"), { state: "moreThanPlanned", used: 70, gap: 30 });
eq("used 40, planned 80 -> 40 less", readUsage(ab, got(40), 80, "tablet"), { state: "lessThanPlanned", used: 40, gap: 40 });
eq("edge: gap exactly 25% is as planned", readUsage(ab, got(40), 32, "tablet").state, "asPlanned");
eq("used, nothing planned", readUsage(ab, got(40), 0, "tablet"), { state: "usedUnplanned", used: 40 });
const rose = { from: rows[1], to: row("D", "pill", 90, "2026-09-20T03:00:00Z") };
eq("rose 30 with 50 recorded -> used 20, a delivery, not a gap", readUsage(rose, got(20, 50), 25, "tablet"), { state: "asPlanned", used: 20, gap: -5 });
eq("rose 30 with 10 recorded -> at least 20 unrecorded", readUsage(rose, got(-20, 10), 25, "tablet"), { state: "unlogged", missing: 20 });
eq("rose 30, nothing recorded -> at least 30 unrecorded", readUsage(rose, got(-30), 0, "tablet"), { state: "unlogged", missing: 30 });
const held = { from: rows[3], to: rows[4] };
eq("used nothing, planned 700 g -> less by all of it", readUsage(held, got(0), 700, "g"), { state: "lessThanPlanned", used: 0, gap: 700 });
eq("used nothing, nothing planned", readUsage(held, got(0), 0, "g"), { state: "unchangedUnplanned" });
eq("float noise is not usage", readUsage(held, got(0.1 + 0.2 - 0.3), 0, "g").state, "unchangedUnplanned");
eq("unit changed between counts", readUsage({ from: rows[0], to: row("b", "pill", 60, s2, "ml") }, got(40), 10, "ml"), { state: "unitChanged" });
eq("unit changed since the count", readUsage(ab, got(40), 10, "ml"), { state: "unitChanged" });
eq("a receipt in another unit (view used null)", readUsage(ab, got(null, 30), 10, "tablet"), { state: "unitChanged" });
eq("same day", readUsage({ from: rows[1], to: rows[2] }, got(2), 10, "tablet"), { state: "sameDay" });
eq("view not loaded -> unknown", readUsage(ab, null, 10, "tablet"), { state: "unknown" });
eq("standsOut", ["asPlanned", "withinCount", "moreThanPlanned", "lessThanPlanned", "usedUnplanned", "unlogged", "unknown"].map((s) => standsOut({ state: s })), [false, false, true, true, true, true, false]);

// --- the floor: a gap the two counts can't tell apart is never marked ---
const small = { from: row("A", "rare", 10, s1), to: row("B", "rare", 7, s2) };
eq("margin: a counted unit is one", countMargin(small), 1);
eq("margin: read by eye, 5% of the larger count", countMargin({ from: row("A", "syrup", 400, s1, "ml"), to: row("B", "syrup", 250, s2, "ml") }), 20);
eq("margin: every counted unit", ["tablet", "capsule", "sachet", "application", "dose", "can", "portion"].map((u) => countMargin({ from: row("A", "x", 500, s1, u), to: row("B", "x", 400, s2, u) })), [1, 1, 1, 1, 1, 1, 1]);
eq("margin: read units scale with the stock", ["ml", "g", "mg", "drop", "cup", "IU", "mcg"].map((u) => countMargin({ from: row("A", "x", 200, s1, u), to: row("B", "x", 100, s2, u) })), [10, 10, 10, 10, 10, 10, 10]);
eq("tiny: planned 2, used 3 (+50%) is within one tablet", readUsage(small, got(3), 2, "tablet"), { state: "withinCount", used: 3, gap: 1, margin: 1 });
eq("tiny: planned 2, used 4 is past the floor", readUsage(small, got(4), 2, "tablet").state, "moreThanPlanned");
eq("tiny: planned 2, used 1 (-50%) is within one tablet", readUsage(small, got(1), 2, "tablet").state, "withinCount");
eq("tiny: nothing planned, one used", readUsage(small, got(1), 0, "tablet"), { state: "withinCount", used: 1, gap: 1, margin: 1 });
eq("tiny: nothing planned, two used is marked", readUsage(small, got(2), 0, "tablet").state, "usedUnplanned");
eq("tiny: one below zero is a miscount, not an unrecorded delivery", readUsage(small, got(-1), 0, "tablet").state, "withinCount");
eq("tiny: two below zero is an unrecorded delivery", readUsage(small, got(-2), 0, "tablet"), { state: "unlogged", missing: 2 });
eq("tiny: half below zero with a real plan reads as nothing used", readUsage(small, got(-0.5), 20, "tablet"), { state: "lessThanPlanned", used: -0.5, gap: 20 });
const bottle = { from: row("A", "syrup", 400, s1, "ml"), to: row("B", "syrup", 380, s2, "ml") };
eq("read: 20 ml over a 5 ml plan is inside a 400 ml bottle's margin", readUsage(bottle, got(20), 5, "ml").state, "withinCount");
eq("read: 25 ml over a 5 ml plan is marked", readUsage(bottle, got(30), 5, "ml").state, "moreThanPlanned");
eq("the ratio still rules big items", readUsage(ab, got(52), 40, "tablet").state, "moreThanPlanned");

// --- difference, with the percentage beside it ---
eq("diff: more", difference({ state: "moreThanPlanned", used: 70, gap: 30 }, 40), { quantity: 30, percent: 75 });
eq("diff: less is negative", difference({ state: "lessThanPlanned", used: 40, gap: 40 }, 80), { quantity: -40, percent: -50 });
eq("diff: as planned", difference({ state: "asPlanned", used: 40, gap: 0 }, 40), { quantity: 0, percent: 0 });
eq("diff: within the count", difference({ state: "withinCount", used: 3, gap: 1, margin: 1 }, 2), { quantity: 1, percent: 50 });
eq("diff: nothing planned has no percentage", difference({ state: "usedUnplanned", used: 12 }, 0), { quantity: 12, percent: null });
eq("diff: nothing planned, nothing used", difference({ state: "unchangedUnplanned" }, 0), { quantity: 0, percent: null });
eq("diff: plan not loaded (null)", difference({ state: "usedUnplanned", used: 12 }, null), { quantity: 12, percent: null });
eq("diff: rounds to a whole percent", difference({ state: "moreThanPlanned", used: 4, gap: 1 }, 3), { quantity: 1, percent: 33 });
eq("diff: none for unrecorded / unit change / same day / unknown",
  ["unlogged", "unitChanged", "sameDay", "unknown"].map((state) => difference({ state, missing: 3 }, 10)), [null, null, null, null]);
eq("diff: never -0", Object.is(difference({ state: "asPlanned", used: 10, gap: -0.001 }, 10).quantity, -0), false);

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
