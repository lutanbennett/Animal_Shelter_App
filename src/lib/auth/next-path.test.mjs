import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "./next-path.ts";

test("an ordinary same-site path is kept, with its query", () => {
  assert.equal(safeNextPath("/residents"), "/residents");
  assert.equal(safeNextPath("/residents/12?tab=meds"), "/residents/12?tab=meds");
  assert.equal(safeNextPath("/"), "/");
});

test("a fragment is dropped, never carried through", () => {
  assert.equal(safeNextPath("/a?x=1#frag"), "/a?x=1");
});

test("nothing, empty, or not starting with / is refused", () => {
  for (const v of [null, undefined, "", "residents", "http://evil.com", "https://evil.com/x", "javascript:alert(1)", " /x", "evil.com"]) {
    assert.equal(safeNextPath(v), null, JSON.stringify(v));
  }
});

test("anything a browser could read as off-site is refused", () => {
  for (const v of ["//evil.com", "//evil.com/x", "///evil.com", "/\\evil.com", "/\\/evil.com", "\\\\evil.com", "/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\u0000x", "/x\u007f", "/a\\b"]) {
    assert.equal(safeNextPath(v), null, JSON.stringify(v));
  }
});

test("the result is never an absolute or protocol-relative URL", () => {
  for (const v of ["/a", "/a?b=//evil.com", "/a/..//evil.com"]) {
    const got = safeNextPath(v);
    if (got !== null) assert.ok(got.startsWith("/") && !got.startsWith("//"), `${v} -> ${got}`);
  }
});
