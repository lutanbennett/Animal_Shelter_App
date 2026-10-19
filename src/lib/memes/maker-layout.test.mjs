import test from "node:test";
import assert from "node:assert/strict";
import { wrapLines, fitText } from "./maker-layout.ts";

// One unit per user-perceived character (a tone mark or vowel adds no width), as a real font's combining marks do.
const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const measure = (s, size) => [...seg.segment(s)].length * size;

test("long English text wraps and no line is wider than the picture", () => {
  const lines = wrapLines("This is a very long line of meme text that must not run off the picture", 200, 20, measure);
  assert.ok(lines.length > 1);
  for (const l of lines) assert.ok(measure(l, 20) <= 200, l);
  assert.equal(lines.join(" "), "This is a very long line of meme text that must not run off the picture");
});

test("one unbroken word wider than the line is split, never overflowing", () => {
  const lines = wrapLines("Supercalifragilisticexpialidocious", 100, 20, measure);
  for (const l of lines) assert.ok(measure(l, 20) <= 100, l);
  assert.equal(lines.join(""), "Supercalifragilisticexpialidocious");
});

test("Thai wraps at word breaks and keeps ำ and tone marks with their letters", () => {
  const text = "น้องหมาน่ารักมากๆ วันนี้กินข้าวเก่งที่สุดในโลกเลยนะคะ ขอบคุณทุกคนที่ช่วยเหลือ";
  const lines = wrapLines(text, 160, 20, measure);
  assert.ok(lines.length > 1);
  for (const l of lines) {
    assert.ok(measure(l, 20) <= 160, l);
    // A line never starts with a combining mark (vowel above/below, tone mark, ำ is a spacing vowel but follows a letter).
    assert.doesNotMatch(l, /^[ัิ-ฺ็-๎]/u);
  }
  assert.equal(lines.join("").replace(/\s/g, ""), text.replace(/\s/g, ""));
  const long = wrapLines("กำลังน่ารักที่สุด", 20, 20, measure);
  for (const l of long) assert.doesNotMatch(l, /^[ัิ-ฺ็-๎]/u);
  assert.ok(long.join("").includes("กำ"), "ำ stays with its consonant");
});

test("blank text gives no lines; explicit newlines are kept", () => {
  assert.deepEqual(wrapLines("   ", 100, 20, measure), []);
  assert.deepEqual(wrapLines("a\nb", 100, 20, measure), ["a", "b"]);
});

test("fitText shrinks the font until the text fits the height, and stops at the minimum", () => {
  const text = "word ".repeat(40);
  const f = fitText(text, 300, 120, measure, 60, 14);
  assert.ok(f.fontSize < 60 && f.fontSize >= 14);
  assert.ok(f.lines.length * f.fontSize * 1.15 <= 120 || f.fontSize === 14);
  assert.equal(fitText("hi", 300, 120, measure, 60, 14).fontSize, 60);
});
