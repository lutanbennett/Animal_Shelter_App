import type { SupabaseClient } from "@supabase/supabase-js";
import { CARER_CONTACT_TYPE } from "./contacts";

export { CARER_CONTACT_TYPE };

export type CarerOption = {
  id: string;
  name: string;
};

/**
 * Contacts of type Carer for the foster / adopt form's carer picker,
 * sorted by name. Only Carer contacts are offered because
 * placement_history_check_carer_type rejects any other type (0001) — a
 * volunteer or supplier in the same table is never a candidate. Changing
 * someone's type to Carer is done on /management/contacts.
 *
 * Archived carers are left out: placing a new resident with one is refused
 * (rehome.ts) until the contact is restored, which is the point of
 * archiving them.
 *
 * Read through picker_contacts (0170): a name to choose, never the phone,
 * email or address. Staff pick carers but do not read the address book; the
 * picker used to print each carer's phone beside the name, which is how a
 * staff login came to need the whole table.
 */
export async function loadCarerOptions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("picker_contacts")
    .select("id, name")
    .eq("type", CARER_CONTACT_TYPE)
    .is("archived_at", null)
    .order("name")
    .returns<CarerOption[]>();

  return { carers: data ?? [], error: error?.message ?? null };
}
