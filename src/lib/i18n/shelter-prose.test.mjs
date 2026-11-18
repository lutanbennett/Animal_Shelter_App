// Lanna's output must be byte-for-byte unchanged: filled with the default names, the dictionaries read exactly as
// before the placeholders went in; filled with another shelter's names, that shelter's name appears instead.
import test from "node:test";
import assert from "node:assert/strict";
import en from "./dictionaries/en.ts";
import th from "./dictionaries/th.ts";
import { fillShelterNames } from "./shelter-prose.ts";

const names = { displayName: "Lanna Care for Animals", shortName: "Lanna Care" };
const other = { displayName: "Soi Dog Haven", shortName: "Soi Dog" };

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
}

test("no placeholder is left after filling, in either language", () => {
  for (const d of [en, th]) {
    for (const n of [names, other]) {
      assert.deepEqual(strings(fillShelterNames(d, n)).filter((s) => /\{shelter/.test(s)), []);
    }
  }
});

test("English, default names: the exact previous text", () => {
  const t = fillShelterNames(en, names);
  assert.equal(t.sitePages.friendsJoin.message.slice(0, 31), "Hello Lanna Care for Animals,\n\n");
  const T = fillShelterNames(th, names);
  // Thai word order: the sentence opens with the greeting and the name follows it, so the name is not first
  assert.equal(T.sitePages.friendsJoin.message.split("\n")[0], "สวัสดีค่ะ/ครับ Lanna Care for Animals");
  assert.equal(fillShelterNames(th, other).sitePages.friendsJoin.message.split("\n")[0], "สวัสดีค่ะ/ครับ Soi Dog Haven");
});

test("function entries still return the exact previous text, and a second shelter's name", () => {
  const e = fillShelterNames(en, names);
  const T = fillShelterNames(th, names);
  const o = fillShelterNames(en, other);
  const adopt = Object.values(en).find((v) => v && typeof v === "object" && typeof v.shareText === "function" && v.shareText("x").includes("{shelter}"));
  assert.ok(adopt, "found the dictionary section with shareText");
  const key = Object.keys(en).find((k) => en[k] === adopt);
  assert.equal(e[key].shareText("Mali"), "Meet Mali at Lanna Care for Animals");
  assert.equal(e[key].shareFallback("Mali"), "Meet Mali, looking for a home at Lanna Care for Animals.");
  assert.equal(T[key].shareText("Mali"), "พบกับ Mali ที่ Lanna Care for Animals");
  assert.equal(o[key].shareText("Mali"), "Meet Mali at Soi Dog Haven");
});
