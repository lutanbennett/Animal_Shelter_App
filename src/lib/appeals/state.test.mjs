import test from "node:test";
import assert from "node:assert/strict";
import { percentRaised, fillFraction, overBy, appealPhase, showsWaysToGive, daysLeft, socialKind } from "./state.ts";

test("percent rounds DOWN: only a reached target reads 100", () => {
  assert.equal(percentRaised(0, 15000), 0);
  assert.equal(percentRaised(6000, 15000), 40);
  assert.equal(percentRaised(14950, 15000), 99);
  assert.equal(percentRaised(15000, 15000), 100);
  assert.equal(percentRaised(17250, 15000), 115);
  assert.equal(percentRaised(1150, 1000), 115);
  assert.equal(percentRaised(9999.99, 10000), 99);
  assert.equal(percentRaised(5, 0), 0);
});

test("the drawing is capped, the words are not", () => {
  assert.equal(fillFraction(17250, 15000), 1);
  assert.equal(fillFraction(0, 15000), 0);
  assert.equal(fillFraction(7500, 15000), 0.5);
  assert.equal(overBy(17500, 15000), 2500);
  assert.equal(overBy(15000, 15000), 0);
});

test("a live appeal that has met its target no longer asks", () => {
  const base = { target: 15000, deadline: null };
  assert.equal(appealPhase({ ...base, raised: 100, status: "live" }), "open");
  assert.equal(appealPhase({ ...base, raised: 15000, status: "live" }), "goal-reached");
  assert.equal(appealPhase({ ...base, raised: 0, status: "funded" }), "funded");
  assert.equal(appealPhase({ ...base, raised: 99999, status: "closed" }), "closed");
});

test("closed and funded appeals show no way to give", () => {
  const base = { target: 15000, deadline: null, raised: 0 };
  assert.equal(showsWaysToGive({ ...base, status: "live" }), true);
  assert.equal(showsWaysToGive({ ...base, status: "funded" }), false);
  assert.equal(showsWaysToGive({ ...base, status: "closed" }), false);
});

test("days left", () => {
  assert.equal(daysLeft("2026-10-20", "2026-10-16"), 4);
  assert.equal(daysLeft("2026-10-16", "2026-10-16"), 0);
  assert.equal(daysLeft("2026-10-15", "2026-10-16"), -1);
  assert.equal(daysLeft(null, "2026-10-16"), null);
});

test("social links are named by host and only https", () => {
  assert.equal(socialKind("https://www.facebook.com/p/1")?.kind, "facebook");
  assert.equal(socialKind("https://fb.watch/x")?.kind, "facebook");
  assert.equal(socialKind("https://instagram.com/p/x")?.kind, "instagram");
  assert.equal(socialKind("https://lin.ee/abc")?.kind, "line");
  assert.equal(socialKind("https://example.org/a")?.kind, "other");
  assert.equal(socialKind("http://facebook.com/x"), null);
  assert.equal(socialKind("javascript:alert(1)"), null);
  assert.equal(socialKind("https://evilfacebook.com/x")?.kind, "other");
});
