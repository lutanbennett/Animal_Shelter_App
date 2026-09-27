// Checks src/lib/management/stock-receipts.ts â€” the real exported functions,
// not a copy â€” against fixed cases: turning the day a delivery arrived into
// the instant stock_count_intervals (0096) sorts it by, and the form's
// quantity parsing.
//
//   node scripts/check-stock-deliveries.mjs            (local zone)
//   TZ=UTC node scripts/check-stock-deliveries.mjs     (the Workers case)
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
const lib = await import(pathToFileURL(join(process.cwd(), "src/lib/management/stock-receipts.ts")).href);
const { receivedAtFor, sideOfCount, countDaysByItem, parseDeliveryQuantity, packTotal, canRecordDelivery } = lib;

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${ok ? "" : "  want " + JSON.stringify(want)}`);
};

// Thailand is UTC+7. "Now" is 20 Sep 2026, 15:00 at the shelter.
const now = Date.parse("2026-09-20T08:00:00Z");
const count20 = "2026-09-20T02:00:00Z"; // 20 Sep 09:00
const count20b = "2026-09-20T04:30:00Z"; // 20 Sep 11:30, a recount
const count15 = "2026-09-15T03:00:00Z"; // 15 Sep 10:00
const late = "2026-09-14T18:00:00Z"; // 15 Sep 01:00 at the shelter â€” a 15 Sep count
const counts = [count15, count20, count20b];

// --- no count that day ---
eq("today, no count today -> now()", receivedAtFor("2026-09-20", [count15], null, now), { ok: true, value: null });
eq("past day, no count -> midday at the shelter", receivedAtFor("2026-09-18", counts, null, now), { ok: true, value: "2026-09-18T12:00:00+07:00" });
eq("timing ignored when no count", receivedAtFor("2026-09-18", counts, "before", now), { ok: true, value: "2026-09-18T12:00:00+07:00" });
eq("midday is after a 01:00 count the day before", Date.parse("2026-09-14T12:00:00+07:00") < Date.parse(late), true);

// --- a count that day ---
eq("counted that day, no answer -> ask", receivedAtFor("2026-09-15", counts, null, now), { ok: false, reason: "needsTiming" });
eq("before -> the count's own instant (inside the interval it ends)", receivedAtFor("2026-09-15", counts, "before", now), { ok: true, value: "2026-09-15T03:00:00.000Z" });
eq("after -> a second past it (the next interval)", receivedAtFor("2026-09-15", counts, "after", now), { ok: true, value: "2026-09-15T03:00:01.000Z" });
eq("before, two counts that day -> the earliest", receivedAtFor("2026-09-20", counts, "before", now), { ok: true, value: "2026-09-20T02:00:00.000Z" });
eq("after today -> now()", receivedAtFor("2026-09-20", counts, "after", now), { ok: true, value: null });
eq("after, count a moment ago -> a second past it, not now", receivedAtFor("2026-09-20", counts, "after", Date.parse(count20b) + 500), { ok: true, value: "2026-09-20T04:30:01.000Z" });
eq("the shelter day, not the UTC day", receivedAtFor("2026-09-15", [late], null, now), { ok: false, reason: "needsTiming" });
eq("â€¦and not the UTC day before", receivedAtFor("2026-09-14", [late], null, now), { ok: true, value: "2026-09-14T12:00:00+07:00" });

// --- the recent list's tag: which side of that day's count, from the stored instant ---
const iso = (ms) => new Date(ms).toISOString();
eq("side: stored 'before' is before", sideOfCount(receivedAtFor("2026-09-15", counts, "before", now).value, counts), "before");
eq("side: stored 'after' is after", sideOfCount(receivedAtFor("2026-09-15", counts, "after", now).value, counts), "after");
eq("side: same minute, a second apart, still told apart",
  [sideOfCount(iso(Date.parse(count15)), counts), sideOfCount(iso(Date.parse(count15) + 1000), counts)], ["before", "after"]);
eq("side: 'after' today stamped now() is after both counts", sideOfCount(iso(now), counts), "after");
eq("side: between two counts that day", sideOfCount("2026-09-20T03:00:00Z", counts), "between");
eq("side: no count that day -> no tag", sideOfCount("2026-09-18T12:00:00+07:00", counts), null);
eq("side: the shelter day, not the UTC day", sideOfCount("2026-09-14T19:00:00Z", [late]), "after");

// --- refused ---
eq("future day", receivedAtFor("2026-09-21", counts, null, now), { ok: false, reason: "future" });
eq("not a date", receivedAtFor("20/09/2026", counts, null, now), { ok: false, reason: "dateInvalid" });
eq("blank", receivedAtFor("", counts, null, now), { ok: false, reason: "dateInvalid" });

// --- form helpers ---
eq("count days per item, shelter days, once each", countDaysByItem([
  { item_id: "a", counted_at: count20 }, { item_id: "a", counted_at: count20b }, { item_id: "a", counted_at: late }, { item_id: "b", counted_at: count15 },
]), { a: ["2026-09-20", "2026-09-15"], b: ["2026-09-15"] });
eq("quantity 12.5", parseDeliveryQuantity(" 12.5 "), { ok: true, value: 12.5 });
eq("quantity 0 refused", parseDeliveryQuantity("0").ok, false);
eq("quantity negative refused", parseDeliveryQuantity("-3").ok, false);
eq("quantity blank refused", parseDeliveryQuantity("").ok, false);
eq("quantity text refused", parseDeliveryQuantity("ten").ok, false);
eq("2 boxes of 50", packTotal("2", "50"), 100);
eq("3 x 0.1 has no float noise", packTotal("3", "0.1"), 0.3);
eq("pack helper half-filled", packTotal("2", ""), null);
eq("roles", ["admin", "management", "staff", "volunteer", "vet", null].map(canRecordDelivery), [true, true, true, false, false, false]);

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
