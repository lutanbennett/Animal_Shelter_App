import test from "node:test";
import assert from "node:assert/strict";
import { nearMatchReason, nameParts, normaliseName, nextNumberedName, sameName } from "./near-names.ts";

const r = (name, thaiName) => ({ name, thaiName });

test("rule 1: the same name once the bracket tag is dropped, or one name is the other's tag", () => {
  assert.equal(nearMatchReason(r("Noon"), r("Noon (Daeng)")), "the same name once the bracket tag is dropped");
  assert.equal(nearMatchReason(r("Daeng"), r("Noon (Daeng)")), "one name is the other's bracket tag");
});

test("rule 2: the same Thai name", () => {
  assert.equal(nearMatchReason(r("Lucky", "ลัคกี้"), r("Bob", "ลัคกี้")), "the same Thai name");
});

test("rule 3: close spelling, one letter at 4+, two at 8+, nothing shorter", () => {
  assert.equal(nearMatchReason(r("Lucky"), r("Lucy")), "close spelling (1 letter different)");
  assert.equal(nearMatchReason(r("Princess"), r("Prinzezs")), "close spelling (2 letters different)");
  assert.equal(nearMatchReason(r("Lucky"), r("Lu")), null);
  assert.equal(nearMatchReason(r("Max"), r("Mia")), null);
  assert.equal(nearMatchReason(r("Bella"), r("Belly Jo")), null);
});

test("an exact match is not a near match (the caller handles it), and neither are unrelated names", () => {
  assert.equal(nearMatchReason(r("Tiger"), r("tiger")), null);
  assert.equal(nearMatchReason(r("Tiger"), r("Snowy")), null);
});

test("normalising drops case, accents and punctuation and keeps Thai", () => {
  assert.equal(normaliseName("  Café-Noir! "), "cafe noir");
  assert.equal(normaliseName("ลัคกี้"), normaliseName("ลัคกี้"));
  assert.deepEqual(nameParts("Noon (Daeng/Red)"), { core: "noon", tags: ["daeng", "red"] });
  assert.ok(sameName("TIGER", "tiger"));
  assert.ok(!sameName("", ""));
});

test("next number: Tiger → Tiger 2, then one past the highest", () => {
  assert.equal(nextNumberedName("Tiger", ["Tiger"]), "Tiger 2");
  assert.equal(nextNumberedName("Tiger", ["Tiger", "Tiger 2"]), "Tiger 3");
  assert.equal(nextNumberedName("tiger", ["Tiger", "Tiger 5"]), "tiger 6");
  assert.equal(nextNumberedName("Tiger 2", ["Tiger", "Tiger 2"]), "Tiger 3");
  assert.equal(nextNumberedName("Tiger", ["Snowy", "Tigers 4"]), null);
  assert.equal(nextNumberedName("Tiger", ["Tiger 2"]), null);
});
