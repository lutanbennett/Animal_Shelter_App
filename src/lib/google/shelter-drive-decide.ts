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
  /** #rqv5c: consent stored but not yet the shelter's account (0435). Absent/false = live. */
  staged?: boolean | null;
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
  // A staged row is a consent waiting for its files to be moved: it is NOT the shelter's account yet (#rqv5c), so it is read as no row.
  if (row && !row.staged) return credentialsFromRow(row);
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

/**
 * Does a consent just given stay STAGED instead of going live? Only when there is no row yet and the shelter is the fallback
 * shelter, whose files are already in the environment's account: going live at consent would strand them (#rqv5c). A shelter with
 * no Drive yet goes live at once (nothing to strand); an existing row keeps its own state, so a reconnect cannot unstage or stage it.
 */
export function stageConsent(hasRow: boolean, shelterKey: string | null | undefined): boolean {
  return !hasRow && shelterKey === FALLBACK_SHELTER_KEY;
}

/**
 * A reconnect on a LIVE row (#rcwrg): what to do with the shelter's recorded folder. The old code read "this token cannot open the folder"
 * as "no folder yet" and made a new one in whatever account was chosen, repointing the shelter at an empty folder. Built from "a folder id
 * is recorded", not from the verify result, because verifyDrive throws the same sentence for a wrong account, a deleted folder and a
 * network blip, so it cannot tell them apart. Refusing is the safe side of all three: nothing is written and nothing is made.
 * "make" only when the shelter has no folder recorded at all.
 */
export function liveReconnectAction(recordedFolderId: string | null | undefined, tokenCanOpenIt: boolean): "reuse" | "make" | "refuse" {
  if (!recordedFolderId?.trim()) return "make";
  return tokenCanOpenIt ? "reuse" : "refuse";
}
