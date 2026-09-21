"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ProcedureTypeFormState =
  | { error: string }
  | { success: string }
  | undefined;

function revalidateProcedureTypePages() {
  revalidatePath("/admin/procedure-types");
  // The procedure form's picker and the hub's procedure_types(name) embeds
  // read this table too.
  revalidatePath("/procedures/new");
  revalidatePath("/residents", "layout");
}

async function countProcedures(id: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("procedures")
    .select("id", { count: "exact", head: true })
    .eq("procedure_type_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createProcedureType(
  _state: ProcedureTypeFormState,
  formData: FormData,
): Promise<ProcedureTypeFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: t.admin.procedureTypes.errors.nameRequired };

  const supabase = await createClient();
  const { error } = await supabase.from("procedure_types").insert({ name });

  if (error) return { error: error.message };

  revalidateProcedureTypePages();
  return { success: t.admin.procedureTypes.createdType(name) };
}

export async function updateProcedureType(id: string, fields: { name: string }) {
  await assertAdminRole();
  const { t } = await getT();

  const name = fields.name.trim();
  if (!name) throw new Error(t.admin.procedureTypes.errors.nameRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("procedure_types")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateProcedureTypePages();
}

export async function deleteProcedureType(id: string) {
  await assertAdminRole();
  const { t } = await getT();

  // procedures.procedure_type_id has no cascade: a type that has ever been
  // logged is part of a resident's medical record. Say so instead of
  // surfacing the foreign-key error.
  const count = await countProcedures(id);
  if (count > 0) {
    throw new Error(t.admin.procedureTypes.errors.hasProcedures(count));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("procedure_types")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateProcedureTypePages();
}

/**
 * Moves every procedure from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0047). Returns how many procedures moved.
 */
export async function mergeProcedureType(fromId: string, intoId: string) {
  await assertAdminRole();
  const { t } = await getT();
  if (fromId === intoId) {
    throw new Error(t.admin.procedureTypes.errors.mergeSelf);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merge_procedure_type", {
    p_from: fromId,
    p_into: intoId,
  });
  if (error) throw new Error(error.message);

  revalidateProcedureTypePages();
  return (data as number | null) ?? 0;
}
