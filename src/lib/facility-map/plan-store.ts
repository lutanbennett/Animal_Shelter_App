import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Point } from "./geometry";
import { PLAN_EXTENSIONS, PLAN_MAX_BYTES, type PlanImageType } from "./plan-image";
import { STORED_PREFIX } from "./types";

/**
 * Where uploaded plan images live: a private Supabase Storage bucket
 * (docs/decisions/2026-10-08-facility-map-plans-uploaded.md). Only the service role touches it, and
 * only from the facility-map actions (which check `facility.enclosures` first) and the image route
 * (which checks the caller is signed in), so the bucket needs no storage policies of its own.
 *
 * Layout, per plan row:
 *   plans/<plan id>/<millis>-<random>.<ext>   every image the plan has ever had; never deleted
 *   plans/<plan id>/history.json              who replaced it, when, and what it was before
 *
 * An image's name is new on every upload, so its URL can be cached for a year: a replaced plan has a
 * new `image_path` and the map asks for the new name at once.
 */
export const PLAN_BUCKET = "facility-maps";

/** `plans/<uuid>/<millis>-<random>.<ext>`: the only object names the image route will serve. */
export const PLAN_OBJECT = /^plans\/[0-9a-f-]{36}\/\d{13}-[a-z0-9]{8}\.(webp|png|jpg)$/;

export type ShapeSnapshot = {
  zones: { id: string; shape: Point[] }[];
  enclosures: { id: string; shape: Point[] }[];
  rooms: { kind: string; shape: Point[] }[];
};

export type PlanVersion = { image_path: string; width: number; height: number };

export type HistoryEntry = {
  at: string;
  by: { id: string; name: string };
  action: "add" | "replace" | "undo";
  from: PlanVersion | null;
  to: PlanVersion;
  /** The replace that cleared the shapes keeps what they were, so an undo can put them back. */
  shapes: "kept" | "cleared";
  cleared?: ShapeSnapshot;
};

let bucketChecked = false;

/** Creates the bucket the first time it is needed, so a new environment needs no setup step. */
async function ensureBucket() {
  if (bucketChecked) return;
  const storage = createAdminClient().storage;
  const { data } = await storage.getBucket(PLAN_BUCKET);
  if (!data) {
    const { error } = await storage.createBucket(PLAN_BUCKET, {
      public: false,
      fileSizeLimit: PLAN_MAX_BYTES,
      allowedMimeTypes: [...Object.keys(PLAN_EXTENSIONS), "application/json"],
    });
    // Two first uploads at once: the other one made it.
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketChecked = true;
}

/** Stores one image under a name nothing else has used, and returns the `image_path` for the row. */
export async function storePlanImage(planId: string, bytes: Uint8Array, type: PlanImageType): Promise<string> {
  await ensureBucket();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("");
  const name = `plans/${planId}/${Date.now()}-${random}.${PLAN_EXTENSIONS[type]}`;
  const { error } = await createAdminClient()
    .storage.from(PLAN_BUCKET)
    .upload(name, bytes, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return `${STORED_PREFIX}${name}`;
}

/** The image's bytes and type, or null when there is no such object. */
export async function readPlanImage(objectName: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  const { data, error } = await createAdminClient().storage.from(PLAN_BUCKET).download(objectName);
  if (error || !data) return null;
  return { body: await data.arrayBuffer(), type: data.type || "application/octet-stream" };
}

const historyName = (planId: string) => `plans/${planId}/history.json`;

/** Oldest first; empty when the plan has never been uploaded or replaced here. */
export async function readHistory(planId: string): Promise<HistoryEntry[]> {
  const { data, error } = await createAdminClient().storage.from(PLAN_BUCKET).download(historyName(planId));
  if (error || !data) return [];
  try {
    const parsed: unknown = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function appendHistory(planId: string, entry: HistoryEntry): Promise<void> {
  await ensureBucket();
  const history = [...(await readHistory(planId)), entry];
  const { error } = await createAdminClient()
    .storage.from(PLAN_BUCKET)
    .upload(historyName(planId), JSON.stringify(history, null, 1), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (error) throw error;
}

/** The replace an Undo would reverse: the last entry, if it is a replace and the plan still shows its image. */
export function undoableReplace(history: HistoryEntry[], currentPath: string): HistoryEntry | null {
  const last = history.at(-1);
  if (!last || last.action !== "replace" || !last.from || last.to.image_path !== currentPath) return null;
  return last;
}
