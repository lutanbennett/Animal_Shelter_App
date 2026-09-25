// Checks readStock() and the two parsers in src/lib/management/stock.ts —
// the real exported functions, not a copy — against fixed instants, so the
// shelter-calendar and 17:00Z boundaries are asserted rather than waited for.
//
//   node scripts/check-stock-reading.mjs            (local zone)
//   TZ=UTC node scripts/check-stock-reading.mjs     (the Workers case)
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
const { readStock, parseStockCount, parseLeadDays } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/management/stock.ts")).href
);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};
const at = (iso) => Date.parse(iso);
const fig = (stock, counted, lead = null) => ({
  stock_on_hand: stock,
  stock_counted_at: counted,
  reorder_lead_days: lead,
});

// 30 used in 30 days = 1/day. "now" 2026-09-25 10:00 Thai (03:00Z)
const now = at("2026-09-25T03:00:00Z");
eq("null is not counted", readStock(fig(null, null, 5), 30, now).state, "notCounted");
eq("null never flagged", readStock(fig(null, null, 5), 30, now).reorder, false);
eq("zero is out", readStock(fig(0, "2026-09-25T02:00:00Z", 5), 30, now), { state: "out", daysLeft: 0, runsOutOn: "2026-09-25", countedDaysAgo: 0, reorder: true });
eq("zero, no lead: out but not flagged", readStock(fig(0, "2026-09-25T02:00:00Z"), 30, now).reorder, false);
eq("counted now, 10 at 1/day", readStock(fig(10, "2026-09-25T03:00:00Z"), 30, now), { state: "days", daysLeft: 10, runsOutOn: "2026-10-05", countedDaysAgo: 0, reorder: false });
eq("counted 4 days ago: 10-4=6", readStock(fig(10, "2026-09-21T03:00:00Z"), 30, now).daysLeft, 6);
eq("counted 4d ago shows 4 days ago", readStock(fig(10, "2026-09-21T03:00:00Z"), 30, now).countedDaysAgo, 4);
eq("half a day elapsed floors 9.5 -> 9", readStock(fig(10, "2026-09-24T15:00:00Z"), 30, now).daysLeft, 9);
eq("used up since count", readStock(fig(10, "2026-09-10T03:00:00Z", 3), 30, now), { state: "runDown", daysLeft: 0, runsOutOn: "2026-09-25", countedDaysAgo: 15, reorder: true });
eq("exactly used up is runDown", readStock(fig(10, "2026-09-15T03:00:00Z"), 30, now).state, "runDown");
eq("nothing forecast: notUsed", readStock(fig(10, "2026-09-25T03:00:00Z", 30), 0, now), { state: "notUsed", daysLeft: null, runsOutOn: null, countedDaysAgo: 0, reorder: false });
// flag band edges: lead 7
eq("days 8, lead 7: not flagged", readStock(fig(8, "2026-09-25T03:00:00Z", 7), 30, now).reorder, false);
eq("days 7, lead 7: flagged (<=)", readStock(fig(7, "2026-09-25T03:00:00Z", 7), 30, now).reorder, true);
eq("days 6, lead 7: flagged", readStock(fig(6, "2026-09-25T03:00:00Z", 7), 30, now).reorder, true);
// fractional rate: 45 g over 30 days = 1.5/day, 100 g -> 66
eq("fractional rate", readStock(fig(100, "2026-09-25T03:00:00Z"), 45, now).daysLeft, 66);
// shelter calendar: counted 23:30 Thai 24th (16:30Z), read 00:30 Thai 25th (17:30Z) -> 1 day ago, not 0
eq("countedDaysAgo is shelter calendar", readStock(fig(10, "2026-09-24T16:30:00Z"), 30, at("2026-09-24T17:30:00Z")).countedDaysAgo, 1);
eq("runsOutOn from shelter today across 17:00Z", readStock(fig(10, "2026-09-24T17:30:00Z"), 30, at("2026-09-24T17:30:00Z")).runsOutOn, "2026-10-05");
eq("before 17:00Z still the 24th", readStock(fig(10, "2026-09-24T16:30:00Z"), 30, at("2026-09-24T16:30:00Z")).runsOutOn, "2026-10-04");
// year end
eq("year end", readStock(fig(3, "2026-12-30T03:00:00Z"), 30, at("2026-12-30T03:00:00Z")).runsOutOn, "2027-01-02");
// parsers
eq("count blank -> null", parseStockCount("  "), { ok: true, value: null });
eq("count 0 -> 0", parseStockCount("0"), { ok: true, value: 0 });
eq("count 12.5", parseStockCount("12.5"), { ok: true, value: 12.5 });
eq("count -1 refused", parseStockCount("-1").ok, false);
eq("count abc refused", parseStockCount("abc").ok, false);
eq("lead blank -> null", parseLeadDays(""), { ok: true, value: null });
eq("lead 0 refused", parseLeadDays("0").ok, false);
eq("lead 1.5 refused", parseLeadDays("1.5").ok, false);
eq("lead 365 ok", parseLeadDays("365"), { ok: true, value: 365 });
eq("lead 366 refused", parseLeadDays("366").ok, false);
console.log(fails ? `${fails} FAILED` : "all passed");
process.exitCode = fails ? 1 : 0;
