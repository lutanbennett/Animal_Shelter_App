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
import { parseZoneColour } from "@/lib/zones/palette";

export type ZoneFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export async function createZone(
  _state: ZoneFormState,
  formData: FormData,
): Promise<ZoneFormState> {
  const { t } = await getT();
  return runAction("zones.createZone", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = (formData.get("name") as string | null)?.trim();
    const nameTh = (formData.get("nameTh") as string | null)?.trim() || null;
    const internal = formData.get("internal") === "on";
    const colour = parseZoneColour(formData.get("colour"));

    if (!name) return refuse(t.admin.zones.errors.nameRequired);
    if (colour === undefined) return refuse(t.admin.zones.colourInvalid);

    const supabase = await createClient();
    const { error } = await supabase.from("zones").insert({ name, name_th: nameTh, internal, colour });

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
  colourValue: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.updateZone", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!name.trim()) return refuse(t.admin.zones.errors.nameRequired);
    const colour = parseZoneColour(colourValue);
    if (colour === undefined) return refuse(t.admin.zones.colourInvalid);

    const supabase = await createClient();
    const { error } = await supabase
      .from("zones")
      .update({ name: name.trim(), name_th: nameTh?.trim() || null, internal, colour })
      .eq("id", id);

    if (error) return refuse(error.message);
    // The dot shows wherever a zone is named, not only on this page.
    revalidatePath("/", "layout");
    return { ok: true };
  });
}

export async function deleteZone(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.deleteZone", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("zones").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidatePath("/admin/zones");
    return { ok: true };
  });
}

type OrderRow = { id: string; name: string; sort_order: number | null };

/** Writes `ordered` as the zones' order, 1..n, touching only rows whose number changes. */
async function saveZoneOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordered: OrderRow[],
  failed: string,
): Promise<ActionResult> {
  const results = await Promise.all(
    renumbered(ordered).map((row) =>
      supabase.from("zones").update({ sort_order: row.sort_order }).eq("id", row.id),
    ),
  );
  const error = results.find((r) => r.error)?.error;
  if (error) return refuse(error.message ?? failed);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** The physical zones in the order they show. Lifecycle takes no order (0161), so it is not in the list. */
async function loadZoneOrder(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("zones")
    .select("id, name, sort_order")
    .neq("name", SYSTEM_ZONE)
    .returns<OrderRow[]>();
}

/** Move up / Move down, as Management → Shelter Friends' moveFriend: swap, then renumber the list. */
export async function moveZone(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.moveZone", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data, error } = await loadZoneOrder(supabase);
    if (error) return refuse(error.message);
    if (!data?.some((zone) => zone.id === id)) return refuse(t.admin.placeOrder.lifecycleRefused);
    const ordered = movedInOrder(data, id, direction);
    if (!ordered) return { ok: true };
    return saveZoneOrder(supabase, ordered, t.common.failedToReorder);
  });
}

/** Sort A-Z (numbers in order), as a starting point to move from. */
export async function sortZonesByName(): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("zones.sortZonesByName", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data, error } = await loadZoneOrder(supabase);
    if (error) return refuse(error.message);
    return saveZoneOrder(supabase, byNameInOrder(data ?? []), t.common.failedToReorder);
  });
}
