"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type EnclosureFormState = { error: string } | { success: string } | undefined;

export async function createEnclosure(
  _state: EnclosureFormState,
  formData: FormData,
): Promise<EnclosureFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const name = (formData.get("name") as string | null)?.trim();
  const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
  const zoneId = formData.get("zoneId") as string | null;
  const capacityRaw = formData.get("capacity") as string | null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!name) return { error: t.admin.enclosures.errors.nameRequired };
  if (!zoneId) return { error: t.admin.enclosures.errors.selectZone };

  let capacity: number | null = null;
  if (capacityRaw) {
    capacity = Number(capacityRaw);
    if (!Number.isFinite(capacity) || capacity < 0) {
      return { error: t.admin.enclosures.errors.capacityNonNegative };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("enclosures")
    .insert({ name, name_th: nameTh, zone_id: zoneId, capacity, notes });

  if (error) return { error: error.message };

  revalidatePath("/admin/enclosures");
  return { success: t.admin.enclosures.createdEnclosure(name) };
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
) {
  await assertAdminRole();
  const { t } = await getT();
  if (!fields.name.trim()) throw new Error(t.admin.enclosures.errors.nameRequired);
  if (!fields.zoneId) throw new Error(t.admin.enclosures.errors.selectZone);

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

  if (error) throw new Error(error.message);
  revalidatePath("/admin/enclosures");
}

export async function deleteEnclosure(id: string) {
  await assertAdminRole();

  const supabase = await createClient();
  const { error } = await supabase.from("enclosures").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/enclosures");
}
