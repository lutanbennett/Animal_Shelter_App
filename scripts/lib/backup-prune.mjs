// Which old backups may be removed. Pure: names in, names out, nothing deleted
// here, so scripts/check-backup-prune.mjs can try it against made-up lists.
//
// These dumps are the shelter's only copy of its data (the free Supabase plan
// keeps none), so every rule below errs toward keeping:
//   - nothing is removed unless THIS run's upload was confirmed;
//   - in age mode the newest MIN_KEPT are kept whatever their age, so a
//     fortnight of failed runs can never leave zero backups;
//   - a name that does not parse as a dump timestamp is never removed.

import { ENCRYPTED_SUFFIX } from "./backup-crypto.mjs";

/** Always kept in age mode, however old. Five: a working week of failed runs still leaves history to restore from. */
export const MIN_KEPT = 5;

/** lannacare-<env>-2026-09-21T0300Z.dump.age -> Date, or null if the name has no timestamp. */
export function dumpTime(name) {
  const m = /-(\d{4})-(\d\d)-(\d\d)T(\d\d)(\d\d)Z\.dump\.age$/.exec(name);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : null;
}

/**
 * @param names every dump name found (any order)
 * @param opts {uploadConfirmed, keep?: newest N to keep (count mode), keepDays?: age in days (age mode), now: Date}
 * @returns {{remove: string[], keep: string[], reason: string}}
 */
export function planPrune(names, { uploadConfirmed, keep, keepDays, now }) {
  const dumps = names.filter((n) => n.endsWith(ENCRYPTED_SUFFIX)).sort((a, b) => b.localeCompare(a));
  const none = (reason) => ({ remove: [], keep: dumps, reason });
  if (uploadConfirmed !== true) return none("this run's upload was not confirmed");
  if (keepDays === undefined && keep === undefined) return none("no retention given");
  if (keep !== undefined && (!Number.isInteger(keep) || keep < 1)) return none("--keep must be a whole number of at least 1");
  if (keepDays !== undefined && !(keepDays >= 1)) return none("--keep-days must be at least 1");

  const floor = keepDays !== undefined ? MIN_KEPT : 1;
  const cutoff = keepDays !== undefined ? now.getTime() - keepDays * 86_400_000 : null;
  const remove = [];
  dumps.forEach((name, i) => {
    if (i < floor) return; // the newest few, whatever their age
    if (keep !== undefined && i < keep) return;
    if (cutoff !== null) {
      const t = dumpTime(name);
      if (t === null || t.getTime() >= cutoff) return; // unreadable name, or young enough
    }
    remove.push(name);
  });
  return { remove, keep: dumps.filter((n) => !remove.includes(n)), reason: "ok" };
}
