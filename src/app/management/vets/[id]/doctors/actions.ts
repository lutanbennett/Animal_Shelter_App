"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { hasManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

const refuse = (error: string) => ({ ok: false as const, error });

export type DoctorFormState = ActionResult<{ success: string }> | undefined;

// vet_doctor_clinics_vet_key_idx: one row per spelling (ignoring case and
// spacing) per clinic (0125).
const UNIQUE_VIOLATION = "23505";
// Row-level security refusing a write (0125): management and staff cannot
// edit where a doctor who has a login works.
const INSUFFICIENT_PRIVILEGE = "42501";

function revalidateDoctorPages(vetId: string) {
  revalidatePath(`/management/vets/${vetId}/doctors`);
  // A doctor can work at several clinics, so a rename, merge or link here
  // shows on the other clinics' pages too.
  revalidatePath("/management/vets", "layout");
  revalidatePath(`/vets/${vetId}`);
  revalidatePath("/vets", "layout");
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

/**
 * A doctor needs only a name and a clinic: no email, no account, no
 * invitation (Lutan, 2026-10-01). The database links them to this clinic.
 */
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
 * Lists a doctor who already exists, at another clinic, as working here too.
 * A doctor who used to work here and is marked as left comes back instead
 * (their link stays, because past visits reference it).
 */
export async function addExistingDoctor(
  vetId: string,
  _state: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  const { t } = await getT();
  return runAction("vetDoctors.addExistingDoctor", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const doctorId = formData.get("doctorId");
    if (typeof doctorId !== "string" || !doctorId) return refuse(d.errors.pickDoctor);

    const supabase = await createClient();
    const { data: doctor } = await supabase
      .from("vet_doctors")
      .select("name")
      .eq("id", doctorId)
      .maybeSingle<{ name: string }>();
    if (!doctor) return refuse(d.errors.doctorNotFound);

    const { error } = await supabase
      .from("vet_doctor_clinics")
      .upsert({ vet_id: vetId, doctor_id: doctorId, active: true }, { onConflict: "vet_id,doctor_id" });
    if (error) {
      if (error.code === UNIQUE_VIOLATION) return refuse(d.errors.alreadyListed(doctor.name));
      if (error.code === INSUFFICIENT_PRIVILEGE) return refuse(d.errors.loginLinksAdminOnly);
      return refuse(error.message);
    }

    revalidateDoctorPages(vetId);
    return { ok: true, success: d.addedExisting(doctor.name) };
  });
}

/**
 * Renames a doctor. The database writes the new spelling onto every visit
 * linked to them (vet_doctors_propagate_name, 0102), at every clinic they
 * work at, so the page confirms with the visit count before calling this.
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
    const { error } = await supabase.from("vet_doctors").update({ name }).eq("id", id);
    if (error) {
      return refuse(error.code === UNIQUE_VIOLATION ? d.errors.renameClash(name) : error.message);
    }
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}

/**
 * Marks a doctor as having left this clinic, or back. It is the link's own
 * flag (vet_doctor_clinics.active, 0125), so a doctor who left one clinic
 * is still suggested at the others, and a vet login linked to them loses
 * this clinic only.
 */
export async function setDoctorActive(
  vetId: string,
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.setDoctorActive", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vet_doctor_clinics")
      .update({ active })
      .eq("doctor_id", id)
      .eq("vet_id", vetId)
      .select("doctor_id");
    if (error) return refuse(error.message);
    // Row-level security filters rather than errors on an update: nothing
    // changed means the link is a login's, which only an admin edits.
    if (!data?.length) return refuse(t.management.vetDoctors.errors.loginLinksAdminOnly);
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}

/**
 * The "same person as…" merge: folds `fromId` into `intoId`
 * (merge_vet_doctors, 0125). `intoId` takes every clinic `fromId` worked
 * at, the visits move across and show `intoId`'s spelling, and a login
 * moves with them. `fromId` is deleted. The function refuses two doctors
 * who both have a login, and a doctor with a login unless an admin merges.
 * Never done by name: always a person choosing.
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

/**
 * Removes a doctor from this clinic's list. A doctor on any visit here is
 * part of a medical record (the link cannot go while a visit uses it), so
 * they are marked as left instead. A doctor who works nowhere else, and has
 * no login, goes entirely.
 */
export async function deleteDoctor(vetId: string, id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("vetDoctors.deleteDoctor", t.common.somethingWentWrong, async () => {
    if (!(await hasManagementRole())) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("vet_appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", id)
      .eq("vet_id", vetId);
    if (countError) return refuse(countError.message);
    if (count && count > 0) return refuse(t.management.vetDoctors.errors.hasVisits(count));

    const { data, error } = await supabase
      .from("vet_doctor_clinics")
      .delete()
      .eq("doctor_id", id)
      .eq("vet_id", vetId)
      .select("doctor_id");
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.management.vetDoctors.errors.loginLinksAdminOnly);

    // Nothing else holds the person: no other clinic and no login.
    const [{ count: remaining }, { data: person }] = await Promise.all([
      supabase
        .from("vet_doctor_clinics")
        .select("doctor_id", { count: "exact", head: true })
        .eq("doctor_id", id),
      supabase.from("vet_doctors").select("user_id").eq("id", id).maybeSingle<{ user_id: string | null }>(),
    ]);
    if (!remaining && person && !person.user_id) {
      const { error: personError } = await supabase.from("vet_doctors").delete().eq("id", id);
      if (personError) return refuse(personError.message);
    }
    revalidateDoctorPages(vetId);
    return { ok: true };
  });
}
