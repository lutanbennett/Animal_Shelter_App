import type { createClient } from "@/lib/supabase/server";
import type { Permissions } from "@/lib/permissions/can";
import { loadPickableResidents, residentsEmptyKind, type PickableResident } from "@/lib/medical/residents";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The residents the meme screens offer, read through `resident_who_and_where` (via loadPickableResidents) and not
 * `resident_list_view`: the meme cards carry `resident.who_and_where`, never `resident.record`, so the record-gated view
 * read zero rows for them and the picker was empty (docs/decisions/2026-11-07-meme-resident-picker.md). Deceased and
 * Adopted stay: a meme in a resident's memory is a real case.
 *
 * `emptyKind` says why the list is empty, so the screen never claims the shelter has no animals when the truth is that
 * the login's cards cannot see them: `cannot` when no card lets this login read who residents are, `none` when one does.
 */
export async function loadMemeResidents(
  supabase: Supabase,
  perms: Permissions | null | undefined,
): Promise<{ residents: PickableResident[]; emptyKind: "none" | "cannot" | null }> {
  const { residents, error } = await loadPickableResidents(supabase, { includeInactive: true });
  if (error) console.error("meme screens: resident list failed", error);
  if (residents.length > 0) return { residents, emptyKind: null };
  return { residents, emptyKind: residentsEmptyKind(perms, residents.length, error) };
}
