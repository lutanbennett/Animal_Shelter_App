import type { SupabaseClient } from "@supabase/supabase-js";
import { loggedTableNames, NOISE, type AuditEntry, type AuditedTable, type Image } from "@/lib/audit/recent-changes";

/**
 * Which audit entries can be undone, and what an undo writes (backlog DB-6,
 * part 3; docs/decisions/2026-10-02-audit-undo.md has the reasons).
 *
 * An undo is an ordinary write by the signed-in admin through their own
 * client, so RLS applies and the 0121 trigger records it under their login
 * like any edit. There is no database function and no service role.
 */

/** Tables an edit can be undone on. Files are not here: see the decision. */
export const UNDOABLE_EDIT_TABLES: readonly AuditedTable[] = [
  "residents",
  "contacts",
  "prescriptions",
  "clinic_visits",
  "weight",
  "immunization_records",
  // A figure is a typed number and date; putting the old pair back is the
  // same write Settings → Website makes. It has no delete (0156).
  "impact_baselines",
];

/** Tables a hard delete can be undone on, by putting the row back. */
export const UNDOABLE_DELETE_TABLES: readonly AuditedTable[] = [
  "contacts",
  "prescriptions",
  "clinic_visits",
  "weight",
  "immunization_records",
];

/** What the button would do, or the reason it is not offered. */
export type UndoKind =
  | "edit" // write the changed fields back
  | "reinsert" // put a deleted row back
  | "archive" // an archive or restore: the record's own Restore / Archive does it
  | "added" // an insert: nothing to put back
  | "resident" // a deleted resident: lossy and cascading
  | "file" // a file: its Drive copy is in the trash
  | "permissions" // a role or permission: changed only by an app update, so not from a log
  | "facilityMap" // a plan: its own Undo also puts the picture and its history back
  | "elsewhere"; // anything else: not undone here, and nothing more specific to say

export function undoKind(e: Pick<AuditEntry, "table" | "op" | "kind">): UndoKind {
  if (e.op === "INSERT") return "added";
  // Before the archive check: a role has archived_at but no Restore button.
  if (e.table === "roles" || e.table === "role_permissions") return "permissions";
  if (e.table === "facility_maps") return "facilityMap";
  if (e.kind === "archived" || e.kind === "restored") return "archive";
  if (e.table === "attachments") return "file";
  if (e.op === "DELETE") {
    if (e.table === "residents") return "resident";
    return UNDOABLE_DELETE_TABLES.includes(e.table) ? "reinsert" : "elsewhere";
  }
  return UNDOABLE_EDIT_TABLES.includes(e.table) ? "edit" : "elsewhere";
}

/** The newest audit id for each row, so an entry can be checked as the latest. */
export async function newestIdByRow(
  supabase: SupabaseClient,
  entries: Pick<AuditEntry, "table" | "rowId">[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const seen = new Set<string>();
  await Promise.all(
    entries.map(async (e) => {
      const key = `${e.table}:${e.rowId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const { data } = await supabase
        .from("audit_log")
        .select("id")
        .in("table_name", loggedTableNames(e.table))
        .eq("row_id", e.rowId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) out.set(key, data.id as number);
    }),
  );
  return out;
}

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T/;

/**
 * What an edit undo writes (the changed columns, as they were) and what the
 * row must still hold for the write to apply. Only the columns the edit
 * changed are touched: a whole-row write would also stamp over columns the
 * image never held (the microchip fields 0121 leaves out of residents).
 *
 * `expect` is a race guard between the "is this the latest change" check and
 * the write: plain scalars only. Timestamps and json are left out because
 * the way PostgREST parses them for a comparison is not worth a false
 * "changed since" on every undo that touches one; the latest-change check
 * already covers them.
 */
export function editPlan(oldRow: Image, newRow: Image, changed: string[]) {
  const set: Record<string, unknown> = {};
  const expect: Record<string, string | number | boolean | null> = {};
  for (const col of changed) {
    if (NOISE.has(col)) continue;
    set[col] = oldRow?.[col] ?? null;
    const now = newRow?.[col] ?? null;
    if (
      now === null ||
      typeof now === "number" ||
      typeof now === "boolean" ||
      (typeof now === "string" && !TIMESTAMP.test(now))
    ) {
      expect[col] = now;
    }
  }
  return { set, expect };
}
