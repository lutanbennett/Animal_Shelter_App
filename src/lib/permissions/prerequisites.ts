/**
 * Prerequisites between boxes on Settings → Who does what (docs/roles-and-permissions.md §4 rule 5, §6 rule 9):
 * a box cannot outrank the boxes it depends on. The grid refuses a change that would make a combination the
 * database ignores, and says why, instead of showing a box that silently does not bite.
 * docs/decisions/2026-10-11-who-does-what-edit.md
 *
 * These are stated here and not in catalogue.ts's `requires`, because that field must equal
 * permission_activities.requires (a lint check) and filling it would need a migration. The two rules below
 * are the ones the database already enforces by hand, measured by scripts/check-who-does-what.mjs:
 *   record_stock_correction() (0178) asks stock.correct AND the list's own box at Edit;
 *   record_recurring_job() lets recurring.do_any record any date, your own included.
 *
 * Pure and client-safe: no i18n, no database, and no runtime import (the check script loads this file as it is). The server action, the page and the check script all import it.
 */
import type { ActivityKey } from "./catalogue";

/** A box held at least this far: "read" is Read or Edit, "edit" is Edit (a Yes is held at 2). */
export type Need = { activity: ActivityKey; level: "read" | "edit" };

export type Prerequisite = {
  id: "stockCorrect" | "includedByAny";
  /** The box that depends on the others. */
  activity: ActivityKey;
  /** At least one of these must be held. */
  needsAny: readonly Need[];
};

export const PREREQUISITES: readonly Prerequisite[] = [
  {
    id: "stockCorrect",
    activity: "stock.correct",
    needsAny: [
      { activity: "stock.medications", level: "edit" },
      { activity: "stock.diets", level: "edit" },
    ],
  },
  {
    id: "includedByAny",
    activity: "recurring.do_any",
    needsAny: [{ activity: "recurring.do_own", level: "edit" }],
  },
];

/** The cells of one role: activity → stored level (0 or absent = None, 1 = Read, 2 = Edit / Yes). */
export type Cells = (activity: string) => number;

const held = (cells: Cells, n: Need) => cells(n.activity) >= (n.level === "edit" ? 2 : 1);

/** Does the role hold this box at all? */
const holds = (cells: Cells, activity: string) => cells(activity) >= 1;

/** Rules whose dependent box this role holds but whose prerequisites it does not: a combination to refuse. */
export function unmetFor(cells: Cells, activity: string): Prerequisite[] {
  return PREREQUISITES.filter((p) => p.activity === activity && holds(cells, activity) && !p.needsAny.some((n) => held(cells, n)));
}

export type Refusal =
  | { ok: true }
  | { ok: false; kind: "needs"; rule: Prerequisite }
  | { ok: false; kind: "neededBy"; rule: Prerequisite };

/**
 * Would setting `activity` to `level` make a role's cells incoherent? Only rules the change touches are
 * judged, so a combination that already exists elsewhere in the column never blocks an unrelated change,
 * and taking a dependent box away is always allowed (it is the way out of an unmet rule).
 */
export function checkChange(cells: Cells, activity: string, level: number): Refusal {
  const after: Cells = (a) => (a === activity ? level : cells(a));
  for (const p of PREREQUISITES) {
    if (p.activity === activity && level >= 1 && !p.needsAny.some((n) => held(after, n))) return { ok: false, kind: "needs", rule: p };
    // Lowering a prerequisite while the dependent is held and nothing else satisfies it.
    if (p.needsAny.some((n) => n.activity === activity) && holds(after, p.activity) && !p.needsAny.some((n) => held(after, n)))
      return { ok: false, kind: "neededBy", rule: p };
  }
  return { ok: true };
}

/**
 * Whether the check script can account for a wrong or sticky box by these rules. WRONG: the dependent is
 * held without its prerequisites (the database refuses, the box says yes). STICKY: the box is a
 * prerequisite the role's dependent leans on, so taking it away would not stop the act.
 */
export function explainedByPrerequisite(cells: Cells, activity: string): boolean {
  return (
    PREREQUISITES.some((p) => p.activity === activity && unmetFor(cells, activity).includes(p)) ||
    PREREQUISITES.some((p) => p.needsAny.some((n) => n.activity === activity) && holds(cells, p.activity))
  );
}
