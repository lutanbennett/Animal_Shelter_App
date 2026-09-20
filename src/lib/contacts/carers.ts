import type { SupabaseClient } from "@supabase/supabase-js";

/** contacts.type value for people who foster or adopt residents. */
export const CARER_CONTACT_TYPE = "Carer";

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
 * placement_history_check_carer_type rejects any other type (0001).
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
