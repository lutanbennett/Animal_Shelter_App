"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { insertContact } from "@/lib/contacts/create";
import {
  CARER_CONTACT_TYPE,
  contactAddressFields,
  isContactType,
  type ContactType,
} from "@/lib/contacts/contacts";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type ContactFormState = ActionResult<{ success: string }> | undefined;

export type ContactFields = {
  name: string;
  type: ContactType;
  phone: string | null;
  email: string | null;
  lineId: string | null;
  messengerId: string | null;
  whatsapp: string | null;
  address: string | null;
  mapUrl: string | null;
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
  const { t } = await getT();
  return runAction("contacts.createContact", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "contacts.directory")) return refuse(t.management.errors.managementAccessRequired);
    const text = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : null;
    };
    const supabase = await createClient();
    const created = await insertContact(supabase, t, {
      name: text("name"),
      type: text("type"),
      phone: text("phone"),
      email: text("email"),
      lineId: text("lineId"),
      messengerId: text("messengerId"),
      whatsapp: text("whatsapp"),
      address: text("address"),
      mapUrl: text("mapUrl"),
      notes: text("notes"),
    });
    if (!created.ok) return refuse(created.error);

    revalidateContactPages();
    return { ok: true, success: t.management.contacts.createdContact(created.name) };
  });
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

export async function updateContact(id: string, fields: ContactFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("contacts.updateContact", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "contacts.directory")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(fields.name);
    if (!name) return refuse(t.management.contacts.errors.nameRequired);
    if (!isContactType(fields.type)) {
      return refuse(t.management.contacts.errors.invalidType);
    }
    const place = contactAddressFields(fields.address, fields.mapUrl);
    if (!place.ok) return refuse(t.management.contacts.errors[place.error]);

    const supabase = await createClient();

    // The database only checks the carer type when a placement is written
    // (placement_history_check_carer_type), so a carer with history could
    // otherwise be quietly turned into a Volunteer and leave those rows
    // pointing at a non-carer. Keep the invariant from this side too.
    if (fields.type !== CARER_CONTACT_TYPE) {
      const placements = await countPlacements(supabase, id);
      if (placements > 0) {
        return refuse(t.management.contacts.errors.typeLockedByPlacements(placements));
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
        address: place.address,
        map_url: place.map_url,
        notes: optional(fields.notes),
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateContactPages(id);
    return { ok: true };
  });
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
export async function archiveContact(id: string, reason: string | null): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("contacts.archiveContact", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "contacts.directory")) return refuse(t.management.errors.managementAccessRequired);
    const a = t.contacts.archive;

    const supabase = await createClient();

    const { count: inCare, error: inCareError } = await supabase
      .from("placement_history")
      .select("id", { count: "exact", head: true })
      .eq("carer_id", id)
      .is("end_date", null);
    if (inCareError) return refuse(inCareError.message);
    if ((inCare ?? 0) > 0) return refuse(a.errors.hasResidentsInCare(inCare ?? 0));

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

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(a.errors.alreadyArchived);
    revalidateContactPages(id);
    return { ok: true };
  });
}

/**
 * Restores an archived contact. All three archive columns clear in the one
 * update: contacts_archive_fields_consistent (0075) only lets who and why
 * exist while archived_at is set, so clearing archived_at alone is
 * rejected by the database.
 */
export async function restoreContact(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("contacts.restoreContact", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "contacts.directory")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .update({ archived_at: null, archived_by: null, archive_reason: null })
      .eq("id", id)
      .not("archived_at", "is", null)
      .select("id");

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.contacts.archive.errors.notArchived);
    revalidateContactPages(id);
    return { ok: true };
  });
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("contacts.deleteContact", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "contacts.directory")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    // placement_history.carer_id doesn't cascade, and it's history worth
    // keeping — say so rather than surfacing the foreign-key error.
    const placements = await countPlacements(supabase, id);
    if (placements > 0) {
      return refuse(t.management.contacts.errors.hasPlacements(placements));
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidateContactPages(id);
    return { ok: true };
  });
}
