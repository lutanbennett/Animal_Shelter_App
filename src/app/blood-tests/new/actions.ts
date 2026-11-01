"use server";

import { databaseFailure, runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { isFutureDate, isIsoDate } from "@/lib/placements/dates";

// PI FAILOVER (D): the one write on this page goes through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-a.md). A second write added here goes through it too.
export type BloodTestFormState = ActionResult<{ bloodTestId: string; date: string }> | undefined;

export async function createBloodTest(
  _state: BloodTestFormState,
  formData: FormData,
): Promise<ActionResult<{ bloodTestId: string; date: string }>> {
  const { t } = await getT();
  const supabase = await createClient();
  const messages: WriteMessages = {
    somethingWentWrong: t.common.somethingWentWrong,
    saveUnknown: t.common.saveUnknown,
    reloadToSave: t.common.reloadToSave,
  };
  return runWriteAction<{ bloodTestId: string; date: string }>(
    "bloodTests.create",
    messages,
    { id: writeRequestIdFrom(formData), action: "bloodTests.create", db: supabase },
    async () => {
  if (!can(await loadPermissions(), "medical.blood_tests")) return { ok: false, error: t.common.notAllowed };
  const residentId = formData.get("residentId");
  const clinicVisitId = formData.get("clinicVisitId");
  const bloodTestTypeId = formData.get("bloodTestTypeId");
  const date = formData.get("date");
  const results = formData.get("results");

  if (typeof residentId !== "string" || !residentId) {
    return { ok: false, error: t.bloodTests.errors.missingResident };
  }
  if (typeof bloodTestTypeId !== "string" || !bloodTestTypeId) {
    return { ok: false, error: t.bloodTests.errors.selectType };
  }
  if (typeof date !== "string" || !date) {
    return { ok: false, error: t.bloodTests.errors.enterDate };
  }

  if (!isIsoDate(date) || Number.isNaN(new Date(date).getTime())) {
    return { ok: false, error: t.bloodTests.errors.invalidDate };
  }
  if (isFutureDate(date, new Date())) {
    return { ok: false, error: t.bloodTests.errors.dateInFuture };
  }

  const { data, error } = await supabase
    .from("blood_tests")
    .insert({
      resident_id: residentId,
      blood_test_type_id: bloodTestTypeId,
      clinic_visit_id:
        typeof clinicVisitId === "string" && clinicVisitId
          ? clinicVisitId
          : null,
      date,
      results: typeof results === "string" && results ? results : null,
    })
    .select("id, date")
    .limit(1)
    .returns<{ id: string; date: string }[]>();

  if (error) return databaseFailure("bloodTests.create", error, t.common);

  const row = data?.[0];
  if (!row) {
    return { ok: false, error: t.bloodTests.errors.saveFailed };
  }

  return { ok: true, bloodTestId: row.id, date: row.date };
    },
  );
}
