"use server";

import { refresh, revalidatePath } from "next/cache";
import {
  runWriteAction,
  type ActionRefusal,
  type ActionResult,
  type WriteMessages,
} from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

export type ProcedureTypeFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function revalidateProcedureTypePages() {
  revalidatePath("/admin/procedure-types");
  // The procedure form's picker and the hub's procedure_types(name) embeds
  // read this table too.
  revalidatePath("/procedures/new");
  revalidatePath("/residents", "layout");
  // revalidatePath alone leaves the client router showing the row it had
  // when the action was called from a button (a <form action> refreshes
  // on its own); refresh() re-renders the page the caller is on.
  refresh();
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
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("procedureTypes.createProcedureType", write(t), { id: writeRequestIdFrom(formData), action: "procedureTypes.createProcedureType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return refuse(t.admin.procedureTypes.errors.nameRequired);
    // Optional: an empty Thai name means Thai readers see the English (0166).
    const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
    const { error } = await supabase.from("procedure_types").insert({ name, name_th: nameTh });

    if (error) return refuse(error.message);

    revalidateProcedureTypePages();
    return { ok: true, success: t.admin.procedureTypes.createdType(name) };
  });
}

export async function updateProcedureType(
  id: string,
  requestId: string,
  fields: { name: string; nameTh: string },
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("procedureTypes.updateProcedureType", write(t), { id: requestId, action: "procedureTypes.updateProcedureType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = fields.name.trim();
    if (!name) return refuse(t.admin.procedureTypes.errors.nameRequired);
    const { error } = await supabase
      .from("procedure_types")
      .update({ name, name_th: fields.nameTh.trim() || null })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateProcedureTypePages();
    return { ok: true };
  });
}

export async function deleteProcedureType(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("procedureTypes.deleteProcedureType", write(t), { id: requestId, action: "procedureTypes.deleteProcedureType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    // procedures.procedure_type_id has no cascade: a type that has ever been
    // logged is part of a resident's medical record. Say so instead of
    // surfacing the foreign-key error.
    const count = await countProcedures(id);
    if (count > 0) {
      return refuse(t.admin.procedureTypes.errors.hasProcedures(count));
    }
    const { error } = await supabase
      .from("procedure_types")
      .delete()
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateProcedureTypePages();
    return { ok: true };
  });
}

/**
 * Moves every procedure from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0047). Returns how many procedures moved.
 */
export async function mergeProcedureType(
  fromId: string,
  requestId: string,
  intoId: string,
): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("procedureTypes.mergeProcedureType", write(t), { id: requestId, action: "procedureTypes.mergeProcedureType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);
    if (fromId === intoId) {
      return refuse(t.admin.procedureTypes.errors.mergeSelf);
    }
    const { data, error } = await supabase.rpc("merge_procedure_type", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);

    revalidateProcedureTypePages();
    return { ok: true, count: (data as number | null) ?? 0 };
  });
}
