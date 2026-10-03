// Checks the medication list's due-day rule against fixed days, on the real
// source file (not a copy), under the shelter's own clock and under UTC.
//
//   node scripts/check-medication-list-due.mjs
//   TZ=UTC node scripts/check-medication-list-due.mjs
//
// The rule mirrors prescription_doses_between() (0044): the first dose is on
// the start date; "every N days/weeks" repeats from it; months are calendar
// months with the 31st clamped to the end of a short month.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { doseDueState } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/medication-list/due.ts")).href
);

const perDay = { doses_per_day: 2, interval_count: null, interval_unit: null };
const every = (n, unit) => ({ doses_per_day: null, interval_count: n, interval_unit: unit });
const asNeeded = { doses_per_day: null, interval_count: null, interval_unit: null };

const cases = [
  // per day: due every day
  ["twice daily, start day", "2026-10-01", perDay, "2026-10-01", "due"],
  ["twice daily, a month on", "2026-10-01", perDay, "2026-11-30", "due"],
  // every other day: both sides of the boundary
  ["every 2 days, start day", "2026-10-01", every(2, "day"), "2026-10-01", "due"],
  ["every 2 days, day 1", "2026-10-01", every(2, "day"), "2026-10-02", "notToday"],
  ["every 2 days, day 2", "2026-10-01", every(2, "day"), "2026-10-03", "due"],
  ["every 2 days, across month end", "2026-10-30", every(2, "day"), "2026-11-01", "due"],
  ["every 2 days, across month end, off day", "2026-10-30", every(2, "day"), "2026-10-31", "notToday"],
  // weekly
  ["weekly, 6 days on", "2026-10-01", every(1, "week"), "2026-10-07", "notToday"],
  ["weekly, 7 days on", "2026-10-01", every(1, "week"), "2026-10-08", "due"],
  ["weekly, 8 days on", "2026-10-01", every(1, "week"), "2026-10-09", "notToday"],
  ["every 2 weeks, week 1", "2026-10-01", every(2, "week"), "2026-10-08", "notToday"],
  ["every 2 weeks, week 2", "2026-10-01", every(2, "week"), "2026-10-15", "due"],
  // monthly: calendar months, 31st clamps
  ["monthly, same date next month", "2026-10-15", every(1, "month"), "2026-11-15", "due"],
  ["monthly, day before", "2026-10-15", every(1, "month"), "2026-11-14", "notToday"],
  ["monthly, day after", "2026-10-15", every(1, "month"), "2026-11-16", "notToday"],
  ["monthly from the 31st, clamps to 30 Nov", "2026-10-31", every(1, "month"), "2026-11-30", "due"],
  ["monthly from the 31st, not 29 Nov", "2026-10-31", every(1, "month"), "2026-11-29", "notToday"],
  ["monthly from the 31st, back to the 31st", "2026-10-31", every(1, "month"), "2026-12-31", "due"],
  ["monthly from the 31st, 28 Feb (non-leap)", "2026-12-31", every(1, "month"), "2027-02-28", "due"],
  ["monthly from the 31st, 29 Feb (leap)", "2027-12-31", every(1, "month"), "2028-02-29", "due"],
  ["monthly from the 31st, 28 Feb in a leap year", "2027-12-31", every(1, "month"), "2028-02-28", "notToday"],
  ["every 2 months, month 1", "2026-10-15", every(2, "month"), "2026-11-15", "notToday"],
  ["every 2 months, month 2, across the year", "2026-10-15", every(2, "month"), "2026-12-15", "due"],
  ["every 2 months, month 4", "2026-10-15", every(2, "month"), "2027-02-15", "due"],
  // before the start is never due; as needed is shown, not hidden
  ["before start", "2026-10-10", every(1, "day"), "2026-10-09", "notToday"],
  ["no frequency at all", "2026-10-01", null, "2026-10-01", "asNeeded"],
  ["as needed", "2026-10-01", asNeeded, "2026-10-05", "asNeeded"],
];

let failed = 0;
for (const [name, start, schedule, day, want] of cases) {
  const got = doseDueState(start, schedule, day);
  if (got !== want) {
    failed++;
    console.error(`FAIL ${name}: ${start} ${day} -> ${got}, want ${want}`);
  }
}
console.log(`medication-list due-day: ${cases.length - failed}/${cases.length} passed (TZ=${process.env.TZ ?? "unset"})`);
process.exit(failed ? 1 : 0);
