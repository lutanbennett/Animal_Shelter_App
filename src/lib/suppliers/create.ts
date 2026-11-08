import type { createClient } from "@/lib/supabase/server";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { contactAddressFields } from "@/lib/contacts/contacts";
import { mapLinkLeadsSomewhere } from "@/lib/contacts/map-preview";

/**
 * The one place a supplier row is inserted (the way lib/contacts/create.ts is for contacts): Management → Suppliers' form
 * and the Shelter Friend wizard's "add a new business" both come here, so a rule added to one cannot be missing from the
 * other. Callers check the activity first (suppliers.directory at edit for the form; friends.manage plus the supplier policy
 * for the wizard); this checks only the supplier itself.
 */

function optional(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export type NewSupplier = {
  name: string | null | undefined;
  phone?: string | null;
  email?: string | null;
  lineId?: string | null;
  messengerId?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  notes?: string | null;
};

export async function insertSupplier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  t: Dictionary,
  fields: NewSupplier,
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const name = optional(fields.name);
  if (!name) return { ok: false, error: t.management.suppliers.errors.nameRequired };
  const place = contactAddressFields(fields.address, fields.mapUrl);
  if (!place.ok) return { ok: false, error: t.management.contacts.errors[place.error] };
  if (place.map_url && !(await mapLinkLeadsSomewhere(place.map_url))) {
    return { ok: false, error: t.management.contacts.errors.mapUrlDead };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name,
      phone: optional(fields.phone),
      email: optional(fields.email),
      line_id: optional(fields.lineId),
      messenger_id: optional(fields.messengerId),
      whatsapp: optional(fields.whatsapp),
      address: place.address,
      map_url: place.map_url,
      notes: optional(fields.notes),
    })
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { ok: false, error: error.message };
  const id = data?.[0]?.id;
  if (!id) return { ok: false, error: t.common.failedToSave };
  return { ok: true, id, name };
}
