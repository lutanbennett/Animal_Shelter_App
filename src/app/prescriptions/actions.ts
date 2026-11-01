"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import {
  ensureMedication,
  parsePrescriptionFields,
  revalidateResidentPages,
  saveRounds,
  scheduleColumns,
  str,
  writeError,
  writePrescription,
} from "@/lib/prescriptions/record";
import { todayIso } from "@/lib/format";

// PI FAILOVER (D), 2026-11-01: all three writes here go through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-b.md). The shared write (and the assistant's `recordPrescription`)
// moved to src/lib/prescriptions/record.ts so that it is not itself a public action.
export type PrescriptionFormState = { ok: false; error: string } | undefined;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * The form page's version of the write: the same one the assistant runs, then the redirect to the resident's
 * prescriptions tab on success. The redirect is taken AFTER the wrapper returns: it rethrows one and would
 * leave the claim open, so a replay of a save that happened would answer "cannot tell".
 */
export async function createPrescription(
  _state: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const outcome = await runWriteAction<{ redirectTo: string }>(
    "prescriptions.create",
    write(t),
    { id: writeRequestIdFrom(formData), action: "prescriptions.create", db: supabase },
    async () => {
      const result = await writePrescription(supabase, t, formData);
      if ("error" in result) return { ok: false, error: result.error };
      return { ok: true, redirectTo: `/residents/${result.residentId}/prescriptions` };
    },
  );
  if (outcome.ok) redirect(outcome.redirectTo);
  return outcome;
}

/**
 * Rewrites an existing prescription from the same form — a wrong dose, a
 * course cut short or extended, a missed linked visit. Every column the
 * form carries is written, so clearing the end date on an expired row
 * makes it current again. The deceased lock (0026) rejects the update for
 * a closed record, which the edit page already refuses to show.
 */
export async function updatePrescription(
  _state: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const outcome = await runWriteAction<{ redirectTo: string }>(
    "prescriptions.update",
    write(t),
    { id: writeRequestIdFrom(formData), action: "prescriptions.update", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.prescriptions")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.prescriptions.errors.missingResident };
      const prescriptionId = str(formData, "prescriptionId");
      if (!prescriptionId) return { ok: false, error: t.prescriptions.errors.missingPrescription };

      const parsed = await parsePrescriptionFields(formData, t);
      if ("error" in parsed) return { ok: false, error: parsed.error };
      const { fields } = parsed;

      const refs = await ensureMedication(supabase, fields);
      if ("error" in refs) return { ok: false, error: refs.error };

      const { data, error } = await supabase
        .from("prescriptions")
        .update({
          medication_id: refs.medicationId,
          ...scheduleColumns(fields.schedule),
          clinic_visit_id: fields.clinicVisitId,
          dose_quantity: fields.doseQuantity,
          start_date: fields.startDate,
          end_date: fields.endDate,
          notes: fields.notes,
        })
        .eq("id", prescriptionId)
        .eq("resident_id", residentId)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return { ok: false, ...writeError(t, error) };
      // RLS filters rather than rejects: a volunteer's update matches no rows.
      if (!data || data.length === 0) return { ok: false, error: t.prescriptions.errors.saveFailed };
      const roundsResult = await saveRounds(supabase, prescriptionId, fields.roundIds, fields.roundDoses);
      if (roundsResult) return { ok: false, error: roundsResult.error };

      revalidateResidentPages(residentId);
      return { ok: true, redirectTo: `/residents/${residentId}/prescriptions` };
    },
  );
  if (outcome.ok) redirect(outcome.redirectTo);
  return outcome;
}

/**
 * The "End today" shortcut on a current row: sets end_date to today so
 * the course stops counting toward the medication requirement from
 * tomorrow. Called from a button, so the page is refreshed here rather
 * than by a form submission. Only offered on rows that have started —
 * ending a future course today would fail 0027's end-after-start check;
 * those are edited (or the start moved) instead.
 *
 * The request id is the LAST argument. RecordRowActions has passed one since #1156 and the resident tab binds
 * the first two (`endPrescriptionToday.bind(null, id, row.id)`), so this is the handoff that PR named.
 */
export async function endPrescriptionToday(
  residentId: string,
  prescriptionId: string,
  requestId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("prescriptions.endToday", write(t), { id: requestId, action: "prescriptions.endToday", db: supabase }, async () => {
    if (!can(await loadPermissions(), "medical.prescriptions")) return { ok: false, error: t.common.notAllowed };
    const today = todayIso();
    const { data, error } = await supabase
      .from("prescriptions")
      .update({ end_date: today })
      .eq("id", prescriptionId)
      .eq("resident_id", residentId)
      .lte("start_date", today)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: t.prescriptions.errors.saveFailed };

    revalidateResidentPages(residentId);
    refresh();
    return { ok: true };
  });
}
