"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ZoneFormState = { error: string } | { success: string } | undefined;

export async function createZone(
  _state: ZoneFormState,
  formData: FormData,
): Promise<ZoneFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = (formData.get("name") as string | null)?.trim();
  const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
  const internal = formData.get("internal") === "on";

  if (!name) return { error: t.admin.zones.errors.nameRequired };

  const supabase = await createClient();
  const { error } = await supabase.from("zones").insert({ name, name_th: nameTh, internal });

  if (error) return { error: error.message };

  revalidatePath("/admin/zones");
  return { success: t.admin.zones.createdZone(name) };
}

export async function updateZone(
  id: string,
  name: string,
  nameTh: string | null,
  internal: boolean,
) {
  await assertAdminRole();
  const { t } = await getT();
  if (!name.trim()) throw new Error(t.admin.zones.errors.nameRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("zones")
    .update({ name: name.trim(), name_th: nameTh?.trim() || null, internal })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/zones");
}

export async function deleteZone(id: string) {
  await assertAdminRole();

  const supabase = await createClient();
  const { error } = await supabase.from("zones").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/zones");
}
