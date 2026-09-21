import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactOption = { id: string; name: string; type: string };

/**
 * Every contact, for pickers that aren't restricted to carers — the
 * maintenance form's "Assigned to" offers volunteers, suppliers and
 * carers alike (a fence is as likely to be fixed by a handyman on the
 * supplier list as by a volunteer). Sorted by name.
 */
export async function loadContactOptions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, type")
    .order("name")
    .returns<ContactOption[]>();
  return { contacts: data ?? [], error: error?.message ?? null };
}
