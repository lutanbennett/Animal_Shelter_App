"use server";

import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type BloodTestFormState =
  | { error: string }
  | { success: true; bloodTestId: string; date: string }
  | undefined;

export async function createBloodTest(
  _state: BloodTestFormState,
  formData: FormData,
): Promise<BloodTestFormState> {
  const { t } = await getT();
  const residentId = formData.get("residentId");
  const vetAppointmentId = formData.get("vetAppointmentId");
  const date = formData.get("date");
  const results = formData.get("results");

  if (typeof residentId !== "string" || !residentId) {
    return { error: t.bloodTests.errors.missingResident };
  }
  if (typeof date !== "string" || !date) {
    return { error: t.bloodTests.errors.enterDate };
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: t.bloodTests.errors.invalidDate };
  }
  if (parsedDate.getTime() > Date.now()) {
    return { error: t.bloodTests.errors.dateInFuture };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blood_tests")
    .insert({
      resident_id: residentId,
      vet_appointment_id:
        typeof vetAppointmentId === "string" && vetAppointmentId
          ? vetAppointmentId
          : null,
      date,
      results: typeof results === "string" && results ? results : null,
    })
    .select("id, date")
    .limit(1)
    .returns<{ id: string; date: string }[]>();

  if (error) {
    return { error: error.message };
  }

  const row = data?.[0];
  if (!row) {
    return { error: t.bloodTests.errors.saveFailed };
  }

  return { success: true, bloodTestId: row.id, date: row.date };
}
