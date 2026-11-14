import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Where a public report's photo lives: the private bucket made by 0376. No storage policy exists for it, so only the
 * service role reaches it: the report action writes, and the staff photo route (which asks animal_report.manage) reads.
 * The object name is "<report id>.jpg", the same name the row's check constraint demands.
 */
export const REPORT_PHOTO_BUCKET = "animal-report-photos";
export const REPORT_PHOTO_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

/** True when stored, or already there (a replay of the same report). */
export async function storeReportPhoto(reportId: string, jpeg: Buffer): Promise<boolean> {
  const { error } = await createAdminClient()
    .storage.from(REPORT_PHOTO_BUCKET)
    .upload(`${reportId}.jpg`, jpeg, { contentType: "image/jpeg", upsert: false, cacheControl: "0" });
  return !error || /already exists|Duplicate/i.test(error.message);
}

export async function readReportPhoto(name: string): Promise<ArrayBuffer | null> {
  if (!REPORT_PHOTO_NAME.test(name)) return null;
  const { data, error } = await createAdminClient().storage.from(REPORT_PHOTO_BUCKET).download(name);
  if (error || !data) return null;
  return data.arrayBuffer();
}
