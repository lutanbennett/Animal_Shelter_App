import test from "node:test";
import assert from "node:assert/strict";
import { decideChange, isOtherEnvironment } from "./calendar-change.ts";

const visit = (o = {}) => ({
  appointment_date: "2026-10-20T09:30:00+07:00",
  status: "scheduled",
  calendar_etag: "e1",
  calendar_synced_at: "2026-10-19T00:00:00Z",
  calendar_out_of_date_at: null,
  ...o,
});
const EARLY = new Date("2026-10-19T12:00:00Z").getTime();
const at = (dateTime, o = {}) => ({ etag: "e2", status: "confirmed", start: { dateTime }, ...o });

test("a moved event moves the visit", () => assert.equal(decideChange(at("2026-10-21T10:00:00+07:00"), visit()), "move"));
test("the apps own change is ignored", () => assert.equal(decideChange(at("2026-10-21T10:00:00+07:00", { etag: "e1" }), visit()), "own"));
test("a deleted event cancels", () => assert.equal(decideChange({ etag: "e2", status: "cancelled" }, visit(), EARLY), "cancel"));
test("same start (title or end edit) is ignored", () => assert.equal(decideChange(at("2026-10-20T09:30:00+07:00"), visit()), "ignore"));
test("an all-day event is ignored", () => assert.equal(decideChange({ etag: "e2", start: { date: "2026-10-21" } }, visit()), "ignore"));
test("changed in the app too: the app wins", () => {
  const v = visit({ calendar_out_of_date_at: "2026-10-19T05:00:00Z" });
  assert.equal(decideChange(at("2026-10-21T10:00:00+07:00"), v), "clash");
  assert.equal(decideChange({ etag: "e2", status: "cancelled" }, v, EARLY), "clash");
});
test("a completed visit is not changed", () => assert.equal(decideChange({ etag: "e2", status: "cancelled" }, visit({ status: "completed" })), "ignore"));

test("another environment's tag is not ours to act on; no tag or our own tag is", () => {
  assert.equal(isOtherEnvironment("dev", "production"), true);
  assert.equal(isOtherEnvironment("production", "production"), false);
  assert.equal(isOtherEnvironment(undefined, "production"), false);
});

import { wantsEvent } from "./calendar-change.ts";
const NOW = new Date("2026-10-27T05:00:00Z").getTime();

test("the app's own delete, read back with a new etag, is not a cancellation", () => {
  const v = visit({ appointment_date: "2026-10-30T09:30:00+07:00", calendar_synced_at: "2026-10-27T04:59:00Z" });
  assert.equal(decideChange({ etag: "new", status: "cancelled", updated: "2026-10-27T04:59:02Z" }, v, NOW), "own");
});
test("a real deletion later by the Director still cancels a future visit", () => {
  const v = visit({ appointment_date: "2026-10-30T09:30:00+07:00", calendar_synced_at: "2026-10-27T01:00:00Z" });
  assert.equal(decideChange({ etag: "new", status: "cancelled", updated: "2026-10-27T04:00:00Z" }, v, NOW), "cancel");
});
test("a past visit is never cancelled from the calendar", () => {
  const v = visit({ appointment_date: "2026-10-20T09:30:00+07:00", calendar_synced_at: "2026-10-19T00:00:00Z" });
  assert.equal(decideChange({ etag: "new", status: "cancelled", updated: "2026-10-27T04:00:00Z" }, v, NOW), "past");
});

const w = (o = {}) => ({ status: "scheduled", archived_at: null, hasEvent: true, hasNames: true, ...o });
test("past and completed visits keep their event", () => {
  assert.equal(wantsEvent(w(), "2026-10-01", "2026-10-27"), true);
  assert.equal(wantsEvent(w({ status: "completed" }), "2026-10-01", "2026-10-27"), true);
});
test("cancelled or archived visits lose their event", () => {
  assert.equal(wantsEvent(w({ status: "cancelled" }), "2026-11-01", "2026-10-27"), false);
  assert.equal(wantsEvent(w({ archived_at: "2026-10-01" }), "2026-11-01", "2026-10-27"), false);
});
test("a past visit with no event is not back-filled; a future one gets one", () => {
  assert.equal(wantsEvent(w({ hasEvent: false }), "2026-10-01", "2026-10-27"), false);
  assert.equal(wantsEvent(w({ hasEvent: false }), "2026-10-27", "2026-10-27"), true);
  assert.equal(wantsEvent(w({ hasEvent: false, status: "completed" }), "2026-11-01", "2026-10-27"), false);
});
