"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { MIN_SHAPE_AREA, parseShape, shapeArea, type Point } from "@/lib/facility-map/geometry";
import { isRoomKind } from "@/lib/facility-map/rooms";
import { planImageProblem, type PlanImageProblem } from "@/lib/facility-map/plan-image";
import {
  appendHistory,
  readHistory,
  storePlanImage,
  undoableReplace,
  type HistoryEntry,
  type ShapeSnapshot,
} from "@/lib/facility-map/plan-store";
import { userNameOf } from "@/lib/auth/user-name";

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

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

type Supabase = Awaited<ReturnType<typeof createClient>>;
type PlanRow = { id: string; kind: "overview" | "zone"; zone_id: string | null; image_path: string; width: number; height: number };

/** The shapes drawn on one plan: the zones on the overview, a zone's enclosures on its own, and any room on it. */
async function shapesOn(supabase: Supabase, plan: PlanRow): Promise<ShapeSnapshot> {
  type ShapeRow = { id: string; map_shape: unknown };
  const [places, rooms] = await Promise.all([
    plan.kind === "overview"
      ? supabase.from("zones").select("id, map_shape").not("map_shape", "is", null).returns<ShapeRow[]>()
      : supabase.from("enclosures").select("id, map_shape").eq("zone_id", plan.zone_id!).not("map_shape", "is", null).returns<ShapeRow[]>(),
    supabase.from("map_rooms").select("kind, shape").eq("map_id", plan.id).returns<{ kind: string; shape: unknown }[]>(),
  ]);
  if (places.error) throw places.error;
  if (rooms.error) throw rooms.error;
  const list = (places.data ?? []).flatMap((r) => {
    const shape = parseShape(r.map_shape);
    return shape ? [{ id: r.id, shape }] : [];
  });
  return {
    zones: plan.kind === "overview" ? list : [],
    enclosures: plan.kind === "zone" ? list : [],
    rooms: (rooms.data ?? []).flatMap((r) => {
      const shape = parseShape(r.shape);
      return shape ? [{ kind: r.kind, shape }] : [];
    }),
  };
}

/** Takes every shape off one plan (a replace that is a new layout, or an undo of one). */
async function clearShapesOn(supabase: Supabase, plan: PlanRow) {
  const places =
    plan.kind === "overview"
      ? await supabase.from("zones").update({ map_shape: null }).not("map_shape", "is", null)
      : await supabase.from("enclosures").update({ map_shape: null }).eq("zone_id", plan.zone_id!).not("map_shape", "is", null);
  if (places.error) throw places.error;
  const rooms = await supabase.from("map_rooms").delete().eq("map_id", plan.id);
  if (rooms.error) throw rooms.error;
}

/** Puts a snapshot's shapes back, one row each (a plan holds a few dozen at most). */
async function restoreShapes(supabase: Supabase, planId: string, snap: ShapeSnapshot) {
  const writes = [
    ...snap.zones.map((z) => supabase.from("zones").update({ map_shape: z.shape }).eq("id", z.id)),
    ...snap.enclosures.map((x) => supabase.from("enclosures").update({ map_shape: x.shape }).eq("id", x.id)),
    ...snap.rooms
      .filter((r) => isRoomKind(r.kind))
      .map((r) => supabase.from("map_rooms").upsert({ kind: r.kind, map_id: planId, shape: r.shape }, { onConflict: "kind" })),
  ];
  for (const { error } of await Promise.all(writes)) if (error) throw error;
}

async function who(supabase: Supabase): Promise<HistoryEntry["by"]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { id: user?.id ?? "", name: userNameOf(user) ?? user?.email ?? "" };
}

async function readPlan(supabase: Supabase, planId: string) {
  return supabase.from("facility_maps").select("id, kind, zone_id, image_path, width, height").eq("id", planId).maybeSingle<PlanRow>();
}

/**
 * Adds a plan, or replaces the picture of one, from a file the editor uploads
 * (docs/decisions/2026-10-08-facility-map-plans-uploaded.md).
 *
 *   mode=add      zoneId ("" for the overview)
 *   mode=replace  planId, shapes=keep|clear
 *
 * The file's type and size come from its own bytes (WebP, PNG or JPEG, at most about 5 MB). The new
 * image is stored under a name of its own before the row is touched, and the old one is never deleted,
 * so a failure part-way leaves the plan as it was and a replace can be undone. With shapes=clear, the
 * shapes on the plan are recorded in the plan's history first, then taken off.
 */
export async function uploadPlan(form: FormData): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.admin.facilityMap.errors;
  return runAction("facilityMap.uploadPlan", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) return refuse(e.noFile);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = planImageProblem(bytes);
    if ("problem" in checked) return refuse(problemText(e, checked.problem));
    const { type, width, height } = checked.info;

    const supabase = await createClient();
    const by = await who(supabase);
    const mode = form.get("mode");

    if (mode === "add") {
      const zoneId = String(form.get("zoneId") ?? "") || null;
      // Asked first so a refused add stores nothing; the unique index (23505 below) still decides a race.
      const existing = zoneId
        ? await supabase.from("facility_maps").select("id").eq("zone_id", zoneId).limit(1)
        : await supabase.from("facility_maps").select("id").eq("kind", "overview").limit(1);
      if (existing.error) return databaseFailure("facilityMap.uploadPlan", existing.error, t.common);
      if (existing.data.length) return refuse(e.alreadyHasPlan);
      const id = crypto.randomUUID();
      const imagePath = await storePlanImage(id, bytes, type);
      const { error } = await supabase
        .from("facility_maps")
        .insert({ id, kind: zoneId ? "zone" : "overview", zone_id: zoneId, image_path: imagePath, width, height });
      if (error) {
        // 23505: that zone (or the overview) already has a plan.
        if (error.code === "23505") return refuse(e.alreadyHasPlan);
        return databaseFailure("facilityMap.uploadPlan", error, t.common);
      }
      await appendHistory(id, { at: new Date().toISOString(), by, action: "add", from: null, to: { image_path: imagePath, width, height }, shapes: "kept" });
      refreshMapViews();
      return { ok: true, id };
    }

    if (mode !== "replace") return refuse(e.notFound);
    const clear = form.get("shapes") === "clear";
    const { data: plan, error: readError } = await readPlan(supabase, String(form.get("planId") ?? ""));
    if (readError) return databaseFailure("facilityMap.uploadPlan", readError, t.common);
    if (!plan) return refuse(e.notFound);

    const imagePath = await storePlanImage(plan.id, bytes, type);
    const cleared = clear ? await shapesOn(supabase, plan) : undefined;
    const { data: updated, error } = await supabase
      .from("facility_maps")
      .update({ image_path: imagePath, width, height })
      .eq("id", plan.id)
      .select("id");
    if (error) return databaseFailure("facilityMap.uploadPlan", error, t.common);
    if (!updated?.length) return refuse(e.notFound);
    // Recorded before the shapes go, so what was taken off can always be put back.
    await appendHistory(plan.id, {
      at: new Date().toISOString(),
      by,
      action: "replace",
      from: { image_path: plan.image_path, width: plan.width, height: plan.height },
      to: { image_path: imagePath, width, height },
      shapes: clear ? "cleared" : "kept",
      cleared,
    });
    if (clear) await clearShapesOn(supabase, plan);

    refreshMapViews();
    return { ok: true, id: plan.id };
  });
}

/**
 * Puts back the picture a replace took away, and, if that replace cleared the shapes, the shapes too
 * (anything placed on the new picture since is taken off, because it was placed on a layout that is
 * no longer shown). Only the latest replace, and only while the plan still shows its picture.
 */
export async function undoReplace(planId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.facilityMap.errors;
  return runAction("facilityMap.undoReplace", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { data: plan, error: readError } = await readPlan(supabase, planId);
    if (readError) return databaseFailure("facilityMap.undoReplace", readError, t.common);
    if (!plan) return refuse(e.notFound);

    const last = undoableReplace(await readHistory(plan.id), plan.image_path);
    if (!last?.from) return refuse(e.nothingToUndo);

    const { error } = await supabase.from("facility_maps").update(last.from).eq("id", plan.id);
    if (error) return databaseFailure("facilityMap.undoReplace", error, t.common);
    await appendHistory(plan.id, {
      at: new Date().toISOString(),
      by: await who(supabase),
      action: "undo",
      from: last.to,
      to: last.from,
      shapes: last.shapes,
      cleared: last.shapes === "cleared" ? await shapesOn(supabase, plan) : undefined,
    });
    if (last.shapes === "cleared" && last.cleared) {
      await clearShapesOn(supabase, plan);
      await restoreShapes(supabase, plan.id, last.cleared);
    }

    refreshMapViews();
    return { ok: true };
  });
}

function problemText(e: { wrongType: string; tooLarge: string; pictureTooSmall: string; pictureTooBig: string }, problem: PlanImageProblem) {
  return { type: e.wrongType, tooLarge: e.tooLarge, tooSmall: e.pictureTooSmall, tooBig: e.pictureTooBig }[problem];
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
