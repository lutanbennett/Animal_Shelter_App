"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadVetScope, scopeAllowsVet } from "@/lib/vets/scope";

export type VetVisitState = { error: string } | undefined;

export async function bookVetVisit(
  _state: VetVisitState,
  formData: FormData,
): Promise<VetVisitState> {
  const { t } = await getT();
  const residentIds = formData
    .getAll("residentIds")
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const vetId = formData.get("vetId");
  const appointmentDateLocal = formData.get("appointmentDate");
  const reason = formData.get("reason");
  const notes = formData.get("notes");
  const status = formData.get("status");
  // 0074 promises trimmed text with blank stored as null, not ''.
  const doctorRaw = formData.get("doctorName");
  const doctorName =
    typeof doctorRaw === "string" && doctorRaw.trim() ? doctorRaw.trim() : null;

  if (residentIds.length === 0) {
    return { error: t.vetVisits.errors.selectResident };
  }
  if (typeof vetId !== "string" || !vetId) {
    return { error: t.vetVisits.errors.selectVet };
  }
  if (typeof appointmentDateLocal !== "string" || !appointmentDateLocal) {
    return { error: t.vetVisits.errors.enterDateTime };
  }

  const appointmentDate = new Date(appointmentDateLocal);
  if (Number.isNaN(appointmentDate.getTime())) {
    return { error: t.vetVisits.errors.invalidDate };
  }

  const supabase = await createClient();
  // The page shows a vet only their own clinic; this is the check a posted
  // form can't get round (src/lib/vets/scope.ts).
  const scope = await loadVetScope(supabase);
  if (scope.kind === "unlinked") return { error: t.vetVisits.noClinicForAccount };
  if (!scopeAllowsVet(scope, vetId)) return { error: t.vetVisits.errors.notYourClinic };

  const { data: booked, error } = await supabase.rpc("schedule_bulk_appointments", {
    p_resident_ids: residentIds,
    p_vet_id: vetId,
    p_appointment_date: appointmentDate.toISOString(),
    p_reason: typeof reason === "string" && reason ? reason : null,
    p_notes: typeof notes === "string" && notes ? notes : null,
    p_status: typeof status === "string" && status ? status : "scheduled",
  });

  if (error) {
    return { error: error.message };
  }

  // The RPC has no doctor parameter and this feature carries no migration,
  // so the name is set on the rows it just returned. Staff can update what
  // they can insert (0030). If this half fails the visits exist already —
  // say so, so nobody books them twice.
  if (doctorName) {
    const ids = ((booked ?? []) as { id: string }[]).map((row) => row.id);
    const { error: doctorError } = await supabase
      .from("vet_appointments")
      .update({ doctor_name: doctorName })
      .in("id", ids);
    if (doctorError) {
      return { error: t.vetVisits.errors.doctorNotSaved(doctorError.message) };
    }
  }

  // Back to what was booked: one resident's vet visits, or the residents
  // list a bulk booking was started from. Never "/", the public website.
  redirect(
    residentIds.length === 1 ? `/residents/${residentIds[0]}/vet-appointments` : "/residents",
  );
}
