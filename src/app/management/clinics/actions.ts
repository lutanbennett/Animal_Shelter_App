"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const refuse = (error: string) => ({ ok: false as const, error });

export type ClinicFormState = ActionResult<{ success: string }> | undefined;

export type ClinicFields = {
  name: string;
  /** Optional (0166): most clinic names are proper names and read the same in Thai. */
  nameTh: string | null;
  contactInfo: string | null;
  notes: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function revalidateClinicPages(id?: string) {
  revalidatePath("/management/clinics");
  revalidatePath("/clinics");
  if (id) revalidatePath(`/clinics/${id}`);
}

export async function createClinic(
  _state: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("clinics.createClinic", write(t), { id: writeRequestIdFrom(formData), action: "clinics.createClinic", db: supabase }, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(formData.get("name"));
    if (!name) return refuse(t.management.vets.errors.nameRequired);

    const { error } = await supabase.from("clinics").insert({
      name,
      name_th: optional(formData.get("nameTh")),
      contact_info: optional(formData.get("contactInfo")),
      notes: optional(formData.get("notes")),
    });

    if (error) return refuse(error.message);

    revalidateClinicPages();
    return { ok: true, success: t.management.vets.createdVet(name) };
  });
}

export async function updateClinic(id: string, fields: ClinicFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("clinics.updateClinic", write(t), { id: requestId, action: "clinics.updateClinic", db: supabase }, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(fields.name);
    if (!name) return refuse(t.management.vets.errors.nameRequired);

    const { error } = await supabase
      .from("clinics")
      .update({
        name,
        name_th: optional(fields.nameTh),
        contact_info: optional(fields.contactInfo),
        notes: optional(fields.notes),
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateClinicPages(id);
    return { ok: true };
  });
}

export async function deleteClinic(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("clinics.deleteClinic", write(t), { id: requestId, action: "clinics.deleteClinic", db: supabase }, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);

    // clinic_visits.clinic_id has no cascade, so a clinic with history can't go:
    // the visits are the resident's medical record. Say so up front instead
    // of surfacing the foreign-key error.
    const { count, error: countError } = await supabase
      .from("clinic_visits")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", id);
    if (countError) return refuse(countError.message);
    if (count && count > 0) {
      return refuse(t.management.vets.errors.hasVisits(count));
    }

    const { error } = await supabase.from("clinics").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidateClinicPages(id);
    return { ok: true };
  });
}
