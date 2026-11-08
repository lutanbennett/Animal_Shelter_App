"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { contactAddressFields } from "@/lib/contacts/contacts";
import { mapLinkLeadsSomewhere } from "@/lib/contacts/map-preview";
import { insertSupplier } from "@/lib/suppliers/create";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Writes to suppliers (0335, 0338). Every action here asks suppliers.directory at edit, the activity the table's own
 * policies ask, and the screen draws each control only when the login holds it. There is no delete: suppliers are
 * archived, because a delivery can name one (stock_receipts_cost_only, 0235, refuses to null it out).
 */

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const refuse = (error: string) => ({ ok: false as const, error });

export type SupplierFormState = ActionResult<{ success: string; name?: string }> | undefined;

export type SupplierFields = {
  name: string;
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

function revalidateSupplierPages(id?: string) {
  revalidatePath("/management/suppliers");
  if (id) revalidatePath(`/suppliers/${id}`);
  // The delivery forms offer live suppliers, the purchasing list and the Shelter Friends order name them.
  revalidatePath("/deliveries");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/shelter-friends");
}

export async function createSupplier(_state: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("suppliers.createSupplier", write(t), { id: writeRequestIdFrom(formData), action: "suppliers.createSupplier", db: supabase }, async () => {
    if (!can(await loadPermissions(), "suppliers.directory", "edit")) return refuse(t.management.errors.managementAccessRequired);
    const text = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : null;
    };
    const created = await insertSupplier(supabase, t, {
      name: text("name"),
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

    revalidateSupplierPages();
    return { ok: true, success: t.management.suppliers.createdSupplier(created.name), name: created.name };
  });
}

export async function updateSupplier(id: string, fields: SupplierFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("suppliers.updateSupplier", write(t), { id: requestId, action: "suppliers.updateSupplier", db: supabase }, async () => {
    if (!can(await loadPermissions(), "suppliers.directory", "edit")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(fields.name);
    if (!name) return refuse(t.management.suppliers.errors.nameRequired);
    const place = contactAddressFields(fields.address, fields.mapUrl);
    if (!place.ok) return refuse(t.management.contacts.errors[place.error]);

    // A new or changed Map link must lead to a place; one already saved is left alone, so fixing a phone number never
    // stalls on an old link (as for contacts).
    if (place.map_url) {
      const { data: current, error: currentError } = await supabase
        .from("suppliers")
        .select("map_url")
        .eq("id", id)
        .limit(1)
        .returns<{ map_url: string | null }[]>();
      if (currentError) return refuse(currentError.message);
      if (current?.[0]?.map_url !== place.map_url && !(await mapLinkLeadsSomewhere(place.map_url))) {
        return refuse(t.management.contacts.errors.mapUrlDead);
      }
    }

    const { data, error } = await supabase
      .from("suppliers")
      .update({
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
      .eq("id", id)
      .select("id");
    if (error) return refuse(error.message);
    // An update that matches nothing (RLS, or a supplier gone) is not an error to PostgREST.
    if (!data?.length) return refuse(t.management.suppliers.errors.notFound);
    revalidateSupplierPages(id);
    return { ok: true };
  });
}

/**
 * Archives a supplier: kept, with every delivery naming it, but out of the delivery forms' pickers. The way to "remove"
 * one: there is no delete. Only a live row is archived, so a second click cannot overwrite who archived it and when.
 */
export async function archiveSupplier(id: string, reason: string | null, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("suppliers.archiveSupplier", write(t), { id: requestId, action: "suppliers.archiveSupplier", db: supabase }, async () => {
    if (!can(await loadPermissions(), "suppliers.directory", "edit")) return refuse(t.management.errors.managementAccessRequired);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("suppliers")
      .update({ archived_at: new Date().toISOString(), archived_by: user?.id ?? null, archive_reason: optional(reason) })
      .eq("id", id)
      .is("archived_at", null)
      .select("id");
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.management.suppliers.archive.alreadyArchived);
    revalidateSupplierPages(id);
    return { ok: true };
  });
}

/** Restores an archived supplier. The three archive columns clear together, as for contacts. */
export async function restoreSupplier(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("suppliers.restoreSupplier", write(t), { id: requestId, action: "suppliers.restoreSupplier", db: supabase }, async () => {
    if (!can(await loadPermissions(), "suppliers.directory", "edit")) return refuse(t.management.errors.managementAccessRequired);
    const { data, error } = await supabase
      .from("suppliers")
      .update({ archived_at: null, archived_by: null, archive_reason: null })
      .eq("id", id)
      .not("archived_at", "is", null)
      .select("id");
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.management.suppliers.archive.notArchived);
    revalidateSupplierPages(id);
    return { ok: true };
  });
}
