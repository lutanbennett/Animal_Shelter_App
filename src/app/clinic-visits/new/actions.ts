"use server";

import { redirect } from "next/navigation";
import { databaseFailure, runWriteAction } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { bookingReturnPath } from "@/lib/clinics/booking-return";
import { syncPendingVisits } from "@/lib/clinics/calendar-sync";
import { loadClinicScope, scopeAllowsClinic } from "@/lib/clinics/scope";

// PI FAILOVER (D): the one write here goes through runWriteAction(); the redirect is taken AFTER it returns, so a
// replay of a saved request redirects too instead of leaving an open claim (the wrapper rethrows a redirect).
export type ClinicVisitState = { ok: false; error: string } | undefined;

export async function bookClinicVisit(
  _state: ClinicVisitState,
  formData: FormData,
): Promise<ClinicVisitState> {
  const { t } = await getT();
  const supabase = await createClient();
  const result = await runWriteAction<{ redirectTo: string }>(
    "clinicVisits.book",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: writeRequestIdFrom(formData), action: "clinicVisits.book", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "visit.book")) return { ok: false, error: t.vetVisits.errors.notAuthorized };
      const residentIds = formData
        .getAll("residentIds")
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      const clinicId = formData.get("clinicId");
      const appointmentDateLocal = formData.get("appointmentDate");
      const reason = formData.get("reason");
      const notes = formData.get("notes");
      const status = formData.get("status");
      // 0074 promises trimmed text with blank stored as null, not ''.
      const doctorRaw = formData.get("doctorName");
      let doctorName =
        typeof doctorRaw === "string" && doctorRaw.trim() ? doctorRaw.trim() : null;

      if (residentIds.length === 0) {
        return { ok: false, error: t.vetVisits.errors.selectResident };
      }
      if (typeof clinicId !== "string" || !clinicId) {
        return { ok: false, error: t.vetVisits.errors.selectVet };
      }
      if (typeof appointmentDateLocal !== "string" || !appointmentDateLocal) {
        return { ok: false, error: t.vetVisits.errors.enterDateTime };
      }

      const appointmentDate = new Date(appointmentDateLocal);
      if (Number.isNaN(appointmentDate.getTime())) {
        return { ok: false, error: t.vetVisits.errors.invalidDate };
      }

      // The page shows a doctor login only its current clinics; this is the check a posted
      // form can't get round (src/lib/clinics/scope.ts).
      const scope = await loadClinicScope(supabase);
      if (scope.kind === "unlinked") return { ok: false, error: t.vetVisits.noClinicForAccount };
      if (!scopeAllowsClinic(scope, clinicId)) return { ok: false, error: t.vetVisits.errors.notYourClinic };
      // A doctor login's visit is its own: the locked Doctor field is not
      // trusted from the form (Lutan, 2026-10-01).
      if (scope.kind === "clinics" && scope.doctorName) doctorName = scope.doctorName;

      const { error } = await supabase.rpc("schedule_bulk_appointments", {
        p_resident_ids: residentIds,
        p_clinic_id: clinicId,
        p_appointment_date: appointmentDate.toISOString(),
        p_reason: typeof reason === "string" && reason ? reason : null,
        p_notes: typeof notes === "string" && notes ? notes : null,
        p_status: typeof status === "string" && status ? status : "scheduled",
        // One call, one transaction (0102): the database links the name to the
        // clinic's doctor list, adding it if it is new.
        p_doctor_name: doctorName,
      });

      if (error) return databaseFailure("clinicVisits.create", error, t.common);

      // Saved first; the calendar is second and can never undo it. The booking function returns no ids, so
      // this sends whatever is out of date (calendar-sync.ts), which is these visits.
      await syncPendingVisits((await getSiteOrigin())?.origin ?? null);

      // Back to the list the booking started from, when it said so and it is a page we know (booking-return.ts).
      // Otherwise: one resident's clinic visits, or the residents list a bulk booking was started from.
      // Never "/", the public website.
      return {
        ok: true,
        redirectTo:
          bookingReturnPath(formData.get("from")) ??
          (residentIds.length === 1 ? `/residents/${residentIds[0]}/clinic-visits` : "/residents"),
      };
    },
  );
  if (result.ok) redirect(result.redirectTo);
  return result;
}
