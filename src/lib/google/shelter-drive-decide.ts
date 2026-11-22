import { DriveCredentialsError, decryptSecret } from "./drive-credentials-crypto";
import { FALLBACK_SHELTER_KEY } from "./fallback-shelter-key";

/** The pure half of the per-shelter Drive rules: no I/O and no Next imports, so tests can load it. */
export { FALLBACK_SHELTER_KEY };

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

export function fromEnv(): DriveCredentials {
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
    throw new DriveCredentialsError("This shelter's Google connection is incomplete: a client id, client secret or refresh token is missing.", "theirs");
  }
  return {
    cacheKey: row.shelter_id,
    clientId: row.oauth_client_id,
    clientSecret: await decryptSecret(row.oauth_client_secret_enc),
    refreshToken: await decryptSecret(row.refresh_token_enc),
    source: "shelter",
  };
}

/**
 * The decision, with no I/O so it can be tested: given what the database holds for the shelter being served, which
 * credentials apply, or a refusal. `row` is that shelter's credentials row (null if none), `shelterKey` its shelters.key.
 */
export async function decideCredentials(row: DriveCredentialRow | null, shelterKey: string | null | undefined): Promise<DriveCredentials> {
  if (row) return credentialsFromRow(row);
  if (shelterKey === FALLBACK_SHELTER_KEY) return fromEnv();
  throw new DriveCredentialsError("This shelter has not connected a Google Drive account yet.");
}


/**
 * Which Drive folder: the shelter's own, else (the fallback shelter only) the environment's. Part 9 (#o2iyh): any other
 * shelter with no folder of its own gets null, never Lanna's folder in Lanna's Google account.
 */
export function decideRootFolder(own: string | null | undefined, shelterKey: string | null | undefined, fallback: string | null): string | null {
  const mine = own?.trim();
  if (mine) return mine;
  return shelterKey === FALLBACK_SHELTER_KEY ? fallback : null;
}
