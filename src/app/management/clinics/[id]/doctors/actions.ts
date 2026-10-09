"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, unexpectedFailure, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type DoctorFormState = ActionResult<{ success: string }> | undefined;

// doctor_clinics_clinic_key_idx: one row per spelling (ignoring case and
// spacing) per clinic (0125).
const UNIQUE_VIOLATION = "23505";
// Row-level security refusing a write (0125): management and staff cannot
// edit where a doctor who has a login works.
const INSUFFICIENT_PRIVILEGE = "42501";

function revalidateDoctorPages(clinicId: string) {
  revalidatePath(`/management/clinics/${clinicId}/doctors`);
  // A doctor can work at several clinics, so a rename, merge or link here
  // shows on the other clinics' pages too.
  revalidatePath("/management/clinics", "layout");
  revalidatePath(`/clinics/${clinicId}`);
  revalidatePath("/clinics", "layout");
  // A rename or merge rewrites doctor_name on visits, which the resident
  // pages and the visit forms' suggestions read.
  revalidatePath("/residents", "layout");
  revalidatePath("/clinic-visits", "layout");
  // Called from a button, not a <form action>: refresh() re-renders the
  // page the caller is on (see admin/procedure-types/actions.ts).
  refresh();
}

function tidy(name: string | null | undefined) {
  return typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
}

/**
 * A doctor needs only a name and a clinic: no email, no account, no
 * invitation (Lutan, 2026-10-01).
 */
export async function addDoctor(
  clinicId: string,
  _state: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  const { t } = await getT();
  return runAction("doctors.addDoctor", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const name = tidy(formData.get("name") as string | null);
    if (!name) return refuse(d.errors.nameRequired);

    const supabase = await createClient();
    // A doctor has no clinic of its own (0172): the person first, then the link here.
    const { data: created, error } = await supabase
      .from("doctors")
      .insert({ name })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error || !created) return unexpectedFailure("doctors.addDoctor", error, t.common.somethingWentWrong);

    const { error: linkError } = await supabase
      .from("doctor_clinics")
      .insert({ clinic_id: clinicId, doctor_id: created.id, active: true });
    if (linkError) {
      // The name is already listed here: nothing half-made.
      await supabase.from("doctors").delete().eq("id", created.id);
      return refuse(linkError.code === UNIQUE_VIOLATION ? d.errors.alreadyListed(name) : linkError.message);
    }

    revalidateDoctorPages(clinicId);
    return { ok: true, success: d.added(name) };
  });
}

/**
 * Lists a doctor who already exists, at another clinic, as working here too.
 * A doctor who used to work here and is marked as left comes back instead
 * (their link stays, because past visits reference it).
 */
export async function addExistingDoctor(
  clinicId: string,
  _state: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  const { t } = await getT();
  return runAction("doctors.addExistingDoctor", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const doctorId = formData.get("doctorId");
    if (typeof doctorId !== "string" || !doctorId) return refuse(d.errors.pickDoctor);

    const supabase = await createClient();
    const { data: doctor } = await supabase
      .from("doctors")
      .select("name")
      .eq("id", doctorId)
      .maybeSingle<{ name: string }>();
    if (!doctor) return refuse(d.errors.doctorNotFound);

    const { error } = await supabase
      .from("doctor_clinics")
      .upsert({ clinic_id: clinicId, doctor_id: doctorId, active: true }, { onConflict: "clinic_id,doctor_id" });
    if (error) {
      if (error.code === UNIQUE_VIOLATION) return refuse(d.errors.alreadyListed(doctor.name));
      if (error.code === INSUFFICIENT_PRIVILEGE) return refuse(d.errors.loginLinksAdminOnly);
      return refuse(error.message);
    }

    revalidateDoctorPages(clinicId);
    return { ok: true, success: d.addedExisting(doctor.name) };
  });
}

/**
 * Renames a doctor. The database writes the new spelling onto every visit
 * linked to them (doctors_propagate_name, 0102), at every clinic they
 * work at, so the page confirms with the visit count before calling this.
 */
export async function renameDoctor(
  clinicId: string,
  id: string,
  rawName: string,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("doctors.renameDoctor", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    const d = t.management.vetDoctors;

    const name = tidy(rawName);
    if (!name) return refuse(d.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("doctors").update({ name }).eq("id", id);
    if (error) {
      return refuse(error.code === UNIQUE_VIOLATION ? d.errors.renameClash(name) : error.message);
    }
    revalidateDoctorPages(clinicId);
    return { ok: true };
  });
}

/**
 * Marks a doctor as having left this clinic, or back. It is the link's own
 * flag (doctor_clinics.active, 0125), so a doctor who left one clinic
 * is still suggested at the others, and a doctor login linked to them can
 * no longer book or edit here (it still sees the residents it treated).
 */
export async function setDoctorActive(
  clinicId: string,
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("doctors.setDoctorActive", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("doctor_clinics")
      .update({ active })
      .eq("doctor_id", id)
      .eq("clinic_id", clinicId)
      .select("doctor_id");
    if (error) return refuse(error.message);
    // Row-level security filters rather than errors on an update: nothing
    // changed means the link is a login's, which only an admin edits.
    if (!data?.length) return refuse(t.management.vetDoctors.errors.loginLinksAdminOnly);
    revalidateDoctorPages(clinicId);
    return { ok: true };
  });
}

/**
 * The "same person as…" merge: folds `fromId` into `intoId`
 * (merge_doctors, 0125). `intoId` takes every clinic `fromId` worked
 * at, the visits move across and show `intoId`'s spelling, and a login
 * moves with them. `fromId` is deleted. The function refuses two doctors
 * who both have a login, and a doctor with a login unless an admin merges.
 * Never done by name: always a person choosing.
 */
export async function mergeDoctors(
  clinicId: string,
  fromId: string,
  intoId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("doctors.mergeDoctors", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    if (fromId === intoId) return refuse(t.management.vetDoctors.errors.mergeSelf);

    const supabase = await createClient();
    const { error } = await supabase.rpc("merge_doctors", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);
    revalidateDoctorPages(clinicId);
    return { ok: true };
  });
}

/**
 * Removes a doctor from this clinic's list. A doctor on any visit here is
 * part of a medical record (the link cannot go while a visit uses it), so
 * they are marked as left instead. A doctor who works nowhere else, and has
 * no login, goes entirely.
 */
export async function deleteDoctor(clinicId: string, id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("doctors.deleteDoctor", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "clinics.doctors")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from("clinic_visits")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", id)
      .eq("clinic_id", clinicId);
    if (countError) return refuse(countError.message);
    if (count && count > 0) return refuse(t.management.vetDoctors.errors.hasVisits(count));

    const { data, error } = await supabase
      .from("doctor_clinics")
      .delete()
      .eq("doctor_id", id)
      .eq("clinic_id", clinicId)
      .select("doctor_id");
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.management.vetDoctors.errors.loginLinksAdminOnly);

    // Nothing else holds the person: no other clinic and no login.
    const [{ count: remaining }, { data: person }] = await Promise.all([
      supabase
        .from("doctor_clinics")
        .select("doctor_id", { count: "exact", head: true })
        .eq("doctor_id", id),
      supabase.from("doctors").select("user_id").eq("id", id).maybeSingle<{ user_id: string | null }>(),
    ]);
    if (!remaining && person && !person.user_id) {
      const { error: personError } = await supabase.from("doctors").delete().eq("id", id);
      if (personError) return refuse(personError.message);
    }
    revalidateDoctorPages(clinicId);
    return { ok: true };
  });
}
