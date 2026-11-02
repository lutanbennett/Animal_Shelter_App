import test from "node:test";
import assert from "node:assert/strict";
import { parseTagField, tagsPresentIn, segmentNote, openTagQuery } from "./text.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("parseTagField drops junk, bad ids and duplicates", () => {
  const raw = JSON.stringify([{ id: A, name: "Billy" }, { id: A, name: "Billy" }, { id: "nope", name: "X" }, { id: B, name: " " }]);
  assert.deepEqual(parseTagField(raw), [{ id: A, name: "Billy" }]);
  assert.deepEqual(parseTagField("{"), []);
  assert.deepEqual(parseTagField(null), []);
});

test("a tag survives only while its words are in the note", () => {
  const tags = [{ id: A, name: "Billy" }];
  assert.equal(tagsPresentIn("#Billy bit this resident", tags).length, 1);
  assert.equal(tagsPresentIn("Billy bit this resident", tags).length, 0);
  assert.equal(tagsPresentIn(null, tags).length, 0);
});

test("segmentNote links by the pick, longest name first", () => {
  const tags = [{ id: A, name: "Billy" }, { id: B, name: "Billy Bob" }];
  const segs = segmentNote("x #Billy Bob and #Billy.", tags);
  assert.deepEqual(segs.filter((s) => s.tag).map((s) => s.tag.id), [B, A]);
  assert.equal(segs.map((s) => s.text).join(""), "x #Billy Bob and #Billy.");
});

test("openTagQuery needs a hash at a word start", () => {
  assert.deepEqual(openTagQuery("see #Bi", 7), { start: 4, query: "Bi" });
  assert.equal(openTagQuery("mail a#b", 8), null);
  assert.equal(openTagQuery("no tag", 6), null);
});
