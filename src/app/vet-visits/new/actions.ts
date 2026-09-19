"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

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
  const { error } = await supabase.rpc("schedule_bulk_appointments", {
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

  redirect("/");
}
