"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  CARER_CONTACT_TYPE,
  isContactType,
  type ContactType,
} from "@/lib/contacts/contacts";

export type ContactFormState =
  | { error: string }
  | { success: string }
  | undefined;

export type ContactFields = {
  name: string;
  type: ContactType;
  phone: string | null;
  email: string | null;
  lineId: string | null;
  messengerId: string | null;
  whatsapp: string | null;
  address: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function revalidateContactPages(id?: string) {
  revalidatePath("/admin/contacts");
  revalidatePath("/contacts");
  if (id) revalidatePath(`/contacts/${id}`);
}

export async function createContact(
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = optional(formData.get("name"));
  if (!name) return { error: t.admin.contacts.errors.nameRequired };
  const type = formData.get("type");
  if (!isContactType(type)) return { error: t.admin.contacts.errors.invalidType };

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    name,
    type,
    phone: optional(formData.get("phone")),
    email: optional(formData.get("email")),
    line_id: optional(formData.get("lineId")),
    messenger_id: optional(formData.get("messengerId")),
    whatsapp: optional(formData.get("whatsapp")),
    address: optional(formData.get("address")),
  });

  if (error) return { error: error.message };

  revalidateContactPages();
  return { success: t.admin.contacts.createdContact(name) };
}

/** placement_history rows naming this contact as carer, any status. */
async function countPlacements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const { count, error } = await supabase
    .from("placement_history")
    .select("id", { count: "exact", head: true })
    .eq("carer_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function updateContact(id: string, fields: ContactFields) {
  await assertAdminRole();
  const { t } = await getT();

  const name = optional(fields.name);
  if (!name) throw new Error(t.admin.contacts.errors.nameRequired);
  if (!isContactType(fields.type)) {
    throw new Error(t.admin.contacts.errors.invalidType);
  }

  const supabase = await createClient();

  // The database only checks the carer type when a placement is written
  // (placement_history_check_carer_type), so a carer with history could
  // otherwise be quietly turned into a Volunteer and leave those rows
  // pointing at a non-carer. Keep the invariant from this side too.
  if (fields.type !== CARER_CONTACT_TYPE) {
    const placements = await countPlacements(supabase, id);
    if (placements > 0) {
      throw new Error(t.admin.contacts.errors.typeLockedByPlacements(placements));
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      name,
      type: fields.type,
      phone: optional(fields.phone),
      email: optional(fields.email),
      line_id: optional(fields.lineId),
      messenger_id: optional(fields.messengerId),
      whatsapp: optional(fields.whatsapp),
      address: optional(fields.address),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateContactPages(id);
}

export async function deleteContact(id: string) {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();

  // Neither placement_history.carer_id nor maintenance.assigned_to
  // cascades, and both are history worth keeping — say which one is in
  // the way rather than surfacing the foreign-key error.
  const placements = await countPlacements(supabase, id);
  if (placements > 0) {
    throw new Error(t.admin.contacts.errors.hasPlacements(placements));
  }
  const { count: jobs, error: jobsError } = await supabase
    .from("maintenance")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", id);
  if (jobsError) throw new Error(jobsError.message);
  if (jobs && jobs > 0) {
    throw new Error(t.admin.contacts.errors.hasMaintenance(jobs));
  }

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateContactPages(id);
}
