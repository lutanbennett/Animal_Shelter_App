"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, databaseFailure, type ActionResult } from "@/lib/action-result";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CLOSED_NOTE_KINDS, isClosedNoteKind, type ClosedNoteKind } from "@/lib/closed-record/notes";

const MAX_NOTE = 2000;

/**
 * Adds a note to a row of a resident who has died. 0320 permits an UPDATE that changes only `notes` on these five tables
 * and nothing else, so this sends exactly `{ notes }`, never a whole row. The note is APPENDED after what is already
 * there, never written over it, and the row is matched on the notes it was read with so two people cannot overwrite
 * each other.
 *
 * The activity asked is the one the table's own update policy asks (CLOSED_NOTE_KINDS). The database is the backstop:
 * a refused update matches no row and is reported as not allowed.
 */
export async function addClosedRecordNote(
  kind: ClosedNoteKind,
  residentId: string,
  rowId: string,
  note: string,
  requestId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction(
    "residents.addClosedRecordNote",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: requestId, action: "residents.addClosedRecordNote", db: supabase },
    async () => {
      if (!isClosedNoteKind(kind)) return { ok: false, error: t.common.notAllowed };
      const spec = CLOSED_NOTE_KINDS[kind];
      if (!can(await loadPermissions(), spec.activity)) return { ok: false, error: t.common.notAllowed };
      const text = note.trim();
      if (!text) return { ok: false, error: t.closedRecordNote.errors.empty };
      if (text.length > MAX_NOTE) return { ok: false, error: t.closedRecordNote.errors.tooLong(MAX_NOTE) };

      const { data: state } = await supabase
        .from("resident_current_state")
        .select("is_deceased")
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ is_deceased: boolean }[]>();
      if (!state?.[0]?.is_deceased) return { ok: false, error: t.closedRecordNote.errors.notClosed };

      const { data: current, error: readError } = await supabase
        .from(spec.table)
        .select("notes")
        .eq("id", rowId)
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ notes: string | null }[]>();
      if (readError) return databaseFailure("residents.addClosedRecordNote", readError, t.common);
      if (!current?.[0]) return { ok: false, error: t.common.notAllowed };
      const before = current[0].notes;

      let update = supabase
        .from(spec.table)
        .update({ notes: before ? `${before}\n${text}` : text })
        .eq("id", rowId)
        .eq("resident_id", residentId);
      update = before === null ? update.is("notes", null) : update.eq("notes", before);
      const { data, error } = await update.select("id");
      if (error) return databaseFailure("residents.addClosedRecordNote", error, t.common);
      if (!data?.length) return { ok: false, error: t.closedRecordNote.errors.changed };

      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/${spec.section}`);
      return { ok: true };
    },
  );
}
