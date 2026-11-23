import test from "node:test";
import assert from "node:assert/strict";
import { consentUrl, readStateCookie, missingScopes, folderNameFor, calendarNameFor, SCOPES } from "./shelter-google-connect-decide.ts";

test("consent url asks offline, with consent, for only the narrow scope", () => {
  const u = new URL(consentUrl({ clientId: "cid", origin: "http://localhost:3001", kind: "drive", state: "s".repeat(24) }));
  assert.equal(u.searchParams.get("redirect_uri"), "http://localhost:3001/admin/google/callback");
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.equal(u.searchParams.get("prompt"), "consent");
  assert.equal(u.searchParams.get("scope"), "https://www.googleapis.com/auth/drive.file");
  assert.ok(!u.searchParams.get("scope").endsWith("/auth/drive"));
});

test("calendar asks only for calendars the app makes, not every event", () => {
  const u = new URL(consentUrl({ clientId: "cid", origin: "http://localhost:3001", kind: "calendar", state: "s".repeat(24) }));
  const scopes = u.searchParams.get("scope").split(" ");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/calendar.app.created"));
  assert.ok(!scopes.includes("https://www.googleapis.com/auth/calendar.events"));
  assert.ok(!scopes.includes("https://www.googleapis.com/auth/calendar"));
});

test("state cookie must match the returned state and name a known kind", () => {
  const s = "a".repeat(24);
  assert.equal(readStateCookie(`${s}.calendar`, s), "calendar");
  assert.equal(readStateCookie(`${s}.drive`, "b".repeat(24)), null);
  assert.equal(readStateCookie(`${s}.other`, s), null);
  assert.equal(readStateCookie(undefined, s), null);
  assert.equal(readStateCookie(`${s}.drive`, null), null);
  assert.equal(readStateCookie("short.drive", "short"), null);
});

test("an unticked scope is reported", () => {
  assert.deepEqual(missingScopes("drive", SCOPES.drive.join(" ")), []);
  assert.deepEqual(missingScopes("calendar", SCOPES.calendar[0]), [SCOPES.calendar[1]]);
  assert.deepEqual(missingScopes("drive", undefined), SCOPES.drive);
});

test("calendar name is the shelter's own and never carries a control character", () => {
  assert.equal(calendarNameFor("A\nB"), "A B vet visits (animal shelter app)");
  assert.equal(calendarNameFor(null), "Vet visits (animal shelter app)");
});

test("folder name never carries a path separator", () => {
  assert.equal(folderNameFor("A/B"), "A B (animal shelter app)");
  assert.equal(folderNameFor(null), "Animal shelter app");
});
