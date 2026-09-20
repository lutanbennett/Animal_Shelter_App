"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type VetFormState =
  | { error: string }
  | { success: string }
  | undefined;

export type VetFields = {
  name: string;
  clinicName: string | null;
  contactInfo: string | null;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function revalidateVetPages(id?: string) {
  revalidatePath("/admin/vets");
  revalidatePath("/vets");
  if (id) revalidatePath(`/vets/${id}`);
}

export async function createVet(
  _state: VetFormState,
  formData: FormData,
): Promise<VetFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = optional(formData.get("name"));
  if (!name) return { error: t.admin.vets.errors.nameRequired };

  const supabase = await createClient();
  const { error } = await supabase.from("vets").insert({
    name,
    clinic_name: optional(formData.get("clinicName")),
    contact_info: optional(formData.get("contactInfo")),
  });

  if (error) return { error: error.message };

  revalidateVetPages();
  return { success: t.admin.vets.createdVet(name) };
}

export async function updateVet(id: string, fields: VetFields) {
  await assertAdminRole();
  const { t } = await getT();

  const name = optional(fields.name);
  if (!name) throw new Error(t.admin.vets.errors.nameRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vets")
    .update({
      name,
      clinic_name: optional(fields.clinicName),
      contact_info: optional(fields.contactInfo),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateVetPages(id);
}

export async function deleteVet(id: string) {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();

  // vet_appointments.vet_id has no cascade, so a vet with history can't go:
  // the visits are the resident's medical record. Say so up front instead
  // of surfacing the foreign-key error.
  const { count, error: countError } = await supabase
    .from("vet_appointments")
    .select("id", { count: "exact", head: true })
    .eq("vet_id", id);
  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error(t.admin.vets.errors.hasVisits(count));
  }

  const { error } = await supabase.from("vets").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateVetPages(id);
}
