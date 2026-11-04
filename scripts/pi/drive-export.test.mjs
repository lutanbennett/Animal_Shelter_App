import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, isWorthRetrying, isNative, EXPORTABLE, FOLDER } from "./drive-export.mjs";

const G = "application/vnd.google-apps.";

test("a folder is walked into, not copied", () => {
  assert.equal(plan(FOLDER), "folder");
});

test("the Docs-editors types export", () => {
  for (const kind of ["document", "spreadsheet", "presentation", "drawing"]) {
    assert.equal(plan(G + kind), "export", `${kind} should export`);
  }
});

test("native types Drive cannot export are skipped, never failed", () => {
  // This is the whole point: each of these answered HTTP 400 and failed the nightly run.
  for (const kind of ["form", "site", "jam", "map", "fusiontable", "script"]) {
    assert.equal(plan(G + kind), "unexportable", `${kind} should be skipped`);
  }
});

test("an ordinary file is downloaded as itself", () => {
  for (const mime of ["image/jpeg", "application/pdf", "video/mp4", "text/plain"]) {
    assert.equal(plan(mime), "download");
  }
});

test("a shortcut is skipped, as it always was", () => {
  assert.equal(plan(G + "shortcut"), "shortcut");
  assert.equal(isNative(G + "shortcut"), false);
});

test("every exportable type is native, and none of them is the folder type", () => {
  for (const mime of EXPORTABLE) {
    assert.equal(isNative(mime), true);
    assert.notEqual(mime, FOLDER);
  }
});

test("a dropped connection is retried and a 4xx is not", () => {
  // undici throws a bare `terminated` when the body stream dies mid-download.
  assert.equal(isWorthRetrying("terminated"), true);
  assert.equal(isWorthRetrying("ECONNRESET"), true);
  assert.equal(isWorthRetrying("HTTP 500"), true, "get() retries 5xx, but a late one is still worth a retry");
  assert.equal(isWorthRetrying("HTTP 400"), false);
  assert.equal(isWorthRetrying("HTTP 403"), false);
  assert.equal(isWorthRetrying("HTTP 404"), false);
});

test("isWorthRetrying survives a thrown non-string", () => {
  assert.equal(isWorthRetrying(undefined), true);
});
