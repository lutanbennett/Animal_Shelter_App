/**
 * Draft → cells. Turns a draft file (draft-1.json: the Director's ticks per sheet row) into the
 * `role_permissions` cells each role would hold. Pure and dependency-free so the loader script
 * (scripts/load-role-draft.mjs, which runs this file directly) and the preview pages share one
 * reading: a second draft is a diff of the JSON, not a second implementation.
 */

export type DraftKey = { activity: string; level: "read" | "edit" | "yes" };
export type DraftRow = { row: number; label: string; keys: DraftKey[] };
export type Draft = {
  draft: number;
  rows: DraftRow[];
  roles: Record<string, { label: string; ticks: number[] }>;
  unclear: { role: string; row: number; mark: string; loadedAs: "no" }[];
  implied: { activity: string; level: "read"; whenTicked: number[]; because: string }[];
};

/** 1 = read, 2 = edit / yes, as stored in role_permissions.level. */
export type Cell = {
  activity: string;
  level: 1 | 2;
  /** "tick": she ticked it. "implied": added so a ticked job has the read it starts from. */
  source: "tick" | "implied";
  rows: number[];
  because?: string;
};

/** `kinds` is the catalogue's activity → "level" | "yesno", so a mistyped key or level fails loudly here. */
export function cellsFor(draft: Draft, roleKey: string, kinds: Record<string, "level" | "yesno">): Cell[] {
  const role = draft.roles[roleKey];
  if (!role) throw new Error(`The draft has no role "${roleKey}".`);
  const byRow = new Map(draft.rows.map((r) => [r.row, r]));
  const cells = new Map<string, Cell>();

  for (const n of role.ticks) {
    const row = byRow.get(n);
    if (!row) throw new Error(`${roleKey} ticks row ${n}, which the draft does not have.`);
    if (row.keys.length === 0) throw new Error(`${roleKey} ticks row ${n} (${row.label}), which is not a cell.`);
    for (const k of row.keys) {
      const kind = kinds[k.activity];
      if (!kind) throw new Error(`Row ${n} names "${k.activity}", which is not in the catalogue.`);
      if ((kind === "yesno") !== (k.level === "yes")) {
        throw new Error(`Row ${n}: ${k.activity} is ${kind}, so a tick cannot mean "${k.level}".`);
      }
      const level = k.level === "read" ? 1 : 2;
      const have = cells.get(k.activity);
      if (!have) cells.set(k.activity, { activity: k.activity, level, source: "tick", rows: [n] });
      else {
        have.level = Math.max(have.level, level) as 1 | 2;
        have.rows.push(n);
      }
    }
  }

  for (const imp of draft.implied) {
    const why = imp.whenTicked.filter((n) => role.ticks.includes(n));
    if (why.length === 0) continue;
    const have = cells.get(imp.activity);
    if (have && have.level >= 1) continue;
    cells.set(imp.activity, { activity: imp.activity, level: 1, source: "implied", rows: why, because: imp.because });
  }

  return [...cells.values()].sort((a, b) => a.activity.localeCompare(b.activity));
}
