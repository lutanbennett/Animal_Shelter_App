import type { SupabaseClient } from "@supabase/supabase-js";
import type { NoteTag } from "./text";
import { appUserName, loadAppUsersById } from "@/lib/auth/app-users";

/** One note: the table, the column and the row. Keys the map below. */
export const noteKey = (table: string, column: string, rowId: string) => `${table}|${column}|${rowId}`;

type LinkRow = {
  source_table: string;
  source_column: string;
  source_row_id: string;
  to_resident_id: string;
  to: { name: string } | null;
};

/**
 * Every live link written on one resident's notes, keyed by note, so each page can show the tagged names as links and
 * hand the existing picks back to the edit box. RLS limits it to the notes the login may read, so a note the login
 * cannot read has no links here either.
 */
export async function loadNoteTags(supabase: SupabaseClient, residentId: string): Promise<Map<string, NoteTag[]>> {
  const { data } = await supabase
    .from("resident_note_tags")
    .select("source_table, source_column, source_row_id, to_resident_id, to:residents!resident_note_tags_to_resident_id_fkey(name)")
    .eq("from_resident_id", residentId)
    .is("archived_at", null)
    .returns<LinkRow[]>();
  const map = new Map<string, NoteTag[]>();
  for (const row of data ?? []) {
    if (!row.to) continue;
    const key = noteKey(row.source_table, row.source_column, row.source_row_id);
    const list = map.get(key) ?? [];
    list.push({ id: row.to_resident_id, name: row.to.name });
    map.set(key, list);
  }
  return map;
}

export type Mention = {
  id: string;
  fromId: string;
  fromName: string;
  label: string;
  text: string;
  when: string;
  by: string | null;
};

type MentionRow = {
  id: string;
  source_table: string;
  source_column: string;
  source_row_id: string;
  from_resident_id: string;
  created_at: string;
  created_by: string | null;
  from: { name: string } | null;
};

/** Source tables whose rows can be archived: a link to an archived note is not listed (a login that cannot edit the note cannot archive its link). */
const ARCHIVABLE = new Set(["weight", "prescriptions", "clinic_visits", "immunization_records", "adoption_updates"]);

/**
 * "Mentioned in" for one resident: the live links pointing at them. The note text is read from its own table, so the
 * note's own policy decides whether it shows (a note the login cannot read is dropped); the link policy has already
 * asked can_read_note_source and resident.record.
 */
export async function loadMentions(
  supabase: SupabaseClient,
  residentId: string,
  labels: ReadonlyMap<string, string>,
): Promise<Mention[]> {
  const { data: links } = await supabase
    .from("resident_note_tags")
    .select("id, source_table, source_column, source_row_id, from_resident_id, created_at, created_by, from:residents!resident_note_tags_from_resident_id_fkey(name)")
    .eq("to_resident_id", residentId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<MentionRow[]>();
  if (!links?.length) return [];

  const groups = new Map<string, { table: string; column: string; ids: string[] }>();
  for (const link of links) {
    const key = `${link.source_table}|${link.source_column}`;
    const g = groups.get(key) ?? { table: link.source_table, column: link.source_column, ids: [] };
    g.ids.push(link.source_row_id);
    groups.set(key, g);
  }
  const texts = new Map<string, string>();
  await Promise.all(
    [...groups.values()].map(async (g) => {
      let q = supabase.from(g.table).select(`id, ${g.column}`).in("id", g.ids);
      if (ARCHIVABLE.has(g.table)) q = q.is("archived_at", null);
      const { data } = await q.returns<Record<string, string | null>[]>();
      for (const row of data ?? []) {
        const text = row[g.column];
        if (typeof text === "string" && text !== "") texts.set(noteKey(g.table, g.column, row.id as string), text);
      }
    }),
  );

  const authorIds = [...new Set(links.map((l) => l.created_by).filter((v): v is string => !!v))];
  const authors = await loadAppUsersById(supabase, authorIds);

  const out: Mention[] = [];
  for (const link of links) {
    const text = texts.get(noteKey(link.source_table, link.source_column, link.source_row_id));
    if (text === undefined || !link.from) continue;
    out.push({
      id: link.id,
      fromId: link.from_resident_id,
      fromName: link.from.name,
      label: labels.get(`${link.source_table}|${link.source_column}`) ?? "",
      text,
      when: link.created_at,
      by: link.created_by && authors.has(link.created_by) ? appUserName(authors.get(link.created_by)) : null,
    });
  }
  return out;
}

/** The registry's labels, read at runtime (resident_note_sources, 0299), keyed table|column. */
export async function loadSourceLabels(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await supabase.from("resident_note_sources").select("source_table, source_column, label").returns<{ source_table: string; source_column: string; label: string }[]>();
  return new Map((data ?? []).map((s) => [`${s.source_table}|${s.source_column}`, s.label]));
}
