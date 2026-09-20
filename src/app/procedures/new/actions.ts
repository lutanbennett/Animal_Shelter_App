"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ProcedureFormState =
  | { error: string }
  | { success: true; procedureId: string; date: string; typeName: string }
  | undefined;

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
 */
export async function createProcedure(
  _state: ProcedureFormState,
  formData: FormData,
): Promise<ProcedureFormState> {
  const { t } = await getT();
  const residentId = str(formData, "residentId");
  if (!residentId) return { error: t.procedures.errors.missingResident };

  const date = str(formData, "date");
  if (!date) return { error: t.procedures.errors.enterDate };
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: t.procedures.errors.invalidDate };
  }
  if (parsedDate.getTime() > Date.now()) {
    return { error: t.procedures.errors.dateInFuture };
  }

  // Type: an existing id, or a new name to create first.
  let procedureTypeId = str(formData, "procedureTypeId");
  const newTypeName = str(formData, "newProcedureTypeName");
  if (procedureTypeId === "__new__") procedureTypeId = null;
  if (!procedureTypeId && !newTypeName) {
    return { error: t.procedures.errors.selectType };
  }

  const supabase = await createClient();

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
      if (error) return { error: error.message };
      procedureTypeId = data?.[0]?.id ?? null;
      if (!procedureTypeId) return { error: t.procedures.errors.saveFailed };
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
      vet_appointment_id: str(formData, "vetAppointmentId"),
      date,
      notes: str(formData, "notes"),
    })
    .select("id, date")
    .limit(1)
    .returns<{ id: string; date: string }[]>();

  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.procedures.errors.saveFailed };

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/procedures`);
  return { success: true, procedureId: row.id, date: row.date, typeName };
}
