import test from "node:test";
import assert from "node:assert/strict";
import { decideCalendar, envCalendarCreds } from "./shelter-calendar-decide.ts";
import { encryptSecret } from "./drive-credentials-crypto.ts";

const KEY = Buffer.alloc(32, 7).toString("base64");
process.env.DRIVE_CREDENTIALS_KEY = KEY;
process.env.GOOGLE_CALENDAR_ID = "lanna-cal@group.calendar.google.com";
process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = "env-refresh";
process.env.GOOGLE_OAUTH_CLIENT_ID = "env-id";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-secret";

const row = async (over = {}) => ({
  shelter_id: "s2",
  calendar_id: "second-cal@group.calendar.google.com",
  oauth_client_id: "cid",
  oauth_client_secret_enc: await encryptSecret("csecret", KEY),
  refresh_token_enc: await encryptSecret("rtok", KEY),
  token_status: "ok",
  last_error: null,
  ...over,
});

test("a second shelter with no row is refused, never routed to Lanna's calendar", async () => {
  const r = await decideCalendar(null, "other-shelter");
  assert.equal(r.state, "not_configured");
  assert.ok(!("creds" in r));
});

test("a shelter with no key and no row is refused too", async () => {
  assert.equal((await decideCalendar(null, null)).state, "not_configured");
});

test("Lanna with no row keeps the environment calendar", async () => {
  const r = await decideCalendar(null, "lanna");
  assert.equal(r.state, "configured");
  assert.equal(r.creds.calendarId, "lanna-cal@group.calendar.google.com");
  assert.equal(r.creds.source, "env");
});

test("a shelter with its own row uses its own calendar, never the environment's", async () => {
  const r = await decideCalendar(await row(), "other-shelter");
  assert.equal(r.state, "configured");
  assert.equal(r.creds.calendarId, "second-cal@group.calendar.google.com");
  assert.equal(r.creds.refreshToken, "rtok");
  assert.notEqual(r.creds.calendarId, envCalendarCreds().calendarId);
});

test("an incomplete row is refused, even for Lanna: it does not fall back to the environment", async () => {
  assert.equal((await decideCalendar(await row({ calendar_id: null }), "lanna")).state, "not_configured");
});

test("a dead token is reported as dead, not as configured", async () => {
  const r = await decideCalendar(await row({ token_status: "dead", last_error: "invalid_grant" }), "x");
  assert.equal(r.state, "dead");
  assert.equal(r.error, "invalid_grant");
});
