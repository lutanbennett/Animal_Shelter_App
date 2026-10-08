"use server";

import { revalidatePath } from "next/cache";
import {
  runAction,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { byNameInOrder, movedInOrder, renumbered } from "@/lib/enclosures/order";

export type EnclosureFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export async function createEnclosure(
  _state: EnclosureFormState,
  formData: FormData,
): Promise<EnclosureFormState> {
  const { t } = await getT();
  return runAction("enclosures.createEnclosure", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

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
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
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
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("enclosures").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/enclosures");
    return { ok: true };
  });
}

type OrderRow = { id: string; name: string; sort_order: number | null; zone_id: string };

/** The enclosures of one zone, for its order. Null for the Lifecycle zone, which takes no order (0161). */
async function loadZoneEnclosures(
  supabase: Awaited<ReturnType<typeof createClient>>,
  zoneId: string,
) {
  const { data: zone, error: zoneError } = await supabase
    .from("zones")
    .select("name")
    .eq("id", zoneId)
    .maybeSingle<{ name: string }>();
  if (zoneError) return { error: zoneError.message, rows: null };
  if (!zone || zone.name === SYSTEM_ZONE) return { error: null, rows: null };
  const { data, error } = await supabase
    .from("enclosures")
    .select("id, name, sort_order, zone_id")
    .eq("zone_id", zoneId)
    .returns<OrderRow[]>();
  return { error: error?.message ?? null, rows: data ?? [] };
}

async function saveEnclosureOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordered: OrderRow[],
  failed: string,
): Promise<ActionResult> {
  const results = await Promise.all(
    renumbered(ordered).map((row) =>
      supabase.from("enclosures").update({ sort_order: row.sort_order }).eq("id", row.id),
    ),
  );
  const error = results.find((r) => r.error)?.error;
  if (error) return refuse(error.message ?? failed);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Move up / Move down within the enclosure's own zone, never across zones. */
export async function moveEnclosure(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("enclosures.moveEnclosure", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data: enclosure, error } = await supabase
      .from("enclosures")
      .select("zone_id")
      .eq("id", id)
      .maybeSingle<{ zone_id: string }>();
    if (error) return refuse(error.message);
    if (!enclosure) return refuse(t.common.failedToReorder);
    const loaded = await loadZoneEnclosures(supabase, enclosure.zone_id);
    if (loaded.error) return refuse(loaded.error);
    if (!loaded.rows) return refuse(t.admin.placeOrder.lifecycleRefused);
    const ordered = movedInOrder(loaded.rows, id, direction);
    if (!ordered) return { ok: true };
    return saveEnclosureOrder(supabase, ordered, t.common.failedToReorder);
  });
}

/** Sort A-Z (numbers in order) within one zone, as a starting point to move from. */
export async function sortEnclosuresByName(zoneId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("enclosures.sortEnclosuresByName", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const loaded = await loadZoneEnclosures(supabase, zoneId);
    if (loaded.error) return refuse(loaded.error);
    if (!loaded.rows) return refuse(t.admin.placeOrder.lifecycleRefused);
    return saveEnclosureOrder(supabase, byNameInOrder(loaded.rows), t.common.failedToReorder);
  });
}
