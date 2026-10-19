import test from "node:test";
import assert from "node:assert/strict";
import { checkMakerSource } from "./maker-source.ts";

const row = (sub_folder, approved_at = "2026-10-01T00:00:00Z", owner_id = "r1") => ({ owner_id, sub_folder, approved_at });

test("a Medical photo is refused, whatever its spelling", () => {
  for (const f of ["Medical", "medical", " MEDICAL "]) {
    assert.deepEqual(checkMakerSource([row(f)]), { ok: false, reason: "medical" });
  }
});

test("a photo that is Medical in any one of its rows is refused", () => {
  assert.deepEqual(checkMakerSource([row("Shelter"), row("Medical")]), { ok: false, reason: "medical" });
});

test("a file that is not a resident's photo is refused", () => {
  assert.deepEqual(checkMakerSource([]), { ok: false, reason: "notFound" });
  assert.deepEqual(checkMakerSource(null), { ok: false, reason: "notFound" });
});

test("a photo still waiting for approval is refused", () => {
  assert.deepEqual(checkMakerSource([row("Shelter", null)]), { ok: false, reason: "notApproved" });
});

test("a Shelter, Foster or Adoption photo is allowed and names its resident", () => {
  for (const f of ["Shelter", "Foster", "Adoption", null]) {
    assert.deepEqual(checkMakerSource([row(f)]), { ok: true, residentIds: ["r1"] });
  }
});
