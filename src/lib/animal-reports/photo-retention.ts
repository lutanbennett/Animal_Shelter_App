import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { listReportPhotos, removeReportPhotos } from "@/lib/animal-reports/photo-store";

/**
 * How long a public report's photo is kept once staff have closed the report (resolved or dismissed). #6rkux.
 * Written in docs/decisions/2026-11-14-report-photo-retention.md.
 */
export const REPORT_PHOTO_RETENTION_DAYS = 90;
/** An object this young may belong to a report whose row is still being inserted (the action uploads first), so it is never an orphan yet. */
const ORPHAN_GRACE_MS = 60 * 60 * 1000;
/** A caller may only SHORTEN the grace (the dev proof needs an orphan to be removable at once); never lengthen past the default. */
const graceFor = (minutes?: number) => (minutes !== undefined && Number.isFinite(minutes) && minutes >= 0 ? Math.min(minutes * 60_000, ORPHAN_GRACE_MS) : ORPHAN_GRACE_MS);
const PAGE = 100;
const MAX_PAGES = 20;

export type RetentionResult = { expiredRemoved: number; orphansRemoved: number; scanned: number; errors: string[] };

/**
 * (a) the photo of a report closed for more than 90 days; (b) any object whose report row is gone.
 * Removes the FILE only: the report row stays, with photo_path cleared so nothing points at a missing file.
 * Service role, as the upload is (registered in docs/hard-coded-security-registry.json); no storage policy, no card.
 */
export async function runReportPhotoRetention(now: Date = new Date(), graceMinutes?: number): Promise<RetentionResult> {
  const db = createAdminClient();
  const result: RetentionResult = { expiredRemoved: 0, orphansRemoved: 0, scanned: 0, errors: [] };

  // (a) expired
  const cutoff = new Date(now.getTime() - REPORT_PHOTO_RETENTION_DAYS * 86_400_000).toISOString();
  const { data: expired, error: expiredError } = await db
    .from("animal_reports")
    .select("id, photo_path")
    .in("status", ["resolved", "dismissed"])
    .not("photo_path", "is", null)
    .or(`handled_at.lt.${cutoff},and(handled_at.is.null,created_at.lt.${cutoff})`)
    .limit(500);
  if (expiredError) {
    result.errors.push(`expired query: ${expiredError.message}`);
  } else if (expired?.length) {
    const removed = await removeReportPhotos(expired.map((r) => r.photo_path as string));
    if (removed === null) {
      result.errors.push("expired remove failed");
    } else {
      const { error } = await db.from("animal_reports").update({ photo_path: null }).in("id", expired.map((r) => r.id));
      if (error) result.errors.push(`expired clear photo_path: ${error.message}`);
      result.expiredRemoved = removed;
    }
  }

  // (b) orphans
  for (let page = 0; page < MAX_PAGES; page++) {
    const objects = await listReportPhotos(page * PAGE, PAGE);
    if (objects === null) {
      result.errors.push("list failed");
      break;
    }
    if (!objects.length) break;
    result.scanned += objects.length;
    const old = objects.filter((o) => !o.createdAt || now.getTime() - new Date(o.createdAt).getTime() > graceFor(graceMinutes));
    if (old.length) {
      const ids = old.map((o) => o.name.replace(/\.jpg$/, ""));
      const { data: rows, error } = await db.from("animal_reports").select("id").in("id", ids);
      if (error) {
        result.errors.push(`orphan lookup: ${error.message}`);
        break;
      }
      const have = new Set((rows ?? []).map((r) => r.id as string));
      const orphans = old.filter((o) => !have.has(o.name.replace(/\.jpg$/, ""))).map((o) => o.name);
      if (orphans.length) {
        const removed = await removeReportPhotos(orphans);
        if (removed === null) result.errors.push("orphan remove failed");
        else result.orphansRemoved += removed;
      }
    }
    if (objects.length < PAGE) break;
  }
  return result;
}
