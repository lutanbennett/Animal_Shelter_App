import type { SupabaseClient } from "@supabase/supabase-js";
import { CARER_CONTACT_TYPE } from "./contacts";

export { CARER_CONTACT_TYPE };

export type CarerOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  line_id: string | null;
};

/**
 * Contacts of type Carer for the foster / adopt form's carer picker,
 * sorted by name. Only Carer contacts are offered because
 * placement_history_check_carer_type rejects any other type (0001) — a
 * volunteer or supplier in the same table is never a candidate. Changing
 * someone's type to Carer is done on /management/contacts.
 */
export async function loadCarerOptions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone, email, line_id")
    .eq("type", CARER_CONTACT_TYPE)
    .order("name")
    .returns<CarerOption[]>();

  return { carers: data ?? [], error: error?.message ?? null };
}
