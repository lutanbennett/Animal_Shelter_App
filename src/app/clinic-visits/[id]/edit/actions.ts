"use server";

import { syncNoteTagsOrMessage } from "@/lib/note-tags/sync";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { syncVisitToCalendar } from "@/lib/clinics/calendar-sync";

// PI FAILOVER (D): the one write here goes through runWriteAction(); the redirect is taken AFTER it returns, so a
// replay of a saved request redirects too instead of leaving an open claim (the wrapper rethrows a redirect).
export type ClinicVisitEditState = { ok: false; error: string } | undefined;

const STATUSES = ["scheduled", "completed", "cancelled"] as const;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Updates one visit: clinic, doctor, date/time, status, reason, notes and — after
 * the visit, from the invoice — the cost (0053). Rows for a deceased
 * resident are locked (0026), which the page refuses to show a form for.
 * RLS filters rather than rejects, so a volunteer's update matches no
 * row and reads as "not authorised".
 */
export async function updateClinicVisit(
  _state: ClinicVisitEditState,
  formData: FormData,
): Promise<ClinicVisitEditState> {
  const { t } = await getT();
  const e = t.vetVisits.errors;
  const supabase = await createClient();
  const result = await runWriteAction<{ redirectTo: string }>(
    "clinicVisits.update",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: writeRequestIdFrom(formData), action: "clinicVisits.update", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.visits")) return { ok: false, error: e.notAuthorized };

      const visitId = str(formData, "visitId");
      const residentId = str(formData, "residentId");
      if (!visitId || !residentId) return { ok: false, error: e.notFound };

      const costNotesOnly = str(formData, "costNotesOnly") === "1";
      const clinicId = costNotesOnly ? null : str(formData, "clinicId");
      if (!costNotesOnly && !clinicId) return { ok: false, error: e.selectVet };

      const appointmentDateLocal = str(formData, "appointmentDate");
      if (!costNotesOnly && !appointmentDateLocal) return { ok: false, error: e.enterDateTime };
      const appointmentDate = new Date(appointmentDateLocal ?? "");
      if (!costNotesOnly && Number.isNaN(appointmentDate.getTime())) return { ok: false, error: e.invalidDate };

      const status = str(formData, "status") ?? "scheduled";
      if (!costNotesOnly && !STATUSES.includes(status as (typeof STATUSES)[number])) return { ok: false, error: e.invalidStatus };

      const costRaw = str(formData, "cost");
      let cost: number | null = null;
      if (costRaw) {
        cost = Number(costRaw.replace(/[,\s]/g, ""));
        if (!Number.isFinite(cost) || cost < 0) return { ok: false, error: e.invalidCost };
        cost = Math.round(cost * 100) / 100;
      }

      const doctorName = str(formData, "doctorName");

      const { data, error } = await supabase
        .from("clinic_visits")
        .update(
          costNotesOnly
            ? // A deceased resident's visit (0310): the database refuses any other column, so send no other.
              { notes: str(formData, "notes"), cost }
            : {
                clinic_id: clinicId,
                appointment_date: appointmentDate.toISOString(),
                status,
                reason: str(formData, "reason"),
                // str() trims and turns blank into null, as 0074's comment promises.
                doctor_name: doctorName,
                notes: str(formData, "notes"),
                cost,
              },
        )
        .eq("id", visitId)
        .eq("resident_id", residentId)
        .select("id")
        .returns<{ id: string }[]>();
      // 0107: a visit with prescriptions linked cannot move past today.
      if (error?.code === "23514" && error.message.includes("prescriptions_visit_not_in_future")) {
        return { ok: false, error: e.prescriptionsBlockFuture };
      }
      if (error) return { ok: false, error: error.message };
      if (!data || data.length === 0) return { ok: false, error: e.notAuthorized };

      {
        const tagFailure = await syncNoteTagsOrMessage(
          supabase,
          { table: "clinic_visits", column: "notes", rowId: visitId, residentId },
          formData,
          "notes",
          str(formData, "notes"),
          t.residents.tags,
        );
        if (tagFailure) return { ok: false, error: tagFailure };
      }

      // Saved first; the calendar is second and can never undo it (calendar-sync.ts). A failure is left on the visit.
      if (!costNotesOnly) await syncVisitToCalendar(visitId, (await getSiteOrigin())?.origin ?? null);

      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/clinic-visits`);
      if (clinicId) revalidatePath(`/clinics/${clinicId}`, "page");
      revalidatePath(`/clinic-visits/${visitId}`);
      revalidatePath("/clinics");
      return { ok: true, redirectTo: `/residents/${residentId}/clinic-visits` };
    },
  );
  if (result.ok) redirect(result.redirectTo);
  return result;
}
