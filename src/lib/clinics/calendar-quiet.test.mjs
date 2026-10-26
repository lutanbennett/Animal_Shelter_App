import test from "node:test";
import assert from "node:assert/strict";
import { isSweepQuiet, SWEEP_QUIET_AFTER_MS } from "./calendar-quiet.ts";

const now = Date.parse("2026-10-26T05:00:00Z");
const ago = (ms) => new Date(now - ms).toISOString();

test("a sweep that has never run is quiet", () => {
  assert.equal(isSweepQuiet(null, now), true);
});

test("a run a missed cycle ago is not quiet; just past the limit is", () => {
  assert.equal(isSweepQuiet(ago(20 * 60_000), now), false);
  assert.equal(isSweepQuiet(ago(SWEEP_QUIET_AFTER_MS), now), false);
  assert.equal(isSweepQuiet(ago(SWEEP_QUIET_AFTER_MS + 1000), now), true);
});

test("production on 2026-10-26: last run 2026-10-23 10:00Z is quiet", () => {
  assert.equal(isSweepQuiet("2026-10-23T10:00:14.343+00:00", now), true);
});

test("an unreadable timestamp is quiet, not silently fine", () => {
  assert.equal(isSweepQuiet("not a date", now), true);
});
