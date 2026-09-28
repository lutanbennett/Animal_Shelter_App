"use server";

import { revalidatePath } from "next/cache";
import {
  runAction,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ZoneFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export async function createZone(
  _state: ZoneFormState,
  formData: FormData,
): Promise<ZoneFormState> {
  const { t } = await getT();
  return runAction("zones.createZone", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
    const internal = formData.get("internal") === "on";

    if (!name) return refuse(t.admin.zones.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("zones").insert({ name, name_th: nameTh, internal });

    if (error) return refuse(error.message);

    revalidatePath("/admin/zones");
    return { ok: true, success: t.admin.zones.createdZone(name) };
  });
}

export async function updateZone(
  id: string,
  name: string,
  nameTh: string | null,
  internal: boolean,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.updateZone", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!name.trim()) return refuse(t.admin.zones.errors.nameRequired);

    const supabase = await createClient();
    const { error } = await supabase
      .from("zones")
      .update({ name: name.trim(), name_th: nameTh?.trim() || null, internal })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/zones");
    return { ok: true };
  });
}

export async function deleteZone(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.deleteZone", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("zones").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/zones");
    return { ok: true };
  });
}
