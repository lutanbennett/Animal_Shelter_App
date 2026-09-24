"use server";

import { revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
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
  notes: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function revalidateContactPages(id?: string) {
  revalidatePath("/management/contacts");
  revalidatePath("/contacts");
  if (id) revalidatePath(`/contacts/${id}`);
  // Housing history names the carer (with the Archived badge), and the
  // foster / adopt form's picker leaves archived carers out.
  revalidatePath("/residents", "layout");
}

export async function createContact(
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await assertManagementRole();
  const { t } = await getT();

  const name = optional(formData.get("name"));
  if (!name) return { error: t.management.contacts.errors.nameRequired };
  const type = formData.get("type");
  if (!isContactType(type)) return { error: t.management.contacts.errors.invalidType };

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
    notes: optional(formData.get("notes")),
  });

  if (error) return { error: error.message };

  revalidateContactPages();
  return { success: t.management.contacts.createdContact(name) };
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
  await assertManagementRole();
  const { t } = await getT();

  const name = optional(fields.name);
  if (!name) throw new Error(t.management.contacts.errors.nameRequired);
  if (!isContactType(fields.type)) {
    throw new Error(t.management.contacts.errors.invalidType);
  }

  const supabase = await createClient();

  // The database only checks the carer type when a placement is written
  // (placement_history_check_carer_type), so a carer with history could
  // otherwise be quietly turned into a Volunteer and leave those rows
  // pointing at a non-carer. Keep the invariant from this side too.
  if (fields.type !== CARER_CONTACT_TYPE) {
    const placements = await countPlacements(supabase, id);
    if (placements > 0) {
      throw new Error(t.management.contacts.errors.typeLockedByPlacements(placements));
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
      notes: optional(fields.notes),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateContactPages(id);
}

/**
 * Archives a contact: kept, with every placement naming them, but out of
 * the default lists and the carer picker. The way to "remove" anyone with
 * history — deleteContact is only for a contact with none.
 *
 * A carer with a resident living with them now can't be archived: the
 * resident's hub, the return form and the rehome form all read that carer
 * as current, and an archived current carer is a contradiction. Return or
 * move the resident first.
 */
export async function archiveContact(id: string, reason: string | null) {
  await assertManagementRole();
  const { t } = await getT();
  const a = t.contacts.archive;

  const supabase = await createClient();

  const { count: inCare, error: inCareError } = await supabase
    .from("placement_history")
    .select("id", { count: "exact", head: true })
    .eq("carer_id", id)
    .is("end_date", null);
  if (inCareError) throw new Error(inCareError.message);
  if ((inCare ?? 0) > 0) throw new Error(a.errors.hasResidentsInCare(inCare ?? 0));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only a live row is archived, so a second click (or a second tab)
  // can't overwrite who archived it and when.
  const { data, error } = await supabase
    .from("contacts")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: user?.id ?? null,
      archive_reason: optional(reason),
    })
    .eq("id", id)
    .is("archived_at", null)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(a.errors.alreadyArchived);
  revalidateContactPages(id);
}

/**
 * Restores an archived contact. All three archive columns clear in the one
 * update: contacts_archive_fields_consistent (0075) only lets who and why
 * exist while archived_at is set, so clearing archived_at alone is
 * rejected by the database.
 */
export async function restoreContact(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({ archived_at: null, archived_by: null, archive_reason: null })
    .eq("id", id)
    .not("archived_at", "is", null)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(t.contacts.archive.errors.notArchived);
  revalidateContactPages(id);
}

export async function deleteContact(id: string) {
  await assertManagementRole();
  const { t } = await getT();

  const supabase = await createClient();

  // placement_history.carer_id doesn't cascade, and it's history worth
  // keeping — say so rather than surfacing the foreign-key error.
  const placements = await countPlacements(supabase, id);
  if (placements > 0) {
    throw new Error(t.management.contacts.errors.hasPlacements(placements));
  }

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateContactPages(id);
}
