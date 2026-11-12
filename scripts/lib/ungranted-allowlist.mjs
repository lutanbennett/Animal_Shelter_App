// The one comparison behind both "which activity can no card grant?" checks, so they cannot disagree about a row again
// (docs/decisions/2026-11-09-activities-grantable-ruling.md):
//
//   scripts/check-ungranted-activities.mjs   grants resolved from cards.ts the way the app does; blocking in CI, every PR
//   activities-grantable (readonly-checks)   grants read from the LIVE card_grants table; run on production by a person
//
// Both hand this a list of gaps ("activity@level" that no card grants, so only Admin passes it) and the catalogue's keys,
// and get back the same verdict against docs/ungranted-activities-allowlist.json:
//   - a gap on adminOnlyOnPurpose is a dated ruling and prints as such;
//   - a gap on foundNotRuled prints as UNRULED every run and does not fail: it is known and waiting on a ruling;
//   - a gap on NEITHER list fails (an activity JOINED the Admin-only set);
//   - a record whose gap is gone fails (an activity LEFT it: a card now grants it, so the record must go);
//   - a record with no reason or date, or naming an activity not in the catalogue, fails.
// Admin is not a finding and is never given cards: it sits outside the card system (can.ts, has_permission()).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ALLOWLIST_PATH = fileURLToPath(new URL("../../docs/ungranted-activities-allowlist.json", import.meta.url));

export function readAllowlist(path = ALLOWLIST_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {string[]} gaps       "activity@level" (level "read" or "edit") that no card grants
 * @param {Iterable<string>} catalogue  every activity key in the catalogue being checked
 * @param {{adminOnlyOnPurpose: object[], foundNotRuled?: object[]}} file  the allow-list
 * @returns {{fails: string[], unruled: string[], ruled: string[], summary: string}}
 */
export function compareToAllowlist(gaps, catalogue, file = readAllowlist()) {
  const allow = file.adminOnlyOnPurpose ?? [];
  const pendingRecs = file.foundNotRuled ?? [];
  const id = (r) => `${r.activity}@${r.level}`;
  const allowed = new Set(allow.map(id));
  const pending = new Set(pendingRecs.map(id));
  const known = new Set(catalogue);
  const seen = new Set(gaps);
  const fails = [];
  const unruled = [];
  const ruled = [];
  const at = (g) => g.replace("@", " at ");

  for (const g of [...seen].sort()) {
    if (allowed.has(g)) {
      const r = allow.find((x) => id(x) === g);
      ruled.push(`${at(g)}: Admin-only on purpose, ruled ${r.ruled} by ${r.by}`);
    } else if (pending.has(g)) {
      // A pending record may already carry a ruling that is only waiting on a build (a card grant, or
      // a catalogue change needing a migration). Printing "no ruling yet" about a decision already
      // given is how the same ruling gets asked for twice: Lutan's answers of 2026-11-09 were given,
      // written only into a backlog note, and still printed here as unruled three days later. The
      // record stays in foundNotRuled on purpose -- the gap is real until the build lands -- so the
      // fix is to say WHICH it is rather than to move it.
      const r = pendingRecs.find((x) => id(x) === g);
      unruled.push(
        r?.ruled && r?.by
          ? `${at(g)}: RULED ${r.ruled} by ${r.by}, waiting on the build — do not re-ask`
          : `${at(g)}: no card grants it, no ruling yet`,
      );
    }
    else fails.push(`${at(g)} is granted by no card (Admin only) and is not on the allow-list`);
  }
  for (const r of [...allow, ...pendingRecs]) {
    if (!(r.reason || r.note) || !/^\d{4}-\d{2}-\d{2}$/.test(r.ruled || r.found || "")) fails.push(`allow-list record ${r.activity} needs a reason and a date`);
    if (!known.has(r.activity)) fails.push(`allow-list names ${r.activity}, which is not in the catalogue: delete the record`);
    else if (!seen.has(id(r))) fails.push(`allow-list names ${r.activity} at ${r.level}, which a card now grants: delete the record`);
  }
  const summary = `${known.size} catalogue activities; ${allow.length} Admin-only on purpose, ${pendingRecs.length} UNRULED`;
  return { fails, unruled, ruled, summary };
}
