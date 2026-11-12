// Bulk bills from a strict templated CSV: the parser's good rows and, above all, its refusals.
import test from "node:test";
import assert from "node:assert/strict";
import { parseBillImport, strictDate, templateRows, BILL_IMPORT_COLUMNS } from "./import.ts";
import { decodeUtf8Csv, parseCsv } from "../csv-read.ts";
import { toCsv } from "../csv.ts";

const kinds = [
  { id: "k-util", key: "utilities", label: "Utilities", parentId: null, sort: 1, archived: false },
  { id: "k-elec", key: "electricity", label: "Electricity", parentId: "k-util", sort: 1, archived: false },
  { id: "k-mat", key: "materials", label: "Materials", parentId: null, sort: 2, archived: false },
  { id: "k-other", key: "other", label: "Other", parentId: null, sort: 3, archived: false },
  { id: "k-food", key: "food", label: "Dog food", parentId: null, sort: 4, archived: false },
  { id: "k-old", key: "cleaning_products", label: "Old cleaning", parentId: null, sort: 5, archived: true },
];
const places = [
  { id: "p-main", name: "Main shelter" },
  { id: "p-annex", name: "ศูนย์พักพิง" },
];
const accounts = [
  { id: "a-mea", label: "MEA 1234", premisesId: "p-main" },
  { id: "a-dup1", label: "Twin", premisesId: null },
  { id: "a-dup2", label: "Twin", premisesId: null },
];
const photos = [
  { id: "ph-1", fileName: "IMG_0412.jpg" },
  { id: "ph-2", fileName: "IMG_0413.jpg" },
  { id: "ph-3a", fileName: "IMG_0001.jpg" },
  { id: "ph-3b", fileName: "IMG_0001.jpg" },
];
const cat = (over = {}) => ({ kinds, places, accounts, photos, mayFile: () => true, ...over });
const HEAD = BILL_IMPORT_COLUMNS.join(",");
const bytes = (text) => new TextEncoder().encode(text);
const run = (rows, over) => parseBillImport(bytes([HEAD, ...rows].join("\r\n") + "\r\n"), cat(over));
const only = (rows, over) => {
  const r = run(rows, over);
  assert.ok(r.ok, JSON.stringify(r));
  return r;
};
const codes = (rows, over) => only(rows, over).rejects.map((x) => x.code);

const UTIL = "utility,Electricity,Main shelter,MEA 1234,4820.50,2026-11-03,2026-10,IMG_0412.jpg";
const GEN = "general,Materials,Main shelter,,12900.00,2026-11-05,,IMG_0413.jpg";

test("good utility and general rows come through with their ids, month and photo", () => {
  const r = only([UTIL, GEN]);
  assert.equal(r.rejects.length, 0);
  assert.equal(r.good.length, 2);
  assert.deepEqual(
    { kind: r.good[0].kindId, place: r.good[0].placeId, account: r.good[0].accountId, amount: r.good[0].amount, month: r.good[0].coversMonth, photo: r.good[0].photoId, line: r.good[0].line },
    { kind: "k-elec", place: "p-main", account: "a-mea", amount: 4820.5, month: "2026-10-01", photo: "ph-1", line: 2 },
  );
  assert.equal(r.good[1].coversMonth, null);
});

test("columns may be in any order", () => {
  const cols = [...BILL_IMPORT_COLUMNS].reverse();
  const row = { destination: "general", kind: "Other", place: "", account: "", amount: "5", date: "2026-01-02", covers_month: "", photo_filename: "" };
  const r = parseBillImport(bytes(cols.join(",") + "\n" + cols.map((c) => row[c]).join(",") + "\n"), cat());
  assert.ok(r.ok && r.good.length === 1 && r.rejects.length === 0);
});

test("encoding: UTF-8 with and without a byte-order mark is accepted, Thai survives", () => {
  const text = [HEAD, "general,Other,,,10,2026-01-02,,"].join("\n") + "\n";
  assert.ok(parseBillImport(bytes(text), cat()).ok);
  const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes(text)]);
  const r = parseBillImport(withBom, cat());
  assert.ok(r.ok && r.good.length === 1, "a BOM must not spoil the first column name");
  const thai = parseBillImport(bytes([HEAD, "general,Materials,ศูนย์พักพิง,,10,2026-01-02,,"].join("\n")), cat());
  assert.ok(thai.ok && thai.good[0].placeId === "p-annex");
});

test("encoding: CP874, UTF-16 and an empty file are refused for the whole file", () => {
  // Thai in CP874 is a run of high bytes that is not valid UTF-8.
  const cp874 = new Uint8Array([...bytes(HEAD + "\ngeneral,Other,"), 0xa1, 0xd2, 0xc3, ...bytes(",,10,2026-01-02,,\n")]);
  assert.deepEqual(parseBillImport(cp874, cat()), { ok: false, fault: { code: "notUtf8" } });
  assert.deepEqual(parseBillImport(new Uint8Array([0xff, 0xfe, 0x61, 0x00]), cat()), { ok: false, fault: { code: "utf16" } });
  assert.deepEqual(parseBillImport(new Uint8Array(), cat()), { ok: false, fault: { code: "empty" } });
  assert.deepEqual(parseBillImport(bytes("  \n \n"), cat()), { ok: false, fault: { code: "empty" } });
});

test("the header must be exactly the template's columns", () => {
  const r = parseBillImport(bytes("destination,kind,amount\ngeneral,Other,5\n"), cat());
  assert.ok(!r.ok && r.fault.code === "badHeader" && /missing: place/.test(r.fault.detail));
  const extra = parseBillImport(bytes(HEAD + ",colour\n"), cat());
  assert.ok(!extra.ok && extra.fault.code === "badHeader" && /colour/.test(extra.fault.detail));
  const twice = parseBillImport(bytes(HEAD + ",amount\n"), cat());
  assert.ok(!twice.ok && /repeated/.test(twice.fault.detail));
});

test("an unterminated quote and too many rows refuse the whole file", () => {
  assert.deepEqual(parseBillImport(bytes(HEAD + '\ngeneral,"Other,,,5,2026-01-02,,\n'), cat()), { ok: false, fault: { code: "unterminatedQuote" } });
  const many = Array.from({ length: 501 }, () => "general,Other,,,5,2026-01-02,,");
  const r = parseBillImport(bytes([HEAD, ...many].join("\n")), cat());
  assert.ok(!r.ok && r.fault.code === "tooManyRows");
});

test("dates: only 2026-11-11 and only a real day", () => {
  assert.equal(strictDate("2026-11-11"), "2026-11-11");
  for (const bad of ["11/11/2026", "11-11-26", "2026-1-1", "2026-11-31", "2026-13-01", "2026-02-29", "", "2026-11-11T00:00", "11 Nov 2026"]) {
    assert.equal(strictDate(bad), null, bad);
    assert.deepEqual(codes([`general,Other,,,5,${bad},,`]), ["dateInvalid"], bad);
  }
  assert.equal(strictDate("2028-02-29"), "2028-02-29");
});

test("a bad date rejects only its own row", () => {
  const r = only([UTIL, "general,Other,,,5,11/11/2026,,", GEN]);
  assert.equal(r.good.length, 2);
  assert.deepEqual(r.rejects.map((x) => [x.line, x.code]), [[3, "dateInvalid"]]);
});

test("utility month: 2026-10 is good; missing, a full day, a bad month and a month on a general bill are not", () => {
  assert.equal(only([UTIL]).good[0].coversMonth, "2026-10-01");
  assert.deepEqual(codes(["utility,Electricity,,,5,2026-11-03,,"]), ["monthMissing"]);
  for (const bad of ["2026-10-17", "2026-13", "2026-00", "10-2026", "Oct 2026", "2026-1"]) {
    assert.deepEqual(codes([`utility,Electricity,,,5,2026-11-03,${bad},`]), ["monthInvalid"], bad);
  }
  assert.deepEqual(codes(["general,Other,,,5,2026-11-03,2026-10,"]), ["monthNotUtility"]);
});

test("amounts: plain numbers only, never blank, negative, thousands separators or letters", () => {
  assert.equal(only(["general,Other,,,0.5,2026-01-02,,", "general,Other,,,100,2026-01-02,,"]).good.length, 2);
  assert.deepEqual(codes(["general,Other,,,,2026-01-02,,"]), ["amountMissing"]);
  for (const bad of ["-5", '"4,820.50"', "12abc", "1.234", "฿5", "1e3", "0x10"]) {
    assert.deepEqual(codes([`general,Other,,,${bad},2026-01-02,,`]), ["amountInvalid"], bad);
  }
});

test("kind, place and account are matched exactly, Thai included, and never guessed", () => {
  assert.deepEqual(codes(["general,materials,,,5,2026-01-02,,"]), ["kindUnknown"], "case matters");
  assert.deepEqual(codes(["general,Material,,,5,2026-01-02,,"]), ["kindUnknown"], "no near-misses");
  assert.deepEqual(codes(["general,,,,5,2026-01-02,,"]), ["kindMissing"]);
  assert.deepEqual(codes(["general,Materials,Main  shelter,,5,2026-01-02,,"]), ["placeUnknown"]);
  assert.deepEqual(codes(["general,Materials,main shelter,,5,2026-01-02,,"]), ["placeUnknown"]);
  assert.deepEqual(codes(["general,Materials,,mea 1234,5,2026-01-02,,"]), ["accountUnknown"]);
  assert.deepEqual(codes(["general,Materials,,Twin,5,2026-01-02,,"]), ["accountMany"], "two accounts with one name are reported, not picked");
  assert.deepEqual(codes(["general,Materials,ศูนย์,,5,2026-01-02,,"]), ["placeUnknown"]);
  assert.equal(only(["general,Materials,ศูนย์พักพิง,,5,2026-01-02,,"]).good[0].placeId, "p-annex");
});

test("an account at another place than the row's place is refused", () => {
  assert.deepEqual(codes(["general,Materials,ศูนย์พักพิง,MEA 1234,5,2026-01-02,,"]), ["accountElsewhere"]);
});

test("the destination must match the kind, and only utility and general are filed", () => {
  assert.deepEqual(codes(["general,Electricity,,,5,2026-01-02,,"]), ["kindWrongDestination"]);
  assert.deepEqual(codes(["utility,Materials,,,5,2026-01-02,2026-10,"]), ["kindWrongDestination"]);
  assert.deepEqual(codes(["maintenance,Materials,,,5,2026-01-02,,"]), ["destinationUnknown"]);
  assert.deepEqual(codes(["general,Dog food,,,5,2026-01-02,,"]), ["kindNotHere"], "a delivery kind needs a delivery");
  assert.deepEqual(codes(["general,Old cleaning,,,5,2026-01-02,,"]), ["kindArchived"]);
});

test("a kind that has no place or account refuses one rather than dropping it silently", () => {
  assert.deepEqual(codes(["general,Other,Main shelter,,5,2026-01-02,,"]), ["kindNoPlace"]);
  assert.deepEqual(codes(["general,Other,,MEA 1234,5,2026-01-02,,"]), ["kindNoAccount"]);
});

test("rights are asked per row, for that row's own destination", () => {
  const onlyGeneral = { mayFile: (route) => route === "general" };
  const r = only([UTIL, GEN], onlyGeneral);
  assert.deepEqual(r.good.map((g) => g.route), ["general"]);
  assert.deepEqual(r.rejects.map((x) => [x.line, x.code]), [[2, "notAllowed"]]);
  const nothing = only([UTIL, GEN], { mayFile: () => false });
  assert.equal(nothing.good.length, 0);
  assert.equal(nothing.rejects.length, 2);
});

test("filename: one match is joined, none is reported, many is reported and never picked", () => {
  assert.equal(only(["general,Other,,,5,2026-01-02,,IMG_0413.jpg"]).good[0].photoId, "ph-2");
  assert.deepEqual(codes(["general,Other,,,5,2026-01-02,,IMG_9999.jpg"]), ["photoNone"]);
  assert.deepEqual(codes(["general,Other,,,5,2026-01-02,,img_0413.jpg"]), ["photoNone"], "exact, case included");
  assert.deepEqual(codes(["general,Other,,,5,2026-01-02,,IMG_0001.jpg"]), ["photoMany"]);
});

test("filename: empty is still a good bill, without a photo", () => {
  const r = only(["general,Other,,,5,2026-01-02,,"]);
  assert.equal(r.good[0].photoId, null);
});

test("filename: two rows cannot claim one photo", () => {
  const r = only(["general,Other,,,5,2026-01-02,,IMG_0413.jpg", "general,Other,,,6,2026-01-03,,IMG_0413.jpg"]);
  assert.equal(r.good.length, 1);
  assert.deepEqual(r.rejects.map((x) => [x.line, x.code, x.detail]), [[3, "photoUsedAbove", "IMG_0413.jpg|2"]]);
});

test("a row with the wrong number of cells is rejected, not guessed at", () => {
  assert.deepEqual(codes(["general,Other,5"]), ["wrongCellCount"]);
});

test("a rejected row keeps its own cells for the rejects file", () => {
  const r = only(["general,Nonsense,,,5,2026-01-02,,"]);
  assert.equal(r.rejects[0].cells[1], "Nonsense");
  assert.equal(r.rejects[0].line, 2);
});

test("the CSV reader: quotes, commas, doubled quotes, line breaks, blank lines", () => {
  assert.deepEqual(parseCsv('a,"b,c","d ""e"" f"\r\n\r\n"x\ny",,z\n').rows, [["a", "b,c", 'd "e" f'], ["x\ny", "", "z"]]);
  assert.deepEqual(parseCsv("a,b").rows, [["a", "b"]]);
  assert.deepEqual(parseCsv("a,\n").rows, [["a", ""]]);
});

test("what the app writes, the reader reads back (the template round trip)", () => {
  const rows = templateRows({ kinds, places });
  const back = parseCsv(toCsv(rows));
  assert.deepEqual(back.rows, rows);
  assert.deepEqual(rows[0], [...BILL_IMPORT_COLUMNS]);
});

test("decode: a BOM is stripped and the text is untouched", () => {
  const r = decodeUtf8Csv(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]));
  assert.deepEqual(r, { ok: true, text: "a" });
});
