import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTagField, tagsPresentIn, TAGS_FIELD_SUFFIX } from "./text";

/**
 * Writes the links for one note, in the same save as the note itself (resident_note_tags, 0299). Call it right after
 * the note row is written, with the row's id.
 *
 * - Links for tags still in the text are added; links whose "#name" was edited out are DELETED (nothing else cleans
 *   up: no foreign key can cascade across the eleven note tables).
 * - If the form did not carry the tags field at all, nothing is touched. That is the login whose cards do not let
 *   it tag: the control was not drawn, so its save must not wipe links somebody else made.
 * - Whether the login may write a link is decided by the database policy, not here (42501 comes back as a refusal).
 */
export type NoteTagResult = { ok: true } | { ok: false; code: string | null };

type NoteRef = { table: string; column: string; rowId: string; residentId: string };

export async function syncNoteTags(
  supabase: SupabaseClient,
  note: NoteRef,
  formData: FormData,
  fieldName: string,
  text: string | null,
): Promise<NoteTagResult> {
  const raw = formData.get(fieldName + TAGS_FIELD_SUFFIX);
  if (raw === null) return { ok: true };
  const keep = tagsPresentIn(text, parseTagField(raw)).filter((tag) => tag.id !== note.residentId);

  const { data: existing, error: readError } = await supabase
    .from("resident_note_tags")
    .select("id, to_resident_id")
    .eq("source_table", note.table)
    .eq("source_column", note.column)
    .eq("source_row_id", note.rowId)
    .returns<{ id: string; to_resident_id: string }[]>();
  if (readError) return { ok: false, code: readError.code ?? null };

  const keepIds = new Set(keep.map((tag) => tag.id));
  const have = new Set((existing ?? []).map((row) => row.to_resident_id));

  const removeIds = (existing ?? []).filter((row) => !keepIds.has(row.to_resident_id)).map((row) => row.id);
  if (removeIds.length > 0) {
    const { error } = await supabase.from("resident_note_tags").delete().in("id", removeIds);
    if (error) return { ok: false, code: error.code ?? null };
  }

  const add = keep.filter((tag) => !have.has(tag.id));
  if (add.length > 0) {
    const { error } = await supabase.from("resident_note_tags").insert(
      add.map((tag) => ({
        source_table: note.table,
        source_column: note.column,
        source_row_id: note.rowId,
        from_resident_id: note.residentId,
        to_resident_id: tag.id,
      })),
    );
    if (error) return { ok: false, code: error.code ?? null };
  }
  // A note brought back from the archive: its links come back too.
  return { ok: true };
}

/** Archiving a note archives its links (and restoring it restores them): the Mentioned in list hides archived ones. */
export async function setNoteTagsArchived(
  supabase: SupabaseClient,
  table: string,
  rowIds: readonly string[],
  archived: boolean,
): Promise<NoteTagResult> {
  if (rowIds.length === 0) return { ok: true };
  const { error } = await supabase
    .from("resident_note_tags")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("source_table", table)
    .in("source_row_id", rowIds as string[]);
  return error ? { ok: false, code: error.code ?? null } : { ok: true };
}

/** The words for a failed link write: the note itself WAS saved, so say that. Null when it worked. */
export function noteTagFailure(
  result: NoteTagResult,
  words: { couldntSave: string; notAllowed: string },
): string | null {
  if (result.ok) return null;
  return result.code === "42501" ? words.notAllowed : words.couldntSave;
}

/** syncNoteTags + noteTagFailure in one: null when the links are in step with the note, else words for the person. */
export async function syncNoteTagsOrMessage(
  supabase: SupabaseClient,
  note: NoteRef,
  formData: FormData,
  fieldName: string,
  text: string | null,
  words: { couldntSave: string; notAllowed: string },
): Promise<string | null> {
  return noteTagFailure(await syncNoteTags(supabase, note, formData, fieldName, text), words);
}

/** The picks already stored on one note, for handing back to its edit box. */
export async function loadTagsForNote(
  supabase: SupabaseClient,
  table: string,
  column: string,
  rowId: string,
): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from("resident_note_tags")
    .select("to_resident_id, to:residents!resident_note_tags_to_resident_id_fkey(name)")
    .eq("source_table", table)
    .eq("source_column", column)
    .eq("source_row_id", rowId)
    .is("archived_at", null)
    .returns<{ to_resident_id: string; to: { name: string } | null }[]>();
  return (data ?? []).filter((r) => r.to).map((r) => ({ id: r.to_resident_id, name: r.to!.name }));
}
