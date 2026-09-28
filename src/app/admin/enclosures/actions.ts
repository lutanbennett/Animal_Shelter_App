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

export type EnclosureFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export async function createEnclosure(
  _state: EnclosureFormState,
  formData: FormData,
): Promise<EnclosureFormState> {
  const { t } = await getT();
  return runAction("enclosures.createEnclosure", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
    const zoneId = formData.get("zoneId") as string | null;
    const capacityRaw = formData.get("capacity") as string | null;
    const notes = (formData.get("notes") as string | null)?.trim() || null;

    if (!name) return refuse(t.admin.enclosures.errors.nameRequired);
    if (!zoneId) return refuse(t.admin.enclosures.errors.selectZone);

    let capacity: number | null = null;
    if (capacityRaw) {
      capacity = Number(capacityRaw);
      if (!Number.isFinite(capacity) || capacity < 0) {
        return refuse(t.admin.enclosures.errors.capacityNonNegative);
      }
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("enclosures")
      .insert({ name, name_th: nameTh, zone_id: zoneId, capacity, notes });

    if (error) return refuse(error.message);

    revalidatePath("/admin/enclosures");
    return { ok: true, success: t.admin.enclosures.createdEnclosure(name) };
  });
}

export async function updateEnclosure(
  id: string,
  fields: {
    name: string;
    nameTh: string | null;
    zoneId: string;
    capacity: number | null;
    notes: string | null;
  },
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("enclosures.updateEnclosure", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!fields.name.trim()) return refuse(t.admin.enclosures.errors.nameRequired);
    if (!fields.zoneId) return refuse(t.admin.enclosures.errors.selectZone);

    const supabase = await createClient();
    const { error } = await supabase
      .from("enclosures")
      .update({
        name: fields.name.trim(),
        name_th: fields.nameTh?.trim() || null,
        zone_id: fields.zoneId,
        capacity: fields.capacity,
        notes: fields.notes?.trim() || null,
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/enclosures");
    return { ok: true };
  });
}

export async function deleteEnclosure(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("enclosures.deleteEnclosure", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("enclosures").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/enclosures");
    return { ok: true };
  });
}
