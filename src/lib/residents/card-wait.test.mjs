import test from "node:test";
import assert from "node:assert/strict";
import { encodeCardWait, parseCardWait, isCardWaitJob, CARD_WAIT_MINUTES } from "./card-wait.ts";

const now = 1_800_000_000_000;

test("a fresh marker names its job", () => {
  assert.equal(parseCardWait(encodeCardWait("photos", now), now + 1000), "photos");
  assert.equal(parseCardWait(encodeCardWait("weight", now), now + 1000), "weight");
});

test("a marker expires after five minutes and not before", () => {
  const m = encodeCardWait("photos", now);
  assert.equal(parseCardWait(m, now + CARD_WAIT_MINUTES * 60_000 - 1), "photos");
  assert.equal(parseCardWait(m, now + CARD_WAIT_MINUTES * 60_000), null);
  assert.equal(parseCardWait(m, now + 6 * 60_000), null);
});

test("anything else is no marker: missing, malformed, unknown job, or claiming to outlive its purpose", () => {
  for (const v of [undefined, "", "photos", "photos.abc", "diets.1800000300000", "photos.1800000300000.x", `photos.${now + 86_400_000}`]) {
    assert.equal(parseCardWait(v, now), null, String(v));
  }
  assert.equal(isCardWaitJob("__proto__"), false);
  assert.equal(isCardWaitJob("constructor"), false);
});
