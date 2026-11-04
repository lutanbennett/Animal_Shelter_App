import test from "node:test";
import assert from "node:assert/strict";
import { cleanMentions, noteWithTags, MAX_MENTIONS } from "./mentions.ts";

const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;
const rows = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: id(n) }));

test("keeps visible residents, drops the subject, strangers, junk and repeats", () => {
  const got = cleanMentions([id(2), id(1), id(2), "billy", 7, id(9), null], id(1), rows);
  assert.deepEqual(got, [id(2)]);
});

test("not an array is no mentions", () => {
  assert.deepEqual(cleanMentions("x", null, rows), []);
  assert.deepEqual(cleanMentions(undefined, null, rows), []);
});

test("capped", () => {
  assert.equal(cleanMentions(rows.map((r) => r.id), null, rows).length, MAX_MENTIONS);
});

test("note text", () => {
  assert.equal(noteWithTags("via the assistant", []), "via the assistant");
  assert.equal(noteWithTags("via the assistant", ["Billy", "Gigi (1)"]), "via the assistant #Billy #Gigi (1)");
});
