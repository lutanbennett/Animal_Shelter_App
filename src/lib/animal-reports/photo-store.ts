import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { actingShelterId } from "@/lib/supabase/acting-shelter";

/**
 * Where a public report's photo lives: the private bucket made by 0377. No storage policy exists for it, so only the
 * service role reaches it: the report action writes, and the staff photo route (which asks animal_report.manage) reads.
 * The object name is "<report id>.jpg", the same name the row's check constraint demands.
 */
export const REPORT_PHOTO_BUCKET = "animal-report-photos";
export const REPORT_PHOTO_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

/** True when stored, or already there (a replay of the same report). */
export async function storeReportPhoto(reportId: string, jpeg: Buffer): Promise<boolean> {
  // The object is named by a report id the caller has just minted, and the report row (stamped with the acting shelter)
  // is inserted straight after. With no acting shelter that row could not be placed, so nothing is stored.
  if (!(await actingShelterId())) return false;
  const { error } = await createAdminClient()
    .storage.from(REPORT_PHOTO_BUCKET)
    .upload(`${reportId}.jpg`, jpeg, { contentType: "image/jpeg", upsert: false, cacheControl: "0" });
  return !error || /already exists|Duplicate/i.test(error.message);
}

export async function readReportPhoto(name: string): Promise<ArrayBuffer | null> {
  if (!REPORT_PHOTO_NAME.test(name)) return null;
  // The name is a report id: serve it only when that report row belongs to the acting shelter.
  const shelterId = await actingShelterId();
  if (!shelterId) return null;
  const db = createAdminClient();
  const { data: report } = await db.from("animal_reports").select("id").eq("id", name.replace(/\.jpg$/, "")).eq("shelter_id", shelterId).maybeSingle();
  if (!report) return null;
  const { data, error } = await db.storage.from(REPORT_PHOTO_BUCKET).download(name);
  if (error || !data) return null;
  return data.arrayBuffer();
}

export type StoredReportPhoto = { name: string; createdAt: string | null };

/** One page of the bucket's objects, oldest name first. Only names of the right shape are returned (REPORT_PHOTO_NAME). */
export async function listReportPhotos(offset: number, limit: number): Promise<StoredReportPhoto[] | null> {
  const { data, error } = await createAdminClient()
    .storage.from(REPORT_PHOTO_BUCKET)
    .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
  if (error || !data) return null;
  return data
    .filter((o) => REPORT_PHOTO_NAME.test(o.name))
    .map((o) => ({ name: o.name, createdAt: o.created_at ?? null }));
}

/** Removes objects by name; names of the wrong shape are dropped, never sent. Returns how many it asked to remove, or null on failure. */
export async function removeReportPhotos(names: string[]): Promise<number | null> {
  const valid = names.filter((n) => REPORT_PHOTO_NAME.test(n));
  if (!valid.length) return 0;
  const { error } = await createAdminClient().storage.from(REPORT_PHOTO_BUCKET).remove(valid);
  return error ? null : valid.length;
}
