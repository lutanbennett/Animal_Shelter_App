#!/usr/bin/env node
/**
 * Checks csvField / toCsv in src/lib/csv.ts: a value Excel would run as a
 * formula is made text with a leading apostrophe, a number is left alone
 * (a -12.50 in the cashflow export must stay a number), and quoting still
 * follows RFC 4180.
 *
 *   node scripts/check-csv.mjs
 */
import { csvField, toCsv } from "../src/lib/csv.ts";

const cases = [
  // [input, expected field]
  ["Cooper", "Cooper"],
  ["", ""],
  ["=HYPERLINK(\"http://x\")", `"'=HYPERLINK(""http://x"")"`],
  ["=1+1", "'=1+1"],
  ["+66 81 234 5678", "'+66 81 234 5678"],
  ["-cmd", "'-cmd"],
  ["@SUM(A1)", "'@SUM(A1)"],
  ["\tleading tab", "'\tleading tab"],
  ["\rleading CR", `"'\rleading CR"`],
  ["-12.50", "-12.50"],
  ["-12", "-12"],
  ["+7", "+7"],
  ["3.5", "3.5"],
  [".5", ".5"],
  ["1e3", "1e3"],
  ["-1+2", "'-1+2"],
  ["-", "'-"],
  ["a=b", "a=b"],
  ["Smith, Jo", `"Smith, Jo"`],
  [`say "hi"`, `"say ""hi"""`],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = csvField(input);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(input)} -> ${JSON.stringify(got)}${ok ? "" : ` (wanted ${JSON.stringify(expected)})`}`);
}

const whole = toCsv([["Name", "Amount"], ["=cmd", "-12.50"]]);
const wholeOk = whole === "Name,Amount\r\n'=cmd,-12.50\r\n";
if (!wholeOk) failed++;
console.log(`${wholeOk ? "ok  " : "FAIL"} toCsv row with a formula and a negative amount`);

console.log(failed ? `\n${failed} wrong` : "\nall right");
process.exit(failed ? 1 : 0);
