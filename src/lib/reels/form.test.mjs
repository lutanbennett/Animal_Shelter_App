import test from "node:test";
import assert from "node:assert/strict";
import { splitDescription, checkReelFields, matchesReelSearch, formatDuration, REEL_TAGS_MAX } from "./form.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("a picked name links the resident and is not also a free tag", () => {
  const out = splitDescription("Billy on his first walk #Billy #adopted", [{ id: A, name: "Billy" }]);
  assert.deepEqual(out, { residentIds: [A], tags: ["adopted"] });
});

test("a pick whose #name was edited out links nothing", () => {
  assert.deepEqual(splitDescription("Billy on his walk", [{ id: A, name: "Billy" }]), { residentIds: [], tags: [] });
});

test("a typed hash that was never picked stays a word, even when it spells a resident", () => {
  assert.deepEqual(splitDescription("#Billy again", []), { residentIds: [], tags: ["billy"] });
});

test("the longer name is taken out whole before the shorter one", () => {
  const out = splitDescription("#Billy Bob and #Billy", [{ id: A, name: "Billy" }, { id: B, name: "Billy Bob" }]);
  assert.deepEqual(out.residentIds.sort(), [A, B].sort());
  assert.deepEqual(out.tags, []);
});

test("free hashtags are lower-cased, trimmed of punctuation, deduplicated and capped", () => {
  assert.deepEqual(splitDescription("#Rescue, #rescue! #Happy.", []).tags, ["rescue", "happy"]);
  const many = Array.from({ length: 40 }, (_, i) => `#t${i}`).join(" ");
  assert.equal(splitDescription(many, []).tags.length, REEL_TAGS_MAX);
});

test("a hash inside a word is not a tag", () => {
  assert.deepEqual(splitDescription("room#4 and a#b", []).tags, []);
});

test("fields: description may be empty, date must be a real day", () => {
  assert.equal(checkReelFields({ description: "", dateTaken: "2026-11-06" }), null);
  assert.equal(checkReelFields({ description: "", dateTaken: "" }), "dateTaken");
  assert.equal(checkReelFields({ description: "", dateTaken: "2026-13-45" }), "dateTaken");
  assert.equal(checkReelFields({ description: "x".repeat(2001), dateTaken: "2026-11-06" }), "descriptionLong");
});

test("search matches the description or a tag, with or without the hash", () => {
  const reel = { description: "Billy on a walk", tags: ["adopted"] };
  assert.equal(matchesReelSearch(reel, "walk"), true);
  assert.equal(matchesReelSearch(reel, "#adop"), true);
  assert.equal(matchesReelSearch(reel, "cat"), false);
  assert.equal(matchesReelSearch(reel, ""), true);
});

test("duration reads as minutes and seconds", () => {
  assert.equal(formatDuration(65000), "1:05");
  assert.equal(formatDuration(null), "");
});
