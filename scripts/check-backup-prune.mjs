// Offline check of the backup pruning rules (scripts/lib/backup-prune.mjs):
// fabricated file lists, no database, Drive or disk. Run: node scripts/check-backup-prune.mjs
// The point is the floor: no scenario may delete the newest backups or run without a confirmed upload.
import { MIN_KEPT, planPrune } from "./lib/backup-prune.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
};

const NOW = new Date("2026-10-20T03:00:00Z");
const nameAt = (daysAgo) =>
  `lannacare-production-${new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString().replace(/:(\d\d):\d\d\.\d+Z$/, "$1Z")}.dump.age`;
const set = (...days) => days.map(nameAt);
const opts = { uploadConfirmed: true, keepDays: 14, now: NOW };

// Known ages, with a full complement of newer backups so the floor is not what decides.
let p = planPrune(set(0, 1, 2, 3, 4, 13, 15, 30), opts);
check("15 and 30 days old removed", p.remove.length === 2 && p.remove.includes(nameAt(15)) && p.remove.includes(nameAt(30)), p.remove.join());
check("13 days old kept", p.keep.includes(nameAt(13)));
p = planPrune(set(0, 1, 2, 3, 4, 13, 14, 15), opts);
check("exactly 14 days old is kept, 15 removed", p.remove.join() === nameAt(15) && p.keep.includes(nameAt(14)), p.remove.join());

// A fortnight of failures: newest backup is 15 days old, seven dumps all older than the cutoff.
p = planPrune(set(15, 16, 17, 18, 19, 20, 21), opts);
check(`all older than the cutoff: the newest ${MIN_KEPT} survive`, p.keep.length === MIN_KEPT && p.remove.length === 2 && p.keep[0] === nameAt(15), `${p.keep.length} kept`);
p = planPrune(set(15, 16, 17), opts);
check("fewer old dumps than the floor: nothing removed", p.remove.length === 0);
p = planPrune(set(40), opts);
check("a single very old dump is never removed", p.remove.length === 0);
p = planPrune([], opts);
check("empty list removes nothing", p.remove.length === 0);

// Upload not confirmed: nothing removed, however old.
for (const bad of [false, undefined, null, "yes", 1]) {
  p = planPrune(set(0, 20, 30, 40, 50, 60, 70, 80), { ...opts, uploadConfirmed: bad });
  check(`uploadConfirmed=${JSON.stringify(bad)}: nothing removed`, p.remove.length === 0 && p.keep.length === 8);
}

// Bad or missing retention fails safe.
const old = set(0, 99, 100, 101, 102, 103, 104);
check("no retention given: nothing removed", planPrune(old, { uploadConfirmed: true, now: NOW }).remove.length === 0);
check("keepDays 0 refused", planPrune(old, { ...opts, keepDays: 0 }).remove.length === 0);
check("keepDays NaN refused", planPrune(old, { ...opts, keepDays: NaN }).remove.length === 0);
check("keep 0 refused", planPrune(set(0, 1, 2), { uploadConfirmed: true, keep: 0, now: NOW }).remove.length === 0);

// Names that are not dumps, or have no timestamp, are never removed.
p = planPrune([...set(0, 1, 2, 3, 4, 40), "lannacare-production-notes.dump.age", "lannacare-production-2026-01-01T0300Z.dump", "readme.txt"], opts);
check("only the old dated dump is removed", p.remove.join() === nameAt(40), p.remove.join());
p = planPrune([...set(0, 1, 2, 3, 4, 5), "lannacare-production-garbage.dump.age"], opts);
check("an unparseable .dump.age name is kept", p.remove.length === 0, p.remove.join());

// Input order does not matter (Drive lists in any order).
p = planPrune(set(30, 0, 15, 2, 1, 3, 4).reverse(), opts);
check("shuffled input gives the same answer", p.remove.join() === [nameAt(30), nameAt(15)].sort((a, b) => b.localeCompare(a)).join(), p.remove.join());

// Legacy count mode still works and keeps its meaning.
p = planPrune(set(0, 7, 14, 21, 28), { uploadConfirmed: true, keep: 3, now: NOW });
check("--keep 3 keeps the newest three", p.remove.length === 2 && p.keep.length === 3);
p = planPrune(set(0, 7), { uploadConfirmed: true, keep: 3, now: NOW });
check("--keep 3 with two dumps removes nothing", p.remove.length === 0);
p = planPrune(set(0, 7, 14), { uploadConfirmed: false, keep: 1, now: NOW });
check("--keep without a confirmed upload removes nothing", p.remove.length === 0);

// The newest five always survive, over many random lists.
let violations = 0;
for (let i = 0; i < 2000; i++) {
  const n = 1 + Math.floor(Math.random() * 30);
  const names = Array.from({ length: n }, () => nameAt(Math.random() * 90));
  const r = planPrune(names, opts);
  const newest = [...names].sort((a, b) => b.localeCompare(a)).slice(0, Math.min(MIN_KEPT, n));
  if (!newest.every((x) => r.keep.includes(x))) violations++;
}
check("2000 random lists: the newest five always survive", violations === 0, `${violations} violations`);

console.log(failures === 0 ? "\nAll backup-prune checks passed." : `\n${failures} FAILED.`);
process.exit(failures === 0 ? 0 : 1);
