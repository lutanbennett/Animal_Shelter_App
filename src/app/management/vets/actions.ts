"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type VetFormState = ActionResult<{ success: string }> | undefined;

export type VetFields = {
  name: string;
  clinicName: string | null;
  contactInfo: string | null;
  notes: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function revalidateVetPages(id?: string) {
  revalidatePath("/management/vets");
  revalidatePath("/vets");
  if (id) revalidatePath(`/vets/${id}`);
}

export async function createVet(
  _state: VetFormState,
  formData: FormData,
): Promise<VetFormState> {
  const { t } = await getT();
  return runAction("vets.createVet", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(formData.get("name"));
    if (!name) return refuse(t.management.vets.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("vets").insert({
      name,
      clinic_name: optional(formData.get("clinicName")),
      contact_info: optional(formData.get("contactInfo")),
      notes: optional(formData.get("notes")),
    });

    if (error) return refuse(error.message);

    revalidateVetPages();
    return { ok: true, success: t.management.vets.createdVet(name) };
  });
}

export async function updateVet(id: string, fields: VetFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vets.updateVet", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(fields.name);
    if (!name) return refuse(t.management.vets.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase
      .from("vets")
      .update({
        name,
        clinic_name: optional(fields.clinicName),
        contact_info: optional(fields.contactInfo),
        notes: optional(fields.notes),
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateVetPages(id);
    return { ok: true };
  });
}

export async function deleteVet(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vets.deleteVet", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.list")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    // vet_appointments.vet_id has no cascade, so a vet with history can't go:
    // the visits are the resident's medical record. Say so up front instead
    // of surfacing the foreign-key error.
    const { count, error: countError } = await supabase
      .from("vet_appointments")
      .select("id", { count: "exact", head: true })
      .eq("vet_id", id);
    if (countError) return refuse(countError.message);
    if (count && count > 0) {
      return refuse(t.management.vets.errors.hasVisits(count));
    }

    const { error } = await supabase.from("vets").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidateVetPages(id);
    return { ok: true };
  });
}
