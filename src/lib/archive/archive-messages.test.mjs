import test from "node:test";
import assert from "node:assert/strict";
import en from "../i18n/dictionaries/en.ts";
import th from "../i18n/dictionaries/th.ts";

// The archive and restore helpers take the dictionary from their caller, so
// what a user reads is whatever these entries say. (The helpers themselves
// import server-only and the PDF stack, which the test loader cannot load.)
test("every archive refusal exists in both languages, in different words", () => {
  for (const k of ["residentNotFound", "archiveFailed", "stillDeceased", "restoreFailed"]) {
    assert.ok(en.residents.deceased.archiveErrors[k], k);
    assert.ok(th.residents.deceased.archiveErrors[k], k);
    assert.notEqual(th.residents.deceased.archiveErrors[k], en.residents.deceased.archiveErrors[k]);
  }
});
test("the three Drive-folder warnings exist in both languages, in different words", () => {
  for (const k of ["driveFolderMoveFailed", "driveFolderRenameFailed", "driveFolderDeleteFailed"]) {
    assert.ok(en.common[k], k);
    assert.notEqual(th.common[k], en.common[k]);
  }
});
