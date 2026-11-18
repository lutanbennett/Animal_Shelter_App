import test from "node:test";
import assert from "node:assert/strict";
import { validateInputs, refuseFallbackCalendar, verifyWithGoogle, buildConnectSql } from "./lib/connect-shelter-calendar.mjs";
import { decryptSecret } from "../src/lib/google/drive-credentials-crypto.ts";
import { FALLBACK_SHELTER_KEY } from "../src/lib/google/shelter-drive-decide.ts";

const KEY = Buffer.alloc(32, 5).toString("base64");
const good = { shelterKey: "second", calendarId: "second-cal@group.calendar.google.com", clientId: "123-abc.apps.googleusercontent.com", clientSecret: "GOCSPX-secretvalue", refreshToken: "1//0gRefreshTokenValue" };

test("validation rejects odd values, including SQL-shaped ones", () => {
  assert.deepEqual(validateInputs(good), []);
  assert.ok(validateInputs({ ...good, shelterKey: "x'; drop table shelters;--" }).includes("shelter key"));
  assert.ok(validateInputs({ ...good, calendarId: "a'b" }).includes("calendar id"));
  assert.ok(validateInputs({ ...good, accountEmail: "a@b'.org" }).includes("account email"));
});

test("a second shelter cannot be pointed at the fallback shelter's calendar, whatever the case or spacing", () => {
  const fb = "Main-Cal@group.calendar.google.com";
  assert.match(refuseFallbackCalendar({ shelterKey: "second", calendarId: "main-cal@group.calendar.google.com " }, fb), /fallback shelter's own/);
  assert.match(refuseFallbackCalendar({ shelterKey: "second", calendarId: fb }, fb), /Nothing was stored/);
  assert.equal(refuseFallbackCalendar(good, fb), null);
  assert.equal(refuseFallbackCalendar({ shelterKey: FALLBACK_SHELTER_KEY, calendarId: fb }, fb), null);
  assert.equal(refuseFallbackCalendar(good, ""), null);
});

test("the SQL holds ciphertext only, decrypts back, and is one statement", async () => {
  const sql = await buildConnectSql({ ...good, accountEmail: "a@b.org" }, KEY);
  assert.ok(!sql.includes(good.refreshToken) && !sql.includes(good.clientSecret));
  const enc = sql.match(/'(v1:[^']+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual(await Promise.all(enc.map((e) => decryptSecret(e, KEY))), [good.clientSecret, good.refreshToken]);
  assert.match(sql, /insert into shelter_calendar_credentials/);
  assert.equal(sql.trim().split(";").filter(Boolean).length, 1);
  await assert.rejects(() => buildConnectSql(good, ""));
});

test("verification stops before storing when Google refuses", async () => {
  const refuse = async () => ({ ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) });
  await assert.rejects(() => verifyWithGoogle(good, refuse), /invalid_grant/);
  let n = 0;
  const noCal = async () => (++n === 1 ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: false, status: 404, json: async () => ({}) });
  await assert.rejects(() => verifyWithGoogle(good, noCal), /cannot read calendar/);
  n = 5;
  const ok = async (u) => (String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: true, json: async () => ({ summary: "Vets" }) });
  assert.deepEqual(await verifyWithGoogle(good, ok), { calendarName: "Vets" });
});
