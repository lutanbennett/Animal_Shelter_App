import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/**
 * Guards routes/actions that touch Google Drive directly, which isn't
 * RLS-protected the way DB writes are — this must run before any Drive
 * call, not just before the eventual DB insert. Shared by the resident
 * photos route and the blood test attachment route (both go through
 * record_attachment(), whose own role check matches this one).
 */
export async function assertPhotoWriteAccess() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  if (role !== "admin" && role !== "staff" && role !== "vet" && role !== "volunteer") {
    const { t } = await getT();
    throw new Error(t.photos.errors.notAuthorized);
  }
}
