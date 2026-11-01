"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { isFutureDate, isIsoDate } from "@/lib/placements/dates";

// PI FAILOVER (D), 2026-11-01: the write here goes through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-b.md). The state gained `ok`
// because runWriteAction needs an ActionResult, and `success: true` went with it.
export type ProcedureSaved = { procedureId: string; date: string; typeName: string };
/** Kept for the form state slot; the action itself always answers with a result. */
export type ProcedureFormState = ActionResult<ProcedureSaved> | undefined;

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

/**
 * Records a procedure, creating the procedure type first when the form was
 * used to add a new one inline (same shape as medications on the
 * prescription form — the type row is worth keeping even if the procedure
 * insert then fails, so it's not one transaction). Returns the new row
 * rather than redirecting so the form can offer the file uploader next,
 * as the blood-test form does. The deceased lock (0026) is enforced by
 * the database as well as by the page that renders this form.
 *
 * The type row is the reason a replay matters here rather than merely being
 * tidy: without the claim, a retried save that had already created "x-ray"
 * would reuse it (the ilike lookup) but add a SECOND procedure row.
 */
export async function createProcedure(
  _state: ProcedureFormState,
  formData: FormData,
): Promise<ActionResult<ProcedureSaved>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<ProcedureSaved>(
    "procedures.create",
    write(t),
    { id: writeRequestIdFrom(formData), action: "procedures.create", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.procedures")) return { ok: false, error: t.common.notAllowed };
      const residentId = str(formData, "residentId");
      if (!residentId) return { ok: false, error: t.procedures.errors.missingResident };

      const date = str(formData, "date");
      if (!date) return { ok: false, error: t.procedures.errors.enterDate };
      if (!isIsoDate(date) || Number.isNaN(new Date(date).getTime())) {
        return { ok: false, error: t.procedures.errors.invalidDate };
      }
      if (isFutureDate(date, new Date())) {
        return { ok: false, error: t.procedures.errors.dateInFuture };
      }

      // Type: an existing id, or a new name to create first.
      let procedureTypeId = str(formData, "procedureTypeId");
      const newTypeName = str(formData, "newProcedureTypeName");
      if (procedureTypeId === "__new__") procedureTypeId = null;
      if (!procedureTypeId && !newTypeName) {
        return { ok: false, error: t.procedures.errors.selectType };
      }

      let typeName = "";
      if (!procedureTypeId && newTypeName) {
        // Reuse a type that already exists under this name (case-insensitively)
        // rather than tripping the unique constraint on a re-typed "x-ray".
        const { data: existing } = await supabase
          .from("procedure_types")
          .select("id, name")
          .ilike("name", newTypeName)
          .limit(1)
          .returns<{ id: string; name: string }[]>();
        if (existing?.[0]) {
          procedureTypeId = existing[0].id;
          typeName = existing[0].name;
        } else {
          const { data, error } = await supabase
            .from("procedure_types")
            .insert({ name: newTypeName })
            .select("id, name")
            .limit(1)
            .returns<{ id: string; name: string }[]>();
          if (error) return databaseFailure("procedures.createType", error, t.common);
          procedureTypeId = data?.[0]?.id ?? null;
          if (!procedureTypeId) return { ok: false, error: t.procedures.errors.saveFailed };
          typeName = newTypeName;
        }
      } else {
        const { data } = await supabase
          .from("procedure_types")
          .select("name")
          .eq("id", procedureTypeId)
          .limit(1)
          .returns<{ name: string }[]>();
        typeName = data?.[0]?.name ?? "";
      }

      const { data, error } = await supabase
        .from("procedures")
        .insert({
          resident_id: residentId,
          procedure_type_id: procedureTypeId,
          clinic_visit_id: str(formData, "clinicVisitId"),
          date,
          notes: str(formData, "notes"),
        })
        .select("id, date")
        .limit(1)
        .returns<{ id: string; date: string }[]>();

      if (error) return databaseFailure("procedures.create", error, t.common);
      const row = data?.[0];
      if (!row) return { ok: false, error: t.procedures.errors.saveFailed };

      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/procedures`);
      return { ok: true, procedureId: row.id, date: row.date, typeName };
    },
  );
}
