import test from "node:test";
import assert from "node:assert/strict";
import { parseBody, parseInline, stripMarks, bodyLead, isPageBodyField } from "./body.ts";

test("text typed before inline marks existed is one plain run", () => {
  const t = "Plain words, with *stars*, (brackets) and <b>html</b>.";
  assert.deepEqual(parseInline(t), [{ type: "text", text: t }]);
  assert.equal(stripMarks(t), t);
});

test("every mark parses and nests", () => {
  const n = parseInline("{b}a {u}b{/u}{/b} {c:accent}g{/c} {s:large}L{/s} {i}i{/i}");
  assert.equal(n.filter((x) => x.type === "mark").length, 4);
  assert.equal(stripMarks("{b}a {u}b{/u}{/b} {c:accent}g{/c}"), "a b g");
});

test("script, javascript: and malformed marks stay as typed", () => {
  for (const t of [
    "<script>alert(1)</script>",
    "{c:red}x{/c}",
    "{b}never closed",
    "stray {/b} closer",
    "{c:javascript:alert(1)}x{/c}",
    "{s:large}{b}crossed{/s}{/b}",
  ]) {
    assert.ok(!parseInline(t).some((x) => x.type === "mark" && x.tag === "c" && !["ink", "action", "accent"].includes(x.arg)));
  }
  assert.equal(stripMarks("{b}never closed"), "{b}never closed");
  assert.equal(stripMarks("{c:red}x{/c}"), "{c:red}x{/c}");
  assert.equal(stripMarks("<script>alert(1)</script>"), "<script>alert(1)</script>");
});

test("block rules and lead are unchanged and the lead is free of tags", () => {
  assert.deepEqual(parseBody("## H\n- a\n- b\n\nP"), [
    { type: "heading", text: "H" },
    { type: "list", items: ["a", "b"] },
    { type: "paragraph", text: "P" },
  ]);
  assert.equal(bodyLead("{b}Hello{/b} world"), "Hello world");
});

test("only a page's text takes the style toolbar in its translation", () => {
  assert.equal(isPageBodyField({ table_name: "site_pages", column_name: "body" }), true);
  assert.equal(isPageBodyField({ table_name: "site_pages", column_name: "title" }), false);
  assert.equal(isPageBodyField({ table_name: "residents", column_name: "bio" }), false);
});

test("Thai marks parse like the English, and unsafe Thai stays as typed", () => {
  assert.deepEqual(parseInline("{b}สวัสดี{/b} {c:accent}{s:large}ครับ{/s}{/c}"), [
    { type: "mark", tag: "b", arg: undefined, children: [{ type: "text", text: "สวัสดี" }] },
    { type: "text", text: " " },
    {
      type: "mark",
      tag: "c",
      arg: "accent",
      children: [{ type: "mark", tag: "s", arg: "large", children: [{ type: "text", text: "ครับ" }] }],
    },
  ]);
  const unsafe = "<script>alert(1)</script> [ลิงก์](javascript:alert(1))";
  assert.deepEqual(parseInline(unsafe), [{ type: "text", text: unsafe }]);
});
