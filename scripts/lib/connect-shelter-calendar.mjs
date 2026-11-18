// The logic behind scripts/connect-shelter-calendar.mjs (#calsh piece 1), kept apart so a test can run it with no network and no
// database. Modelled on connect-shelter-drive.mjs. Everything here is either pure or takes its network call as an argument.
import { encryptSecret } from "../../src/lib/google/drive-credentials-crypto.ts";
import { FALLBACK_SHELTER_KEY } from "../../src/lib/google/shelter-drive-decide.ts";

const CALENDAR_ID = /^[A-Za-z0-9._@#%+=-]{3,300}$/;
const CLIENT_ID = /^[A-Za-z0-9._-]{10,300}$/;
const TOKEN = /^[A-Za-z0-9._\/-]{10,2000}$/;
const SECRET = /^[A-Za-z0-9._-]{8,300}$/;
const SHELTER_KEY = /^[a-z0-9_-]{1,60}$/;
const EMAIL = /^[^\s'";]{1,200}@[^\s'";]{1,200}$/;

/** Refuses anything that is not plainly what it should be, so nothing odd ever reaches the SQL below. */
export function validateInputs({ shelterKey, calendarId, clientId, clientSecret, refreshToken, accountEmail }) {
  const bad = [];
  if (!SHELTER_KEY.test(shelterKey ?? "")) bad.push("shelter key");
  if (!CALENDAR_ID.test(calendarId ?? "")) bad.push("calendar id");
  if (!CLIENT_ID.test(clientId ?? "")) bad.push("OAuth client id");
  if (!SECRET.test(clientSecret ?? "")) bad.push("OAuth client secret");
  if (!TOKEN.test(refreshToken ?? "")) bad.push("refresh token");
  if (accountEmail && !EMAIL.test(accountEmail)) bad.push("account email");
  return bad;
}

/**
 * THE ONE GUARD THE DATABASE CANNOT MAKE. 0409's unique index is on calendar_id, but the fallback shelter has no row (it runs on the
 * GOOGLE_CALENDAR_ID environment variable), so pointing a second shelter at that calendar violates nothing. Returns a sentence, or null.
 * The fallback shelter itself may of course name its own calendar.
 */
export function refuseFallbackCalendar({ shelterKey, calendarId }, fallbackCalendarId) {
  const fb = (fallbackCalendarId ?? "").trim().toLowerCase();
  if (!fb || shelterKey === FALLBACK_SHELTER_KEY) return null;
  if ((calendarId ?? "").trim().toLowerCase() === fb) {
    return `That calendar is the fallback shelter's own (GOOGLE_CALENDAR_ID). Pointing "${shelterKey}" at it would write this shelter's vet visits into another shelter's calendar. Nothing was stored.`;
  }
  return null;
}

/** Proves the credentials work BEFORE anything is stored: the token mints an access token and that token can read the calendar. */
export async function verifyWithGoogle({ clientId, clientSecret, refreshToken, calendarId }, fetchImpl = fetch) {
  const tok = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const t = await tok.json().catch(() => ({}));
  if (!tok.ok || !t.access_token) throw new Error(`Google refused the refresh token (${t.error ?? tok.status}${t.error_description ? `: ${t.error_description}` : ""}). Nothing was stored.`);
  // calendar.events does not allow reading the calendar itself, only its events: list one (as checkCalendar() does).
  const r = await fetchImpl(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=1`, { headers: { Authorization: `Bearer ${t.access_token}` } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`This Google account cannot read calendar ${calendarId} (HTTP ${r.status}). Nothing was stored.`);
  return { calendarName: body.summary ?? calendarId };
}

const lit = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);

/**
 * ONE statement, all-or-nothing. Matches the shelter by key and reports how many matched, so a mistyped key writes nothing. A
 * calendar_id already held by another shelter makes the unique index refuse the whole statement.
 */
export async function buildConnectSql({ shelterKey, calendarId, clientId, clientSecret, refreshToken, accountEmail }, key = process.env.DRIVE_CREDENTIALS_KEY) {
  const secretEnc = await encryptSecret(clientSecret, key); // throws without a key: never writes plaintext
  const tokenEnc = await encryptSecret(refreshToken, key);
  return `with s as (select id from shelters where key = ${lit(shelterKey)}),
c as (
  insert into shelter_calendar_credentials (shelter_id, calendar_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc, calendar_account_email, token_status, last_checked_at, last_error, dead_alerted_at, updated_at)
  select id, ${lit(calendarId)}, ${lit(clientId)}, ${lit(secretEnc)}, ${lit(tokenEnc)}, ${lit(accountEmail)}, 'ok', now(), null, null, now() from s
  on conflict (shelter_id) do update set calendar_id = excluded.calendar_id, oauth_client_id = excluded.oauth_client_id, oauth_client_secret_enc = excluded.oauth_client_secret_enc,
    refresh_token_enc = excluded.refresh_token_enc, calendar_account_email = excluded.calendar_account_email, token_status = 'ok',
    last_checked_at = now(), last_error = null, dead_alerted_at = null, updated_at = now()
  returning shelter_id)
select (select count(*) from s)::int as shelters_matched, (select count(*) from c)::int as credentials_written`;
}
