"use server";

import { refresh, revalidatePath } from "next/cache";
import { runWriteAction, unexpectedFailure, type ActionResult } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";

// Settings → Correct an intake date. ONE write, through runWriteAction() (Pi failover (C)), which is why
// "/admin/intake-date" is on WRAPPED_WRITE_PATHS. The action asks resident.correct_intake_date, the same
// activity correct_intake_date() (0302) asks; the database check is the security, this one is the courtesy.
// The function's refusals (a record in the way, a future date) are plain sentences written for the person,
// so they are passed through; anything else goes through unexpectedFailure.

export type IntakeDateState = ActionResult<{ success: string }> | undefined;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function correctIntakeDate(_state: IntakeDateState, formData: FormData): Promise<IntakeDateState> {
  const { t } = await getT();
  const supabase = await createClient();
  const s = t.admin.intakeDate;
  return runWriteAction(
    "intakeDate.correct",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: writeRequestIdFrom(formData), action: "intakeDate.correct", db: supabase },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "resident.correct_intake_date")) return { ok: false as const, error: s.notAllowed };
      const residentId = String(formData.get("residentId") ?? "");
      const newDate = String(formData.get("newDate") ?? "");
      if (!residentId || !ISO.test(newDate)) return { ok: false as const, error: s.chooseDate };

      const { data, error } = await supabase.rpc("correct_intake_date", { p_resident_id: residentId, p_new_date: newDate });
      if (error) {
        if (error.code === "42501") return { ok: false as const, error: s.notAllowed };
        if (error.code === "P0001") return { ok: false as const, error: error.message };
        return unexpectedFailure("intakeDate.correct", error, t.common.somethingWentWrong);
      }
      const r = data as { intake_date: string; new_date: string };
      revalidatePath("/admin/intake-date");
      revalidatePath("/residents", "layout");
      refresh();
      return { ok: true as const, success: s.saved(r.intake_date, r.new_date) };
    },
  );
}
