import test from "node:test";
import assert from "node:assert/strict";
import { groupVisits, isOverdue, shelterTime } from "./shelter-visits.ts";

const v = (status, appointment_date) => ({ status, appointment_date });
const today = "2026-10-14";

test("a 03:00 Bangkok visit is on the shelter's day, not the UTC day before", () => {
  const early = v("scheduled", "2026-10-14T03:00:00+07:00"); // 20:00Z on the 13th
  assert.equal(isOverdue(early, today), false);
  assert.equal(groupVisits([early], today)[0].kind, "today");
  assert.equal(shelterTime(early.appointment_date), "03:00");
});

test("overdue is Scheduled on an earlier day, first; finished past days come last", () => {
  const rows = [
    v("scheduled", "2026-10-15T10:00:00+07:00"),
    v("scheduled", "2026-10-12T10:00:00+07:00"),
    v("completed", "2026-10-12T11:00:00+07:00"),
    v("scheduled", "2026-10-14T09:00:00+07:00"),
    v("scheduled", "2026-10-20T09:00:00+07:00"),
  ];
  const kinds = groupVisits(rows, today).map((g) => g.kind);
  assert.deepEqual(kinds, ["overdue", "today", "tomorrow", "later", "past"]);
});

test("grouping loses no visit", () => {
  const rows = Array.from({ length: 30 }, (_, i) =>
    v(i % 3 ? "scheduled" : "completed", `2026-10-${String(1 + i).padStart(2, "0")}T08:00:00+07:00`),
  );
  const total = groupVisits(rows, today).reduce((n, g) => n + g.visits.length, 0);
  assert.equal(total, rows.length);
});
