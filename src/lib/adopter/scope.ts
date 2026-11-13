import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The adopter login (#l5gxn app half): a signed-in person with NO staff card whose VERIFIED sign-in email matches a live
 * contacts row. Nothing here grants anything by role: the question "may this person send news about this resident" is
 * adopter_may_submit() (0357), asked through the service-role client because an adopter login has no table access to
 * placement_history or contacts (docs/decisions/2026-11-11-adoption-updates-schema.md) and is never given any.
 *
 * Duplicate emails: contacts has no unique email, so one address can match several live rows. Every match is the same
 * verified person, so the scope is the UNION of what adopter_residents() answers for each; each resident is kept with the
 * contact that is its carer, and that contact id is what is stored as sender_contact_id.
 */
/** Where an adopter login lands and works. */
export const ADOPTER_PATH = "/adopter-update";

export type AdopterResident = { residentId: string; contactId: string; name: string; code: string | null; fostered: boolean };

export type AdopterScope = { email: string; residents: AdopterResident[] };

/** The signed-in user's verified email, or null: signed out, or an email the provider has not confirmed. */
export async function verifiedEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.email_confirmed_at) return null;
  return user.email.trim().toLowerCase();
}

export async function loadAdopterScope(supabase: SupabaseClient): Promise<AdopterScope | null> {
  const email = await verifiedEmail(supabase);
  if (!email) return null;
  const admin = createAdminClient();
  const { data: contacts, error } = await admin
    .from("contacts")
    .select("id")
    .ilike("email", email.replace(/[\%_]/g, "\$&"))
    .is("archived_at", null)
    .returns<{ id: string }[]>();
  if (error) throw new Error(error.message);
  const residents: AdopterResident[] = [];
  for (const c of contacts ?? []) {
    const { data: ids, error: scopeError } = await admin.rpc("adopter_residents", { p_contact_id: c.id });
    if (scopeError) throw new Error(scopeError.message);
    for (const rid of (ids ?? []) as string[]) {
      if (residents.some((r) => r.residentId === rid)) continue;
      residents.push({ residentId: rid, contactId: c.id, name: "", code: null, fostered: false });
    }
  }
  if (residents.length === 0) return contacts?.length ? { email, residents } : null;
  const { data: rows, error: nameError } = await admin
    .from("residents")
    .select("id, name, resident_code")
    .in("id", residents.map((r) => r.residentId))
    .returns<{ id: string; name: string; resident_code: string | null }[]>();
  if (nameError) throw new Error(nameError.message);
  const { data: places, error: placeError } = await admin
    .from("placement_history")
    .select("resident_id, carer_id, placement_type")
    .in("resident_id", residents.map((r) => r.residentId))
    .in("carer_id", residents.map((r) => r.contactId))
    .in("placement_type", ["Adopt", "Foster"])
    .is("end_date", null)
    .returns<{ resident_id: string; carer_id: string; placement_type: string }[]>();
  if (placeError) throw new Error(placeError.message);
  for (const r of residents) {
    r.fostered = (places ?? []).some((p) => p.resident_id === r.residentId && p.carer_id === r.contactId && p.placement_type === "Foster");
    const row = rows?.find((x) => x.id === r.residentId);
    r.name = row?.name ?? "";
    r.code = row?.resident_code ?? null;
  }
  return { email, residents };
}
