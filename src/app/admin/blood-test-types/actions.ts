"use server";

import { refresh, revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type BloodTestTypeFormState =
  | { error: string }
  | { success: string }
  | undefined;

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
  await assertAdminRole();
  const { t } = await getT();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: t.admin.bloodTestTypes.errors.nameRequired };

  const supabase = await createClient();
  const { error } = await supabase.from("blood_test_types").insert({ name });

  if (error) return { error: error.message };

  revalidateBloodTestTypePages();
  return { success: t.admin.bloodTestTypes.createdType(name) };
}

export async function updateBloodTestType(id: string, fields: { name: string }) {
  await assertAdminRole();
  const { t } = await getT();

  const name = fields.name.trim();
  if (!name) throw new Error(t.admin.bloodTestTypes.errors.nameRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_test_types")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBloodTestTypePages();
}

export async function deleteBloodTestType(id: string) {
  await assertAdminRole();
  const { t } = await getT();

  // blood_tests.blood_test_type_id has no cascade: a type that has ever been
  // logged is part of a resident's medical record. Say so instead of
  // surfacing the foreign-key error.
  const count = await countBloodTests(id);
  if (count > 0) {
    throw new Error(t.admin.bloodTestTypes.errors.hasBloodTests(count));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_test_types")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBloodTestTypePages();
}

/**
 * Moves every blood test from `fromId` onto `intoId` and deletes `fromId`,
 * in one transaction (0050). Returns how many blood tests moved.
 */
export async function mergeBloodTestType(fromId: string, intoId: string) {
  await assertAdminRole();
  const { t } = await getT();
  if (fromId === intoId) {
    throw new Error(t.admin.bloodTestTypes.errors.mergeSelf);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merge_blood_test_type", {
    p_from: fromId,
    p_into: intoId,
  });
  if (error) throw new Error(error.message);

  revalidateBloodTestTypePages();
  return (data as number | null) ?? 0;
}
