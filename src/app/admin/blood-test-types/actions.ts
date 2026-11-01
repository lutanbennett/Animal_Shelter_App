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

export type BloodTestTypeFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function revalidateBloodTestTypePages() {
  revalidatePath("/admin/blood-test-types");
  // The blood test form's picker and the tab's blood_test_types(name) embeds
  // read this table too.
  revalidatePath("/blood-tests/new");
  revalidatePath("/residents", "layout");
  // revalidatePath alone leaves the client router showing the row it had
  // when the action was called from a button (a <form action> refreshes
  // on its own); refresh() re-renders the page the caller is on.
  refresh();
}

async function countBloodTests(id: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("blood_tests")
    .select("id", { count: "exact", head: true })
    .eq("blood_test_type_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createBloodTestType(
  _state: BloodTestTypeFormState,
  formData: FormData,
): Promise<BloodTestTypeFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("bloodTestTypes.createBloodTestType", write(t), { id: writeRequestIdFrom(formData), action: "bloodTestTypes.createBloodTestType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return refuse(t.admin.bloodTestTypes.errors.nameRequired);
    // Optional: an empty Thai name means Thai readers see the English (0166).
    const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
    const { error } = await supabase.from("blood_test_types").insert({ name, name_th: nameTh });

    if (error) return refuse(error.message);

    revalidateBloodTestTypePages();
    return { ok: true, success: t.admin.bloodTestTypes.createdType(name) };
  });
}

export async function updateBloodTestType(
  id: string,
  requestId: string,
  fields: { name: string; nameTh: string },
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("bloodTestTypes.updateBloodTestType", write(t), { id: requestId, action: "bloodTestTypes.updateBloodTestType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = fields.name.trim();
    if (!name) return refuse(t.admin.bloodTestTypes.errors.nameRequired);
    const { error } = await supabase
      .from("blood_test_types")
      .update({ name, name_th: fields.nameTh.trim() || null })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateBloodTestTypePages();
    return { ok: true };
  });
}

export async function deleteBloodTestType(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("bloodTestTypes.deleteBloodTestType", write(t), { id: requestId, action: "bloodTestTypes.deleteBloodTestType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);

    // blood_tests.blood_test_type_id has no cascade: a type that has ever been
    // logged is part of a resident's medical record. Say so instead of
    // surfacing the foreign-key error.
    const count = await countBloodTests(id);
    if (count > 0) {
      return refuse(t.admin.bloodTestTypes.errors.hasBloodTests(count));
    }
    const { error } = await supabase
      .from("blood_test_types")
      .delete()
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateBloodTestTypePages();
    return { ok: true };
  });
}

/**
 * Moves every blood test from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0050). Returns how many blood tests moved.
 */
export async function mergeBloodTestType(
  fromId: string,
  requestId: string,
  intoId: string,
): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("bloodTestTypes.mergeBloodTestType", write(t), { id: requestId, action: "bloodTestTypes.mergeBloodTestType", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reference.types")) return refuse(t.admin.security.errors.adminAccessRequired);
    if (fromId === intoId) {
      return refuse(t.admin.bloodTestTypes.errors.mergeSelf);
    }
    const { data, error } = await supabase.rpc("merge_blood_test_type", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);

    revalidateBloodTestTypePages();
    return { ok: true, count: (data as number | null) ?? 0 };
  });
}
