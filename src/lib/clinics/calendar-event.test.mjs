import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendarEvent, bangkokDateTime, calendarEventIdFor } from "./calendar-event.ts";

const visit = (appointmentDate) => ({ id: "v1", residentId: "r1", residentName: "Blackie", clinicName: "Novel", appointmentDate });

test("a 03:00 Bangkok visit lands at 03:00 on the same day, not the UTC day before", () => {
  const e = buildCalendarEvent(visit("2026-10-20T03:00:00+07:00"), null, "production");
  assert.equal(e.start.dateTime, "2026-10-20T03:00:00+07:00");
  assert.equal(e.end.dateTime, "2026-10-20T04:00:00+07:00");
});

test("Novel - Blackie, 9:30 to 10:30", () => {
  const e = buildCalendarEvent(visit("2026-10-20T09:30:00+07:00"), "https://example.test", "production");
  assert.equal(e.summary, "Novel - Blackie");
  assert.equal(e.start.dateTime, "2026-10-20T09:30:00+07:00");
  assert.equal(e.end.dateTime, "2026-10-20T10:30:00+07:00");
});

test("a late visit rolls the end into the next day correctly", () => {
  assert.equal(bangkokDateTime(new Date("2026-10-20T16:30:00Z")), "2026-10-20T23:30:00+07:00");
  assert.equal(buildCalendarEvent(visit("2026-10-20T23:30:00+07:00"), null, "production").end.dateTime, "2026-10-21T00:30:00+07:00");
});

test("the description holds two addresses and the reason, never the notes", () => {
  const e = buildCalendarEvent({ ...visit("2026-10-20T09:30:00+07:00"), reason: "parvo", notes: "secret" }, "https://app.example", "production");
  assert.match(e.description, /https:\/\/app\.example\/residents\/r1\/clinic-visits/);
  assert.match(e.description, /https:\/\/app\.example\/residents\/r1\n?$/m);
  assert.match(e.description, /Reason: parvo/);
  assert.doesNotMatch(e.description, /secret/);
});

test("the reason sits straight after the Vet visit line; the title is unchanged", () => {
  const e = buildCalendarEvent({ ...visit("2026-10-20T09:30:00+07:00"), reason: "Vaccination\n booster " }, null, "production");
  assert.equal(e.summary, "Novel - Blackie");
  assert.deepEqual(e.description.split("\n"), ["Vet visit: Blackie at Novel", "Reason: Vaccination booster"]);
});

test("no reason, no Reason: line", () => {
  for (const reason of [undefined, null, "", "   "]) {
    assert.doesNotMatch(buildCalendarEvent({ ...visit("2026-10-20T09:30:00+07:00"), reason }, null, "production").description, /Reason/);
  }
});

test("no origin, no links; bad date, no event", () => {
  assert.doesNotMatch(buildCalendarEvent(visit("2026-10-20T09:30:00+07:00"), null, "production").description, /http/);
  assert.equal(buildCalendarEvent(visit("nope"), null, "production"), null);
});

test("the event is tagged with the environment that made it, beside the visit id", () => {
  const e = buildCalendarEvent(visit("2026-10-20T09:30:00+07:00"), null, "dev");
  assert.deepEqual(e.extendedProperties.private, { visitId: "v1", env: "dev" });
});

test("the event id is base32hex, derived from the visit and the environment", () => {
  const id = calendarEventIdFor("0A1B2C3D-0000-4000-8000-123456789ABC", "production");
  assert.equal(id, "p0a1b2c3d000040008000123456789abc");
  assert.match(id, /^[0-9a-v]{5,1024}$/);
  assert.equal(calendarEventIdFor("0A1B2C3D-0000-4000-8000-123456789ABC", "production"), id);
  assert.notEqual(calendarEventIdFor("0A1B2C3D-0000-4000-8000-123456789ABC", "dev"), id);
});
