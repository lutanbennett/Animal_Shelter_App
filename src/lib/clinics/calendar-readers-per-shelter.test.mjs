import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decideCalendar } from "../google/shelter-calendar-decide.ts";
import { FALLBACK_SHELTER_KEY } from "../google/shelter-drive-decide.ts";

// #calsh piece 3: no reader of a shelter calendar may fall back to another shelter's. Source-shape guards, because the
// readers call Google and the database and cannot run here; the decision they all share is exercised for real.
const src = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const sync = src("./calendar-sync.ts");
const poll = src("./calendar-poll.ts");
const imp = src("./calendar-import.ts");

test("every calendarFetch call names its credentials (no default calendar)", () => {
  for (const [name, text] of [["sync", sync], ["poll", poll], ["import", imp]]) {
    const calls = [...text.matchAll(/calendarFetch\(([^;]*?)\);/gs)].map((m) => m[1]);
    assert.ok(calls.length > 0, name);
    for (const c of calls) assert.match(c, /creds|cal\b|\{\}, resolved\.creds|, init, creds/, `${name}: ${c.slice(0, 60)}`);
  }
  assert.doesNotMatch(sync, /creds: CalendarCreds \| null = /, "calendarFetch must not default its credentials");
});

test("the calendar environment variables are not read by the readers", () => {
  for (const text of [sync, poll, imp]) assert.doesNotMatch(text, /process\.env\.GOOGLE_/);
});

test("both calendar_sync_state upserts, and every read of it, are fenced to a shelter", () => {
  const upserts = [...poll.matchAll(/calendar_sync_state"\)\.upsert\(\{([^}]*)\}/g)].map((m) => m[1]);
  const multi = [...poll.matchAll(/\.upsert\(\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(multi.length >= 3);
  for (const u of [...upserts, ...multi]) assert.match(u, /shelter_id: shelterId/);
  assert.match(sync, /\.eq\("shelter_id", shelterId\)\s*\.eq\("calendar_id"/);
});

test("the poll visits only shelters whose calendar resolves; a visit lookup and an import are fenced to the polled shelter", () => {
  assert.match(poll, /resolved\.state !== "configured"\) continue/);
  assert.match(poll, /\.eq\("shelter_id", shelterId\)\s*\.eq\("calendar_event_id"/);
  assert.match(imp, /shelterId !== calendarShelterId/);
  assert.match(imp, /loadRefs\(shelterId\)/);
});

test("a shelter with no row is refused even when the fallback shelter's environment is set", async () => {
  process.env.GOOGLE_CALENDAR_ID = "main-cal@group.calendar.google.com";
  process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = "t";
  process.env.GOOGLE_OAUTH_CLIENT_ID = "i";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "s";
  assert.equal((await decideCalendar(null, "another-shelter")).state, "not_configured");
  assert.equal((await decideCalendar(null, FALLBACK_SHELTER_KEY)).state, "configured"); // the fallback shelter is unchanged
});
