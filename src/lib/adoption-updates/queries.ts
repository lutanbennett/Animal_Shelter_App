import type { SupabaseClient } from "@supabase/supabase-js";

export type SenderOptions = {
  /** Carers of the resident's Adopt placements, newest adoption first. */
  adopters: { id: string; name: string }[];
  /** Every other contact that isn't archived, by name. */
  otherContacts: { id: string; name: string }[];
  /** The newest Adopt placement's carer: what a new update preselects. */
  defaultSenderId: string | null;
  /** How many Adopt placements the resident has had; 0 = never adopted. */
  adoptionCount: number;
};

/**
 * Who could have sent an update. The adopter is preselected from the
 * newest Adopt placement's carer_id, but any contact can be chosen — a
 * partner or a grown child often sends the photos — and what is saved is
 * adoption_updates.sender_contact_id, not a pointer through the placement
 * (0097). An archived adopter still heads the list: they adopted this
 * animal, and news from them is still news.
 */
export async function loadSenderOptions(
  supabase: SupabaseClient,
  residentId: string,
): Promise<SenderOptions> {
  const [adoptions, contacts] = await Promise.all([
    supabase
      .from("placement_history")
      .select("carer_id, carer:contacts(id, name)")
      .eq("resident_id", residentId)
      .eq("placement_type", "Adopt")
      .order("start_date", { ascending: false })
      .returns<{ carer_id: string | null; carer: { id: string; name: string } | null }[]>(),
    supabase
      .from("contacts")
      .select("id, name")
      .is("archived_at", null)
      .order("name")
      .returns<{ id: string; name: string }[]>(),
  ]);
  if (adoptions.error) throw new Error(adoptions.error.message);
  if (contacts.error) throw new Error(contacts.error.message);

  const adopters: { id: string; name: string }[] = [];
  for (const row of adoptions.data ?? []) {
    if (row.carer && !adopters.some((c) => c.id === row.carer!.id)) adopters.push(row.carer);
  }
  return {
    adopters,
    otherContacts: (contacts.data ?? []).filter((c) => !adopters.some((a) => a.id === c.id)),
    defaultSenderId: adoptions.data?.[0]?.carer_id ?? null,
    adoptionCount: adoptions.data?.length ?? 0,
  };
}
