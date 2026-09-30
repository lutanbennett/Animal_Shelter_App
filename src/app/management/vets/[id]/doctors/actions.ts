"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { hasManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

const refuse = (error: string) => ({ ok: false as const, error });

export type DoctorFormState = ActionResult<{ success: string }> | undefined;

// vet_doctors_vet_key_idx: one row per spelling (ignoring case and spacing)
// per clinic.
const UNIQUE_VIOLATION = "23505";

function revalidateDoctorPages(vetId: string) {
  revalidatePath(`/management/vets/${vetId}/doctors`);
  revalidatePath("/management/vets");
  revalidatePath(`/vets/${vetId}`);
  // A rename or merge rewrites doctor_name on visits, which the resident
  // pages and the visit forms' suggestions read.
  revalidatePath("/residents", "layout");
  revalidatePath("/vet-visits", "layout");
  // Called from a button, not a <form action>: refresh() re-renders the
  // page the caller is on (see admin/procedure-types/actions.ts).
  refresh();
}

function tidy(name: string | null | undefined) {
  return typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
}

export async function addDoctor(
  vetId: string,
  _state: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  const { t } = await getT();
  return runAction("vetDoctors.addDoctor", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const name = tidy(formData.get("name") as string | null);
    if (!name) return refuse(d.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("vet_doctors").insert({ vet_id: vetId, name });
    if (error) {
      return refuse(error.code === UNIQUE_VIOLATION ? d.errors.alreadyListed(name) : error.message);
    }

    revalidateDoctorPages(vetId);
    return { ok: true, success: d.added(name) };
  });
}

/**
 * Renames a doctor. The database writes the new spelling onto every visit
 * linked to them (vet_doctors_propagate_name, 0102), so the page confirms
 * with the visit count before calling this.
 */
export async function renameDoctor(
  vetId: string,
  id: string,
  rawName: string,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.renameDoctor", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const name = tidy(rawName);
    if (!name) return refuse(d.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase
      .from("vet_doctors")
      .update({ name })
      .eq("id", id)
      .eq("vet_id", vetId);
    if (error) {
      return refuse(error.code === UNIQUE_VIOLATION ? d.errors.renameClash(name) : error.message);
    }
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}

export async function setDoctorActive(
  vetId: string,
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.setDoctorActive", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { error } = await supabase
      .from("vet_doctors")
      .update({ active })
      .eq("id", id)
      .eq("vet_id", vetId);
    if (error) return refuse(error.message);
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}

/**
 * Folds `fromId` into `intoId` (merge_vet_doctors, 0102): the visits move
 * across and take `intoId`'s spelling, and `fromId` leaves the list. The
 * function itself refuses two doctors at different clinics.
 */
export async function mergeDoctors(
  vetId: string,
  fromId: string,
  intoId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.mergeDoctors", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    if (fromId === intoId) return refuse(t.management.vetDoctors.errors.mergeSelf);

    const supabase = await createClient();
    const { error } = await supabase.rpc("merge_vet_doctors", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}

export async function deleteDoctor(vetId: string, id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.deleteDoctor", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    // vet_appointments' foreign key has no cascade: a doctor on any visit is
    // part of a medical record. Say so rather than surface the key error.
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("vet_appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", id);
    if (countError) return refuse(countError.message);
    if (count && count > 0) return refuse(t.management.vetDoctors.errors.hasVisits(count));

    const { error } = await supabase
      .from("vet_doctors")
      .delete()
      .eq("id", id)
      .eq("vet_id", vetId);
    if (error) return refuse(error.message);
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}
