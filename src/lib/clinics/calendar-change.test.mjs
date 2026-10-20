import test from "node:test";
import assert from "node:assert/strict";
import { decideChange } from "./calendar-change.ts";

const visit = (o = {}) => ({
  appointment_date: "2026-10-20T09:30:00+07:00",
  status: "scheduled",
  calendar_etag: "e1",
  calendar_synced_at: "2026-10-19T00:00:00Z",
  calendar_out_of_date_at: null,
  ...o,
});
const at = (dateTime, o = {}) => ({ etag: "e2", status: "confirmed", start: { dateTime }, ...o });

test("a moved event moves the visit", () => assert.equal(decideChange(at("2026-10-21T10:00:00+07:00"), visit()), "move"));
test("the apps own change is ignored", () => assert.equal(decideChange(at("2026-10-21T10:00:00+07:00", { etag: "e1" }), visit()), "own"));
test("a deleted event cancels", () => assert.equal(decideChange({ etag: "e2", status: "cancelled" }, visit()), "cancel"));
test("same start (title or end edit) is ignored", () => assert.equal(decideChange(at("2026-10-20T09:30:00+07:00"), visit()), "ignore"));
test("an all-day event is ignored", () => assert.equal(decideChange({ etag: "e2", start: { date: "2026-10-21" } }, visit()), "ignore"));
test("changed in the app too: the app wins", () => {
  const v = visit({ calendar_out_of_date_at: "2026-10-19T05:00:00Z" });
  assert.equal(decideChange(at("2026-10-21T10:00:00+07:00"), v), "clash");
  assert.equal(decideChange({ etag: "e2", status: "cancelled" }, v), "clash");
});
test("a completed visit is not changed", () => assert.equal(decideChange({ etag: "e2", status: "cancelled" }, visit({ status: "completed" })), "ignore"));
