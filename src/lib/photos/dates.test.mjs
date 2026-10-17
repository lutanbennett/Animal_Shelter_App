// The Drive month folder and the filed date use the Bangkok day, not UTC's (docs/decisions/2026-10-17-enclosure-photos-app.md).
import test from "node:test";
import assert from "node:assert/strict";
import { bangkokDate } from "./dates.ts";

test("an evening in Bangkok is still that day, and 17:00Z is already the next", () => {
  assert.equal(bangkokDate("2026-10-17T16:59:00Z"), "2026-10-17");
  assert.equal(bangkokDate("2026-10-17T17:00:00Z"), "2026-10-18");
});

test("month and year ends roll over on the Bangkok clock", () => {
  assert.equal(bangkokDate("2026-10-31T17:30:00Z"), "2026-11-01");
  assert.equal(bangkokDate("2026-12-31T20:00:00Z"), "2027-01-01");
});
