"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { recordWeight, updateWeight } from "@/lib/weight/record";

// PI FAILOVER (D), 2026-11-01: the one write here goes through runWriteAction() (docs/decisions/2026-11-01-write-paths-tail-a.md).
export type RecordWeightState = { ok: false; error: string } | undefined;

/**
 * Record Weight (a Head of Medical job). Today's date, no clinic visit, no note: she is weighing
 * a dog, not filing a visit, and the form for that stays on the resident's record. A second
 * weight on the same day corrects the first (one per day, 0106), which is what the form warned
 * about. The write goes straight to `weight`, whose policy asks medical.weight (0135); the
 * deceased lock is the database's own (0026).
 */
export async function saveMedicalWeight(
  _state: RecordWeightState,
  formData: FormData,
): Promise<RecordWeightState> {
  const { t } = await getT();
  const supabase = await createClient();
  // The redirect is taken AFTER the wrapper returns: it rethrows one and would leave the claim open.
  const outcome = await runWriteAction<{ redirectTo: string }>(
    "medicalWeight.save",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: writeRequestIdFrom(formData), action: "medicalWeight.save", db: supabase },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "medical.weight")) return { ok: false, error: t.medicalJobs.weight.refused };

      const residentId = String(formData.get("residentId") ?? "").trim();
      if (!residentId) return { ok: false, error: t.weight.errors.missingResident };
      const raw = String(formData.get("weightKg") ?? "").trim().replace(",", ".");
      if (!raw) return { ok: false, error: t.medicalJobs.weight.enterWeight };

      const date = todayIso();
      const { data: today } = await supabase
        .from("weight")
        .select("id")
        .is("archived_at", null)
        .eq("resident_id", residentId)
        .eq("date", date)
        .limit(1)
        .returns<{ id: string }[]>();

      const input = { residentId, date, weightKg: Number(raw) };
      const result = today?.[0]
        ? await updateWeight(supabase, t, today[0].id, input)
        : await recordWeight(supabase, t, input);
      if ("error" in result) return { ok: false, error: result.error };

      revalidatePath("/medical/weight");
      return { ok: true, redirectTo: `/medical/weight?saved=${encodeURIComponent(residentId)}` };
    },
  );
  if (outcome.ok) redirect(outcome.redirectTo);
  return outcome;
}
