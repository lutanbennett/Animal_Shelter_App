import { createAdminClient } from "@/lib/supabase/admin";
import { actingShelterId } from "@/lib/supabase/acting-shelter";
import { DriveCredentialsError, decryptSecret } from "./drive-credentials-crypto";

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
export const FALLBACK_SHELTER_KEY = "lanna";

export type DriveCredentials = {
  /** Token-cache key: one cached access token per Google account. */
  cacheKey: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  source: "shelter" | "env";
};

export type DriveCredentialRow = {
  shelter_id: string;
  oauth_client_id: string | null;
  oauth_client_secret_enc: string | null;
  refresh_token_enc: string | null;
};

function fromEnv(): DriveCredentials {
  const need = (name: string) => {
    const v = process.env[name];
    if (!v) throw new DriveCredentialsError(`${name} is not configured.`);
    return v;
  };
  return {
    cacheKey: "env",
    clientId: need("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: need("GOOGLE_OAUTH_CLIENT_SECRET"),
    refreshToken: need("GOOGLE_OAUTH_REFRESH_TOKEN"),
    source: "env",
  };
}

/** Decrypts one stored row. Throws DriveCredentialsError if any of the three values is missing or unreadable. */
export async function credentialsFromRow(row: DriveCredentialRow): Promise<DriveCredentials> {
  if (!row.oauth_client_id || !row.oauth_client_secret_enc || !row.refresh_token_enc) {
    throw new DriveCredentialsError("This shelter's Google connection is incomplete: a client id, client secret or refresh token is missing.");
  }
  return {
    cacheKey: row.shelter_id,
    clientId: row.oauth_client_id,
    clientSecret: await decryptSecret(row.oauth_client_secret_enc),
    refreshToken: await decryptSecret(row.refresh_token_enc),
    source: "shelter",
  };
}

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
  if (row) return credentialsFromRow(row as DriveCredentialRow);

  const { data: shelter } = await db.from("shelters").select("key").eq("id", shelterId).maybeSingle();
  if (shelter?.key === FALLBACK_SHELTER_KEY) return fromEnv();
  throw new DriveCredentialsError("This shelter has not connected a Google Drive account yet.");
}
