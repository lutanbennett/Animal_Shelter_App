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

const o = (name, otherNames) => ({ name, otherNames });

test("rule 3 (#dupnx): another name it goes by, split on , ; / and exact only", () => {
  assert.equal(nearMatchReason(o("Lucky"), o("Bob", "Bobby, Lucky")), 'the same as another name it goes by ("lucky")');
  assert.equal(nearMatchReason(o("Rex", "Sunny / Sun"), o("Max", "Sun")), 'the same as another name it goes by ("sun")');
  assert.equal(nearMatchReason(o("Lucy"), o("Bob", "Lucky")), null, "close spelling is not tried on other names");
  assert.equal(nearMatchReason(o("Bob", ""), o("Snowy", null)), null);
});

test("numbered names (#dupnx): siblings stay quiet, a bare name against a numbered one still warns", () => {
  assert.equal(nearMatchReason(r("Tiger 2"), r("Tiger 3")), null);
  assert.equal(nearMatchReason(r("Tiger 2"), r("Tiger 10")), null);
  assert.equal(nearMatchReason(r("Tiger 2"), r("Tiger")), "the same name with a number added");
  assert.equal(nearMatchReason(r("Tiger"), r("Tiger 3")), "the same name with a number added");
  assert.equal(nearMatchReason(r("Lucky 2"), r("Lucy")), "close spelling (1 letter different)");
  assert.equal(nearMatchReason(r("R2D2"), r("R2D3")), "close spelling (1 letter different)", "a digit that is not a trailing counter still counts");
  assert.equal(nearMatchReason(r("Agent 007"), r("Agent 008")), null);
  assert.equal(nearMatchReason(r("Bunny1"), r("Bunny2")), "close spelling (1 letter different)", "no space: not a counter");
});
