import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendarEvent, bangkokDateTime } from "./calendar-event.ts";

const visit = (appointmentDate) => ({ id: "v1", residentId: "r1", residentName: "Blackie", clinicName: "Novel", appointmentDate });

test("a 03:00 Bangkok visit lands at 03:00 on the same day, not the UTC day before", () => {
  const e = buildCalendarEvent(visit("2026-10-20T03:00:00+07:00"), null);
  assert.equal(e.start.dateTime, "2026-10-20T03:00:00+07:00");
  assert.equal(e.end.dateTime, "2026-10-20T04:00:00+07:00");
});

test("Novel - Blackie, 9:30 to 10:30", () => {
  const e = buildCalendarEvent(visit("2026-10-20T09:30:00+07:00"), "https://example.test");
  assert.equal(e.summary, "Novel - Blackie");
  assert.equal(e.start.dateTime, "2026-10-20T09:30:00+07:00");
  assert.equal(e.end.dateTime, "2026-10-20T10:30:00+07:00");
});

test("a late visit rolls the end into the next day correctly", () => {
  assert.equal(bangkokDateTime(new Date("2026-10-20T16:30:00Z")), "2026-10-20T23:30:00+07:00");
  assert.equal(buildCalendarEvent(visit("2026-10-20T23:30:00+07:00"), null).end.dateTime, "2026-10-21T00:30:00+07:00");
});

test("the description holds two addresses and no medical detail", () => {
  const e = buildCalendarEvent({ ...visit("2026-10-20T09:30:00+07:00"), reason: "parvo" }, "https://app.example");
  assert.match(e.description, /https:\/\/app\.example\/residents\/r1\/clinic-visits/);
  assert.match(e.description, /https:\/\/app\.example\/residents\/r1\n?$/m);
  assert.doesNotMatch(e.description, /parvo/);
});

test("no origin, no links; bad date, no event", () => {
  assert.doesNotMatch(buildCalendarEvent(visit("2026-10-20T09:30:00+07:00"), null).description, /http/);
  assert.equal(buildCalendarEvent(visit("nope"), null), null);
});
