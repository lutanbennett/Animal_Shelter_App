import test from "node:test";
import assert from "node:assert/strict";
import { parseTags, checkMemeFields, checkPostUrl, matchesSearch } from "./form.ts";

test("tags are lower-cased, trimmed, deduplicated and blanks dropped", () => {
  assert.deepEqual(parseTags("Funny, sad , funny,,\nMonday"), ["funny", "sad", "monday"]);
  assert.deepEqual(parseTags(""), []);
});

test("a blank title is the first refusal; long captions the last", () => {
  const base = { title: "x", captionEn: "", captionTh: "", tags: "", residentIds: [] };
  assert.equal(checkMemeFields({ ...base, title: "  " }), "title");
  assert.equal(checkMemeFields({ ...base, title: "a".repeat(121) }), "titleLong");
  assert.equal(checkMemeFields({ ...base, captionTh: "ก".repeat(2001) }), "captionLong");
  assert.equal(checkMemeFields(base), null);
});

test("a share link is optional and https only, as the database says", () => {
  assert.equal(checkPostUrl(""), true);
  assert.equal(checkPostUrl("https://www.facebook.com/x/posts/1"), true);
  assert.equal(checkPostUrl("http://example.com"), false);
  assert.equal(checkPostUrl("https://a b"), false);
});

test("search looks at the title and both captions, ignoring case", () => {
  const m = { title: "Monday", caption_en: "When the food bowl is empty", caption_th: "หิว" };
  assert.equal(matchesSearch(m, "BOWL"), true);
  assert.equal(matchesSearch(m, "หิว"), true);
  assert.equal(matchesSearch(m, "monday"), true);
  assert.equal(matchesSearch(m, "tuesday"), false);
  assert.equal(matchesSearch(m, "  "), true);
});
