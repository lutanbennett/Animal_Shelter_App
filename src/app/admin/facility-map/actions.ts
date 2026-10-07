"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { MIN_SHAPE_AREA, parseShape, shapeArea, type Point } from "@/lib/facility-map/geometry";
import { isRoomKind } from "@/lib/facility-map/rooms";

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** A plain file name inside public/facility-maps/: no folders, no dots at the front, an image extension. */
const PLAN_FILE = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,120}\.(webp|png|jpe?g|svg)$/i;

function refreshMapViews() {
  revalidatePath("/admin/facility-map");
  revalidatePath("/enclosures");
}

/**
 * Stores (or, with `null`, clears) where one enclosure or one zone sits on its plan. The shape is
 * re-parsed here with the same `parseShape` the map reads with, so a buggy client cannot store what the
 * map cannot draw; the database's check constraint is the second line, the Lifecycle trigger the third.
 */
export async function saveShape(
  target: "zone" | "enclosure",
  id: string,
  shape: Point[] | null,
): Promise<ActionResult<{ shape: Point[] | null }>> {
  const { t } = await getT();
  const e = t.admin.facilityMap.errors;
  return runAction("facilityMap.saveShape", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    let value: Point[] | null = null;
    if (shape !== null) {
      value = parseShape(shape);
      if (!value) return refuse(e.badShape);
      if (shapeArea(value) < MIN_SHAPE_AREA) return refuse(e.tooSmall);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from(target === "zone" ? "zones" : "enclosures")
      .update({ map_shape: value })
      .eq("id", id)
      .select("id");
    if (error) return databaseFailure("facilityMap.saveShape", error, t.common);
    if (!data?.length) return refuse(e.notFound);

    refreshMapViews();
    return { ok: true, shape: value };
  });
}

/**
 * Puts the Medical room, Kitchen or Storage on a plan, or (with `null`) takes it off. A room is not an
 * enclosure, so it has its own table (0157 `map_rooms`): one row per kind, and drawing it on another
 * plan moves it rather than adding a second. Same re-parse and size check as `saveShape`.
 */
export async function saveRoom(
  kind: string,
  mapId: string,
  shape: Point[] | null,
): Promise<ActionResult<{ shape: Point[] | null }>> {
  const { t } = await getT();
  const e = t.admin.facilityMap.errors;
  return runAction("facilityMap.saveRoom", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!isRoomKind(kind)) return refuse(e.notFound);

    const supabase = await createClient();
    if (shape === null) {
      const { error } = await supabase.from("map_rooms").delete().eq("kind", kind);
      if (error) return databaseFailure("facilityMap.saveRoom", error, t.common);
      refreshMapViews();
      return { ok: true, shape: null };
    }

    const value = parseShape(shape);
    if (!value) return refuse(e.badShape);
    if (shapeArea(value) < MIN_SHAPE_AREA) return refuse(e.tooSmall);

    const { error } = await supabase.from("map_rooms").upsert({ kind, map_id: mapId, shape: value }, { onConflict: "kind" });
    if (error) {
      // 23503: the plan was removed while the editor was open.
      if (error.code === "23503") return refuse(e.notFound);
      return databaseFailure("facilityMap.saveRoom", error, t.common);
    }

    refreshMapViews();
    return { ok: true, shape: value };
  });
}

/**
 * Registers a plan image that is already in `public/facility-maps/`. The browser read `width` and
 * `height` off the loaded image, so a name that is not a picture never gets here; nothing about the
 * file is processed on the server (the Pi and the Worker only ever serve it).
 */
export async function addPlan(
  zoneId: string | null,
  imagePath: string,
  width: number,
  height: number,
): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.admin.facilityMap.errors;
  return runAction("facilityMap.addPlan", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const name = imagePath.trim();
    if (!PLAN_FILE.test(name)) return refuse(e.badFileName);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000) {
      return refuse(e.badSize);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("facility_maps")
      .insert({ kind: zoneId ? "zone" : "overview", zone_id: zoneId, image_path: name, width, height })
      .select("id")
      .single();
    if (error) {
      // 23505: that zone (or the overview) already has a plan.
      if (error.code === "23505") return refuse(e.alreadyHasPlan);
      return databaseFailure("facilityMap.addPlan", error, t.common);
    }

    refreshMapViews();
    return { ok: true, id: data.id };
  });
}

/** Drops a plan. The shapes drawn on it stay on their enclosures and come back if a plan is added again. */
export async function removePlan(planId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("facilityMap.removePlan", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { error } = await supabase.from("facility_maps").delete().eq("id", planId);
    if (error) return databaseFailure("facilityMap.removePlan", error, t.common);

    refreshMapViews();
    return { ok: true };
  });
}
