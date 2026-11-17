import { createAdminClient } from "@/lib/supabase/admin";
import { actingShelterId } from "@/lib/supabase/acting-shelter";

/**
 * The Drive folder the shelter being served keeps its files under (shelters.drive_root_folder_id, 0397).
 * Falls back to GOOGLE_DRIVE_ROOT_FOLDER_ID when the shelter has no value yet or there is no request (a cron job, a
 * script), so a shelter whose setting is not populated behaves exactly as it did before: never "nothing".
 * Returns null only when neither is set; callers keep their own "not configured" message.
 */
export async function driveRootFolderId(): Promise<string | null> {
  const fallback = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
  let shelterId: string | null = null;
  try {
    shelterId = await actingShelterId();
  } catch {
    return fallback; // no request scope
  }
  if (!shelterId) return fallback;
  const { data } = await createAdminClient({ shelterId }).from("shelters").select("drive_root_folder_id").eq("id", shelterId).maybeSingle();
  return (data?.drive_root_folder_id as string | null | undefined)?.trim() || fallback;
}
