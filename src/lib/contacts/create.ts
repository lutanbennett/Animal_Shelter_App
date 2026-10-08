import type { createClient } from "@/lib/supabase/server";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { contactAddressFields, isContactType } from "@/lib/contacts/contacts";
import { mapLinkLeadsSomewhere } from "@/lib/contacts/map-preview";

/**
 * The one place a contact row is inserted — Management → Contacts' form and
 * the Shelter Friend wizard both come here, so a rule added to one (a
 * required field, a type check) can't be missing from the other. Callers
 * check the role first; this checks only the contact itself.
 */

function optional(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export type NewContact = {
  name: string | null | undefined;
  type: string | null | undefined;
  phone?: string | null;
  email?: string | null;
  lineId?: string | null;
  messengerId?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  notes?: string | null;
};

export async function insertContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  t: Dictionary,
  fields: NewContact,
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const name = optional(fields.name);
  if (!name) return { ok: false, error: t.management.contacts.errors.nameRequired };
  const type = fields.type;
  if (!isContactType(type)) return { ok: false, error: t.management.contacts.errors.invalidType };
  const place = contactAddressFields(fields.address, fields.mapUrl);
  if (!place.ok) return { ok: false, error: t.management.contacts.errors[place.error] };
  if (place.map_url && !(await mapLinkLeadsSomewhere(place.map_url))) {
    return { ok: false, error: t.management.contacts.errors.mapUrlDead };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      name,
      type,
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
