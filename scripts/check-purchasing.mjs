// Checks the Purchasing sum (src/lib/management/purchasing.ts) and the
// shared expected-stock helper (stock.ts) — the real exported functions, not
// a copy — against fixed instants.
//
//   node scripts/check-purchasing.mjs
//
// No database, no env. Exits 0 when every case holds.
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const src = pathToFileURL(join(process.cwd(), "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const load = (p) => import(pathToFileURL(join(process.cwd(), p)).href);
const P = await load("src/lib/management/purchasing.ts");
const S = await load("src/lib/management/stock.ts");
const { csvField, toCsv } = await load("src/lib/csv.ts");

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};
const at = (iso) => Date.parse(iso);
// "now" = 2026-10-02 10:00 Thai (03:00Z)
const now = at("2026-10-02T03:00:00Z");

// ---- expectedStockNow / readStock: deliveries are in the sum ----------------
// 1/day (30 in the 30-day window), counted 10 days ago.
const e1 = S.expectedStockNow(50, "2026-09-22T03:00:00Z", 1, 0, now);
eq("expected: 50 − 10 used", [e1.countedDaysAgo, e1.usedSince, e1.receivedSince, e1.expected], [10, 10, 0, 40]);
const e2 = S.expectedStockNow(50, "2026-09-22T03:00:00Z", 1, 20, now);
eq("expected: + 20 received", e2.expected, 60);
eq("expected: counted today, nothing used", S.expectedStockNow(7, "2026-10-02T01:00:00Z", 5, 0, now).expected, 7);
eq("expected: used up goes negative (raw)", S.expectedStockNow(5, "2026-09-22T03:00:00Z", 1, 0, now).expected, -5);
eq("expected: negative receipts ignored", S.expectedStockNow(5, "2026-10-02T03:00:00Z", 0, -3, now).expected, 5);

const fig = (stock, counted) => ({ stock_on_hand: stock, stock_counted_at: counted, reorder_lead_days: null });
eq(
  "days of stock: 20 left − 10 used = 10 days",
  S.readStock(fig(20, "2026-09-22T03:00:00Z"), 30, now).daysLeft,
  10,
);
eq(
  "days of stock: a delivery since the count adds days (was wrong before 2026-10-02)",
  S.readStock(fig(20, "2026-09-22T03:00:00Z"), 30, now, 15).daysLeft,
  25,
);
eq(
  "days of stock: used up on paper, then a delivery: not runDown",
  S.readStock(fig(5, "2026-09-22T03:00:00Z"), 30, now, 20).state,
  "days",
);
eq(
  "days of stock: counted 0, a delivery since: not out",
  S.readStock(fig(0, "2026-10-01T03:00:00Z"), 30, now, 30).state,
  "days",
);
eq("days of stock: counted 0, nothing since: still out", S.readStock(fig(0, "2026-10-01T03:00:00Z"), 30, now).state, "out");

// ---- parse + resolve safety stock: null is not zero --------------------------
eq("safety blank -> null (no floor)", S.parseSafetyStock("  "), { ok: true, value: null });
eq("safety 0 -> 0 (a floor of nothing)", S.parseSafetyStock("0"), { ok: true, value: 0 });
eq("safety -1 refused", S.parseSafetyStock("-1").ok, false);
const bag = { id: "c1", unit: "bag", basePer: 200, isPurchase: true, isCount: false, note: null };
eq("safety in base unit", P.resolveSafetyStock("50", "", [bag], ["cup"]), { ok: true, value: 50 });
eq("safety 2 bags -> 400 base", P.resolveSafetyStock("2", "bag", [bag], ["cup"]), { ok: true, value: 400 });
eq("safety 0 bags -> 0, not null", P.resolveSafetyStock("0", "bag", [bag], ["cup"]), { ok: true, value: 0 });
eq("safety blank in bags -> null", P.resolveSafetyStock("", "bag", [bag], ["cup"]), { ok: true, value: null });
eq("safety unknown unit refused", P.resolveSafetyStock("2", "sack", [bag], ["cup"]), { ok: false, reason: "unknownUnit" });

// ---- the sum ----------------------------------------------------------------
const base = {
  id: "i1",
  name: "Kibble",
  counted: 480,
  countedAt: "2026-09-27T03:00:00Z", // 5 days ago
  usedInRateWindow: 300, // 10 cups/day
  usedInWindow: 140, // 14 days
  windowDays: 14,
  receivedSince: 0,
  safetyStock: null,
  packBase: null,
};
// 480 − 5×10 = 430 expected; need 140; 430 ≥ 140 -> buy nothing
let r = P.purchaseRow(base, now);
eq("plenty on the shelf: buy 0, never negative", [r.expected, r.needed, r.shortfall, r.buy], [430, 140, 0, 0]);

// Worked example: a kibble that runs short. 200 counted 5 days ago at 10/day
// -> 150 now; 2 weeks need 140 + 100 safety = 240; shortfall 90; pack = a 200-cup bag
r = P.purchaseRow({ ...base, counted: 200, safetyStock: 100, packBase: 200 }, now);
eq("worked example: expected 150", r.expected, 150);
eq("worked example: needed 140 + 100 = 240", r.needed, 240);
eq("worked example: shortfall 90 -> one 200-cup bag", [r.shortfall, r.packs, r.buy], [90, 1, 200]);

r = P.purchaseRow({ ...base, counted: 200, safetyStock: 600, packBase: 200 }, now);
eq("worked example: shortfall 590 -> 3 bags (rounded up)", [r.shortfall, r.packs, r.buy], [590, 3, 600]);
r = P.purchaseRow({ ...base, counted: 200, safetyStock: 650, packBase: 200 }, now);
eq("exact multiple of a pack does not round up an extra one", [r.shortfall, r.packs], [640, 4]);

r = P.purchaseRow({ ...base, counted: 200, safetyStock: 100 }, now);
eq("no pack known: buy the shortfall as is", [r.packs, r.buy], [null, 90]);

// receipts since the count reduce what to buy
r = P.purchaseRow({ ...base, counted: 200, safetyStock: 100, packBase: 200, receivedSince: 100 }, now);
eq("a delivery since the count: shortfall 90 − 100 -> 0", [r.expected, r.shortfall, r.buy], [250, 0, 0]);

// used up on paper: the shelf holds 0, not a negative number
r = P.purchaseRow({ ...base, counted: 20, usedInWindow: 70, windowDays: 7 }, now);
eq("used up since the count: expected raw −30, shortfall from 0", [r.expected, r.shortfall, r.buy], [-30, 70, 70]);

// safety stock: zero and null both add nothing
const noFloor = P.purchaseRow({ ...base, counted: 100, safetyStock: null }, now).needed;
const zeroFloor = P.purchaseRow({ ...base, counted: 100, safetyStock: 0 }, now).needed;
eq("safety null and 0 add the same (nothing)", [noFloor, zeroFloor], [140, 140]);

// safety stock on an item nothing is prescribed for still gets bought up to the floor
r = P.purchaseRow({ ...base, counted: 30, usedInRateWindow: 0, usedInWindow: 0, safetyStock: 100, packBase: 50 }, now);
eq("always-in-use item, no use scheduled: buy up to the floor", [r.needed, r.shortfall, r.packs], [100, 70, 2]);

// never counted: flagged, and assumed to have nothing on the shelf (2026-10-04)
r = P.purchaseRow({ ...base, counted: null, countedAt: null, safetyStock: 100 }, now);
eq("never counted: flagged, assumed none on the shelf, whole need bought", [r.state, r.expected, r.shortfall, r.buy], ["notCounted", null, 240, 240]);
r = P.purchaseRow({ ...base, counted: null, countedAt: null, safetyStock: 100, packBase: 50 }, now);
eq("never counted: rounds up to whole packs", [r.packs, r.buy], [5, 250]);
r = P.purchaseRow({ ...base, counted: null, countedAt: null, usedInWindow: 0, safetyStock: null }, now);
eq("never counted and nothing needed: nothing to buy", [r.state, r.buy], ["notCounted", 0]);
r = P.purchaseRow({ ...base, counted: null, countedAt: null, safetyStock: 100 }, now);
eq("never counted: still says what the period needs", r.needed, 240);
r = P.purchaseRow({ ...base, counted: 0, countedAt: "2026-10-01T03:00:00Z" }, now);
eq("counted as 0 is a count, not 'never counted'", [r.state, r.counted], ["ok", 0]);

// stale: more than 21 days
eq("stale at 21 days: no", P.purchaseRow({ ...base, countedAt: "2026-09-11T03:00:00Z" }, now).stale, false);
eq("stale at 22 days: yes", P.purchaseRow({ ...base, countedAt: "2026-09-10T03:00:00Z" }, now).stale, true);

// ---- period, lead time ------------------------------------------------------
eq("period default", P.parsePeriod(undefined), 7);
eq("period 14", P.parsePeriod("14"), 14);
eq("period junk falls back", P.parsePeriod("99"), 7);
eq("lead on by default", P.parseIncludeLead(undefined), true);
eq("lead=off", P.parseIncludeLead("off"), false);
eq("window: period + lead", P.windowDaysFor(14, 7, true), 21);
eq("window: lead off", P.windowDaysFor(14, 7, false), 14);
eq("window: no lead set", P.windowDaysFor(14, null, true), 14);

// ---- receipts ---------------------------------------------------------------
const receipts = [
  { item_id: "a", quantity: 10, received_at: "2026-09-20T05:00:00Z", supplier_contact_id: "s1" },
  { item_id: "a", quantity: 5, received_at: "2026-09-25T05:00:00Z", supplier_contact_id: "s2" },
  { item_id: "a", quantity: 7, received_at: "2026-09-30T05:00:00Z", supplier_contact_id: null },
  { item_id: "b", quantity: 4, received_at: "2026-09-30T05:00:00Z", supplier_contact_id: "s1" },
];
const since = P.receivedSinceCount(
  receipts,
  new Map([
    ["a", "2026-09-22T00:00:00Z"],
    ["b", null],
  ]),
);
eq("receipts: only after the count; never-counted item has none", [since.get("a"), since.has("b")], [12, false]);
eq("receipt at the count instant belongs to the earlier interval", P.receivedSinceCount(receipts, new Map([["a", "2026-09-25T05:00:00Z"]])).get("a"), 7);
const usual = P.usualSuppliers(receipts);
eq("usual supplier: most recent receipt that named one", [usual.get("a"), usual.get("b")], ["s2", "s1"]);

// ---- shopping list grouped by supplier, and the CSV --------------------------
const line = (name, supplier, kind = "medication") => ({
  kind,
  name,
  quantity: 1,
  unit: "box",
  baseQuantity: 10,
  baseUnit: "tablet",
  supplier,
});
const groups = P.groupBySupplier([
  line("Amox", "Vet Wholesale"),
  line("Fluids", null),
  line("Kibble", "Agro Supply", "diet"),
  line("Meloxicam", "Vet Wholesale"),
]);
eq(
  "grouped by supplier A–Z, no-supplier last",
  groups.map((g) => [g.supplier, g.lines.map((l) => l.name)]),
  [
    ["Agro Supply", ["Kibble"]],
    ["Vet Wholesale", ["Amox", "Meloxicam"]],
    [null, ["Fluids"]],
  ],
);
eq("csv: a leading = is neutralised, a number is not", [csvField("=SUM(A1)"), csvField("-12.5")], ["'=SUM(A1)", "-12.5"]);
eq("csv: a name with a comma is quoted", toCsv([["A, B", "x"]]), '"A, B",x\r\n');

console.log(fails ? `${fails} FAILED` : "all passed");
process.exitCode = fails ? 1 : 0;
