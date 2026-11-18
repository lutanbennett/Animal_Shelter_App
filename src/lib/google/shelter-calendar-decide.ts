import { DriveCredentialsError, decryptSecret } from "./drive-credentials-crypto";
import { FALLBACK_SHELTER_KEY } from "./shelter-drive-decide";

/**
 * The pure half of the per-shelter calendar rules (#calsh, app half; table: 0409). No I/O and no Next imports so a test
 * can load it. THE ONLY PLACE the four calendar environment variables are read, and only for the shelter keyed
 * FALLBACK_SHELTER_KEY with no row of its own: Lanna is unchanged, every other shelter with no row is refused.
 */
export type CalendarCreds = {
  /** Token-cache key: one cached access token per Google account. */
  cacheKey: string;
  calendarId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  source: "shelter" | "env";
};

export type CalendarCredentialRow = {
  shelter_id: string;
  calendar_id: string | null;
  oauth_client_id: string | null;
  oauth_client_secret_enc: string | null;
  refresh_token_enc: string | null;
  token_status: string | null;
  last_error: string | null;
};

export type CalendarResolution =
  | { state: "configured"; creds: CalendarCreds }
  | { state: "not_configured" }
  | { state: "dead"; error: string };

/** Lanna's own calendar, from the environment; null unless all four values are present. */
export function envCalendarCreds(): CalendarCreds | null {
  if (!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN || !process.env.GOOGLE_CALENDAR_ID || !process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) return null;
  return {
    cacheKey: "env",
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    source: "env",
  };
}

/** Whether the environment's (Lanna's) calendar is set up. */
export function envCalendarConfigured(): boolean {
  return envCalendarCreds() !== null;
}

/**
 * Which calendar a shelter's visits go to, or why none. `row` is that shelter's credentials row (null if none),
 * `shelterKey` its shelters.key. Throws DriveCredentialsError only if a stored secret cannot be decrypted.
 */
export async function decideCalendar(row: CalendarCredentialRow | null, shelterKey: string | null | undefined): Promise<CalendarResolution> {
  if (row) {
    if (!row.calendar_id || !row.oauth_client_id || !row.oauth_client_secret_enc || !row.refresh_token_enc) return { state: "not_configured" };
    if (row.token_status === "dead") return { state: "dead", error: row.last_error ?? "This shelter's calendar connection has stopped working." };
    return {
      state: "configured",
      creds: {
        cacheKey: row.shelter_id,
        calendarId: row.calendar_id,
        clientId: row.oauth_client_id,
        clientSecret: await decryptSecret(row.oauth_client_secret_enc),
        refreshToken: await decryptSecret(row.refresh_token_enc),
        source: "shelter",
      },
    };
  }
  if (shelterKey === FALLBACK_SHELTER_KEY) {
    const env = envCalendarCreds();
    return env ? { state: "configured", creds: env } : { state: "not_configured" };
  }
  return { state: "not_configured" };
}

export { DriveCredentialsError };
