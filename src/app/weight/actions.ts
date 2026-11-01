"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { recordWeight, updateWeight } from "@/lib/weight/record";

// PI FAILOVER (D), 2026-11-01: both writes here go through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-b.md).
export type WeightFormState = { ok: false; error: string } | undefined;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** The paths a saved reading changes, and where the person is sent afterwards. */
function saved(residentId: string): { ok: true; redirectTo: string } {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/weight`);
  revalidatePath(`/residents/${residentId}/clinic-visits`);
  return { ok: true, redirectTo: `/residents/${residentId}/weight` };
}

/**
 * Records one weight reading and redirects to the resident's Weight tab.
 * The rules live in the shared helper, which the assistant uses too.
 *
 * When the form found a reading already on the chosen day it posts that
 * reading's id as `replaceWeightId`, and saving corrects it instead: one
 * weight per day (0106). Blank notes and visit keep the reading's own, so a
 * doctor weighing an animal on its intake day links the intake reading to the
 * visit without wiping anything.
 */
export async function createWeight(
  _state: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  // The redirect is taken AFTER the wrapper returns: it rethrows one and would leave the claim open.
  const outcome = await runWriteAction<{ redirectTo: string }>(
    "weight.create",
    write(t),
    { id: writeRequestIdFrom(formData), action: "weight.create", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.weight")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.weight.errors.missingResident };

      const weightRaw = str(formData, "weightKg");
      if (!weightRaw) return { ok: false, error: t.weight.errors.enterWeight };

      const replaceWeightId = str(formData, "replaceWeightId");
      const input = {
        residentId,
        date: str(formData, "date") ?? "",
        weightKg: Number(weightRaw),
      };
      const result = replaceWeightId
        ? await updateWeight(supabase, t, replaceWeightId, {
            ...input,
            clinicVisitId: str(formData, "clinicVisitId") ?? undefined,
            notes: str(formData, "notes") ?? undefined,
          })
        : await recordWeight(supabase, t, {
            ...input,
            clinicVisitId: str(formData, "clinicVisitId"),
            notes: str(formData, "notes"),
          });
      if ("error" in result) return { ok: false, error: result.error };

      return saved(residentId);
    },
  );
  if (outcome.ok) redirect(outcome.redirectTo);
  return outcome;
}

/** Saves /weight/[id]/edit: every field as the form shows it. */
export async function saveWeightEdit(
  _state: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const outcome = await runWriteAction<{ redirectTo: string }>(
    "weight.saveEdit",
    write(t),
    { id: writeRequestIdFrom(formData), action: "weight.saveEdit", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.weight")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.weight.errors.missingResident };

      const weightRaw = str(formData, "weightKg");
      if (!weightRaw) return { ok: false, error: t.weight.errors.enterWeight };

      const result = await updateWeight(supabase, t, str(formData, "weightId") ?? "", {
        residentId,
        date: str(formData, "date") ?? "",
        weightKg: Number(weightRaw),
        clinicVisitId: str(formData, "clinicVisitId"),
        notes: str(formData, "notes"),
      });
      if ("error" in result) return { ok: false, error: result.error };

      return saved(residentId);
    },
  );
  if (outcome.ok) redirect(outcome.redirectTo);
  return outcome;
}
