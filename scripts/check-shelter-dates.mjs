#!/usr/bin/env node
/**
 * Pins the three things the 2026-10-03 staff dry run (F-02, F-03, F-04) found
 * wrong, at the hour they went wrong rather than at noon:
 *
 *   F-02  a chip typed into "Scan a chip" is recognised (chipFromSearch)
 *   F-03  "in the future" is judged on the shelter's calendar day, Asia/Bangkok,
 *         not on UTC — so 01:00 on 3 Oct accepts 3 Oct (isFutureDate)
 *   F-04  a placement can follow another on the same shelter day, including
 *         the intake's own 00:00 UTC stamp, which is 07:00 in Bangkok
 *         (placementStartAfter)
 *
 * It also fails if a server action goes back to comparing a date-only value,
 * parsed as UTC midnight, against Date.now() — the exact shape of F-03.
 *
 * Runs under several process time zones: the answer must not depend on the
 * server's clock zone, only on the instant and the shelter's zone.
 *
 *   node scripts/check-shelter-dates.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { register } from "node:module";
import { join } from "node:path";

// The sources import "@/lib/…" and leave off the extension, as Next resolves
// them; Node needs both spelled out, so teach it just enough to load them.
const srcUrl = new URL("../src/", import.meta.url).href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      const src = ${JSON.stringify(srcUrl)};
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith("@/")) specifier = src + specifier.slice(2);
        const local = specifier.startsWith("file:") || specifier.startsWith(".");
        if (local && !/[.][cm]?[jt]s$/.test(specifier)) specifier += ".ts";
        return next(specifier, context);
      }`),
  import.meta.url,
);

const { chipFromSearch } = await import("../src/lib/residents/microchip.ts");
const { isFutureDate, placementStartAfter, placementStartDate } = await import(
  "../src/lib/placements/dates.ts"
);

const { suggestRound, shelterHour } = await import("../src/lib/rounds/suggest.ts");

let failed = 0;
function check(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${ok ? "" : `: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
}

// F-02 — the chip the dry run recorded, in the shapes a reader or a person types.
const CHIP = "900263000394001";
check("chip: bare digits", chipFromSearch(CHIP), CHIP);
check("chip: grouped with spaces", chipFromSearch("900 263 000 394 001"), CHIP);
check("chip: grouped with dashes", chipFromSearch("900-263-000-394-001"), CHIP);
check("chip: padded", chipFromSearch(` ${CHIP} `), CHIP);
check("chip: 14 digits is not a chip", chipFromSearch("90026300039400"), null);
check("chip: 16 digits is not a chip", chipFromSearch(`${CHIP}1`), null);
check("chip: a resident ID is not a chip", chipFromSearch("R-0394"), null);
check("chip: a name is not a chip", chipFromSearch("Mae Wang"), null);
check("chip: letters among digits are not a chip", chipFromSearch("9002630003940d1"), null);
check("chip: empty", chipFromSearch(""), null);

for (const tz of ["UTC", "Asia/Bangkok", "America/Los_Angeles", "Pacific/Kiritimati"]) {
  process.env.TZ = tz;
  const at = (iso) => new Date(iso);
  const t = (label) => `[${tz}] ${label}`;

  // F-03 — 01:00 on 3 Oct in Bangkok is 18:00 on 2 Oct in UTC.
  const early = at("2026-10-02T18:00:00Z");
  check(t("01:00 ICT 3 Oct accepts 3 Oct"), isFutureDate("2026-10-03", early), false);
  check(t("01:00 ICT 3 Oct accepts 2 Oct"), isFutureDate("2026-10-02", early), false);
  check(t("01:00 ICT 3 Oct refuses 4 Oct"), isFutureDate("2026-10-04", early), true);
  // The last second before Bangkok midnight, and the first after it.
  check(t("23:59:59 ICT 2 Oct refuses 3 Oct"), isFutureDate("2026-10-03", at("2026-10-02T16:59:59Z")), true);
  check(t("00:00:00 ICT 3 Oct accepts 3 Oct"), isFutureDate("2026-10-03", at("2026-10-02T17:00:00Z")), false);
  check(t("noon ICT 3 Oct accepts 3 Oct"), isFutureDate("2026-10-03", at("2026-10-03T05:00:00Z")), false);

  // F-04 — the intake stamps its placement `p_intake_date::timestamptz`: 00:00 UTC.
  const intake = "2026-10-03T00:00:00+00:00";
  check(
    t("move on the intake day at 01:00 ICT follows the intake"),
    placementStartAfter("2026-10-03", early, intake),
    "2026-10-03T00:00:01.000Z",
  );
  check(
    t("move on the intake day at 10:00 ICT is stamped now"),
    placementStartAfter("2026-10-03", at("2026-10-03T03:00:00Z"), intake),
    "2026-10-03T03:00:00.000Z",
  );
  check(
    t("move dated the day before the intake is refused"),
    placementStartAfter("2026-10-02", at("2026-10-03T03:00:00Z"), intake),
    null,
  );
  // Two back-dated changes on one day both land on T12:00Z; end_date > start_date forbids a tie.
  const backdated = "2026-10-01T12:00:00+00:00";
  check(
    t("second back-dated change on one day does not tie"),
    placementStartAfter("2026-10-01", at("2026-10-03T03:00:00Z"), backdated),
    "2026-10-01T12:00:01.000Z",
  );
  check(
    t("a later day is untouched"),
    placementStartAfter("2026-10-02", at("2026-10-03T03:00:00Z"), backdated),
    placementStartDate("2026-10-02", at("2026-10-03T03:00:00Z")),
  );
  // The previous placement began at 01:30 ICT on 3 Oct: 2 Oct is the day before it.
  check(
    t("previous start's day is read in Bangkok, not UTC"),
    placementStartAfter("2026-10-02", at("2026-10-03T03:00:00Z"), "2026-10-02T18:30:00+00:00"),
    null,
  );
}

// Rounds (0137): the clock only suggests, on the shelter's clock. Both sides of each edge
// (Bangkok is UTC+7: 10:59 ICT = 03:59Z, 11:00 = 04:00Z, 15:59 = 08:59Z, 16:00 = 09:00Z), the 00:00
// and 06:59 ICT ends where UTC is still yesterday, and 23:59, under every process zone.
for (const tz of ["UTC", "Asia/Bangkok", "America/Los_Angeles", "Pacific/Kiritimati"]) {
  process.env.TZ = tz;
  const edges = [
    ["2026-10-02T17:00:00Z", 0, "morning", "morning"], // 00:00 ICT 3 Oct, UTC still 2 Oct
    ["2026-10-02T23:59:59Z", 6, "morning", "morning"], // 06:59:59 ICT
    ["2026-10-03T03:59:59Z", 10, "morning", "morning"], // 10:59:59 ICT
    ["2026-10-03T04:00:00Z", 11, "lunch", "evening"], // 11:00:00 ICT
    ["2026-10-03T08:59:59Z", 15, "lunch", "evening"], // 15:59:59 ICT
    ["2026-10-03T09:00:00Z", 16, "evening", "evening"], // 16:00:00 ICT
    ["2026-10-03T16:59:59Z", 23, "evening", "evening"], // 23:59:59 ICT
  ];
  for (const [iso, hour, med, food] of edges) {
    const at = new Date(iso);
    check(`[${tz}] ${iso} is ${hour}h at the shelter`, shelterHour(at), hour);
    check(`[${tz}] ${iso} suggests ${med} for medication`, suggestRound("medication", at), med);
    check(`[${tz}] ${iso} suggests ${food} for food`, suggestRound("food", at), food);
  }
}

// F-03's shape: a "YYYY-MM-DD" string is UTC midnight when parsed by Date, so
// comparing it with Date.now() is wrong for seven hours of every Bangkok day.
const root = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const offenders = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(name)) {
      readFileSync(path, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/\.getTime\(\)\s*>\s*Date\.now\(\)/.test(line)) offenders.push(`${path}:${i + 1}`);
        });
    }
  }
})(decodeURIComponent(root));
check("no date-only value is compared with Date.now()", offenders, []);

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll checks passed.");
