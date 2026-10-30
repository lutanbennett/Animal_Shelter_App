// Checks the medication list's due-day rule against fixed days, on the real
// source file (not a copy), under the shelter's own clock and under UTC.
//
//   node scripts/check-medication-list-due.mjs
//   TZ=UTC node scripts/check-medication-list-due.mjs
//
// The rule reads the prescription's own schedule (0283) and mirrors
// prescription_dose_days_between() (0284), which the stock forecast counts with:
//   day    every N days from the start date
//   week   the chosen ISO weekdays (default: the start date's) in every Nth week, weeks Monday to Sunday
//          counted from the start date's week
//   month  the chosen days (default: the start date's) in every Nth calendar month; a day the month
//          lacks is its last day (Lutan, 2026-10-30)
// The frequency is no longer read. Restated 2026-10-30 from the 27 frequency cases it replaced.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { doseDueState } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/medication-list/due.ts")).href
);

const rx = (unit, every, weekdays = null, monthDays = null) => ({
  schedule_unit: unit,
  schedule_every: every,
  schedule_weekdays: weekdays,
  schedule_month_days: monthDays,
});
const daily = rx("day", 1);
const asNeeded = rx(null, null);

// 2026-10-01 is a Thursday; 2026-10-05 a Monday.
const cases = [
  // every day
  ["every day, start day", "2026-10-01", daily, "2026-10-01", "due"],
  ["every day, a month on", "2026-10-01", daily, "2026-11-30", "due"],
  // every N days
  ["every 2 days, start day", "2026-10-01", rx("day", 2), "2026-10-01", "due"],
  ["every 2 days, day 1", "2026-10-01", rx("day", 2), "2026-10-02", "notToday"],
  ["every 2 days, day 2", "2026-10-01", rx("day", 2), "2026-10-03", "due"],
  ["every 2 days, across month end", "2026-10-30", rx("day", 2), "2026-11-01", "due"],
  ["every 2 days, across month end, off day", "2026-10-30", rx("day", 2), "2026-10-31", "notToday"],
  // every week on the start date's weekday (the stored null)
  ["weekly, 6 days on", "2026-10-01", rx("week", 1), "2026-10-07", "notToday"],
  ["weekly, 7 days on", "2026-10-01", rx("week", 1), "2026-10-08", "due"],
  ["weekly, 8 days on", "2026-10-01", rx("week", 1), "2026-10-09", "notToday"],
  ["every 2 weeks, week 1", "2026-10-01", rx("week", 2), "2026-10-08", "notToday"],
  ["every 2 weeks, week 2", "2026-10-01", rx("week", 2), "2026-10-15", "due"],
  // THE CASE THE WHOLE ITEM EXISTS FOR: twice weekly, Monday and Thursday
  ["Mon+Thu from a Monday, the Monday", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-05", "due"],
  ["Mon+Thu from a Monday, the Tuesday", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-06", "notToday"],
  ["Mon+Thu from a Monday, the Thursday", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-08", "due"],
  ["Mon+Thu from a Monday, the Friday", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-09", "notToday"],
  ["Mon+Thu from a Monday, next Monday", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-12", "due"],
  ["Mon+Thu, Sunday is never", "2026-10-05", rx("week", 1, [1, 4]), "2026-10-11", "notToday"],
  // a start date partway through the week: the Monday before it is not due, the Thursday after is
  ["Mon+Thu started on a Wednesday, the Monday before", "2026-10-07", rx("week", 1, [1, 4]), "2026-10-05", "notToday"],
  ["Mon+Thu started on a Wednesday, that Thursday", "2026-10-07", rx("week", 1, [1, 4]), "2026-10-08", "due"],
  ["Mon+Thu started on a Wednesday, next Monday", "2026-10-07", rx("week", 1, [1, 4]), "2026-10-12", "due"],
  // every other week on chosen days: weeks run Monday to Sunday from the start date's week
  ["every 2 weeks Mon+Thu, week 1 Monday", "2026-10-05", rx("week", 2, [1, 4]), "2026-10-05", "due"],
  ["every 2 weeks Mon+Thu, week 2 Monday", "2026-10-05", rx("week", 2, [1, 4]), "2026-10-12", "notToday"],
  ["every 2 weeks Mon+Thu, week 3 Thursday", "2026-10-05", rx("week", 2, [1, 4]), "2026-10-22", "due"],
  ["every 2 weeks, start on a Sunday, next day is a new week", "2026-10-04", rx("week", 2, [1, 7]), "2026-10-05", "notToday"],
  ["every 2 weeks, start on a Sunday, the Monday after next", "2026-10-04", rx("week", 2, [1, 7]), "2026-10-12", "due"],
  // monthly on the start date's day
  ["monthly, same date next month", "2026-10-15", rx("month", 1), "2026-11-15", "due"],
  ["monthly, day before", "2026-10-15", rx("month", 1), "2026-11-14", "notToday"],
  ["monthly, day after", "2026-10-15", rx("month", 1), "2026-11-16", "notToday"],
  ["monthly from the 31st, moves to 30 Nov", "2026-10-31", rx("month", 1), "2026-11-30", "due"],
  ["monthly from the 31st, not 29 Nov", "2026-10-31", rx("month", 1), "2026-11-29", "notToday"],
  ["monthly from the 31st, back to the 31st", "2026-10-31", rx("month", 1), "2026-12-31", "due"],
  ["monthly from the 31st, 28 Feb (non-leap)", "2026-12-31", rx("month", 1), "2027-02-28", "due"],
  ["monthly from the 31st, 29 Feb (leap)", "2027-12-31", rx("month", 1), "2028-02-29", "due"],
  ["monthly from the 31st, 28 Feb in a leap year", "2027-12-31", rx("month", 1), "2028-02-28", "notToday"],
  ["every 2 months, month 1", "2026-10-15", rx("month", 2), "2026-11-15", "notToday"],
  ["every 2 months, month 2, across the year", "2026-10-15", rx("month", 2), "2026-12-15", "due"],
  ["every 2 months, month 4", "2026-10-15", rx("month", 2), "2027-02-15", "due"],
  // monthly on chosen days
  ["1st and 15th, the 1st", "2026-10-01", rx("month", 1, null, [1, 15]), "2026-11-01", "due"],
  ["1st and 15th, the 15th", "2026-10-01", rx("month", 1, null, [1, 15]), "2026-11-15", "due"],
  ["1st and 15th, the 16th", "2026-10-01", rx("month", 1, null, [1, 15]), "2026-11-16", "notToday"],
  ["1st and 15th, started on the 10th: the 1st before it is not due", "2026-10-10", rx("month", 1, null, [1, 15]), "2026-10-01", "notToday"],
  ["1st and 15th, started on the 10th: the 15th", "2026-10-10", rx("month", 1, null, [1, 15]), "2026-10-15", "due"],
  ["30th and 31st, 28 Feb counts (one day, not two)", "2026-12-30", rx("month", 1, null, [30, 31]), "2027-02-28", "due"],
  ["30th and 31st, 27 Feb is not", "2026-12-30", rx("month", 1, null, [30, 31]), "2027-02-27", "notToday"],
  ["30th and 31st, 30 Apr", "2026-12-30", rx("month", 1, null, [30, 31]), "2027-04-30", "due"],
  ["31st only, 30 Apr", "2026-12-31", rx("month", 1, null, [31]), "2027-04-30", "due"],
  ["every 2 months on the 1st and 15th, off month", "2026-10-01", rx("month", 2, null, [1, 15]), "2026-11-15", "notToday"],
  ["every 2 months on the 1st and 15th, on month", "2026-10-01", rx("month", 2, null, [1, 15]), "2026-12-15", "due"],
  // before the start is never due; as needed is shown, not hidden
  ["before start", "2026-10-10", rx("day", 1), "2026-10-09", "notToday"],
  ["no schedule at all", "2026-10-01", null, "2026-10-01", "asNeeded"],
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
