import test from "node:test";
import assert from "node:assert/strict";
import { loadProductPage, productText, productPhotoId } from "./product-content.ts";

const client = (answer, seen = {}) => ({
  from: (view) => ({ select: () => ({ eq: (c, v) => { Object.assign(seen, { view, c, v }); return { returns: async () => answer }; } }) }),
});

test("rows become a map by key, read from the public view for that page", async () => {
  const seen = {};
  const m = await loadProductPage(client({ data: [{ key: "heading", en: "Hi", th: "สวัสดี", drive_file_id: "f1" }] }, seen), "home");
  assert.deepEqual(seen, { view: "public_platform_content", c: "page", v: "home" });
  assert.deepEqual(m.get("heading"), { en: "Hi", th: "สวัสดี", driveFileId: "f1" });
});

test("a failed or empty read is an empty page, not a throw", async () => {
  assert.equal((await loadProductPage(client({ data: null, error: { message: "x" } }), "home")).size, 0);
});

const m = new Map([
  ["a", { en: "Hello", th: "สวัสดี", driveFileId: null }],
  ["b", { en: "Only English", th: "  ", driveFileId: " f2 " }],
  ["c", { en: "", th: "", driveFileId: null }],
]);

test("Thai is used when written, English otherwise", () => {
  assert.equal(productText(m, "a", "th"), "สวัสดี");
  assert.equal(productText(m, "a", "en"), "Hello");
  assert.equal(productText(m, "b", "th"), "Only English");
});

test("a missing key or a blank line gives the fallback", () => {
  assert.equal(productText(m, "zzz", "en", "dict"), "dict");
  assert.equal(productText(m, "c", "th", "dict"), "dict");
  assert.equal(productText(m, "zzz", "en"), "");
});

test("photo id is trimmed, null when none", () => {
  assert.equal(productPhotoId(m, "b"), "f2");
  assert.equal(productPhotoId(m, "a"), null);
  assert.equal(productPhotoId(m, "zzz"), null);
});
