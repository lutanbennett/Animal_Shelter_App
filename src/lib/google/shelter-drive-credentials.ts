import { createAdminClient } from "@/lib/supabase/admin";
import { actingShelterId } from "@/lib/supabase/acting-shelter";
import { FALLBACK_SHELTER_KEY, decideCredentials, type DriveCredentials, type DriveCredentialRow } from "./shelter-drive-decide";
export { FALLBACK_SHELTER_KEY, credentialsFromRow, decideCredentials, type DriveCredentials, type DriveCredentialRow } from "./shelter-drive-decide";

/**
 * Which Google account the shelter being served uploads to (Part 9 of #ykefa, #o2iyh; table: 0404).
 *
 * The one place every Drive call gets its credentials from. Rule, decided in
 * docs/decisions/2026-11-17-per-shelter-drive-credentials.md:
 *   - a shelter with a complete row uses it (secrets decrypted with DRIVE_CREDENTIALS_KEY);
 *   - no request scope (a cron job, a script) uses the environment variables, as before;
 *   - the shelter keyed FALLBACK_SHELTER_KEY with no row uses the environment variables, so Lanna is unchanged;
 *   - ANY OTHER shelter with no row REFUSES. It never borrows Lanna's Google account, because that would put its
 *     photos in someone else's Drive.
 * Not a permission: nothing here grants access to anyone; it picks which account the server acts as.
 */

export async function resolveDriveCredentials(): Promise<DriveCredentials> {
  let shelterId: string | null;
  try {
    shelterId = await actingShelterId();
  } catch {
    return fromEnv(); // no request scope
  }
  if (!shelterId) return fromEnv();

  const db = createAdminClient({ shelterId });
  const { data: row } = await db
    .from("shelter_drive_credentials")
    .select("shelter_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc")
    .eq("shelter_id", shelterId)
    .maybeSingle();
  if (row) return decideCredentials(row as DriveCredentialRow, null);

  const { data: shelter } = await db.from("shelters").select("key").eq("id", shelterId).maybeSingle();
  return decideCredentials(null, shelter?.key);
}
