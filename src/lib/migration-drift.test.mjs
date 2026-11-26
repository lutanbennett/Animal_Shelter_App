import test from "node:test";
import assert from "node:assert/strict";
import { migrationDrift, renumberedRows } from "./migration-drift.ts";

// The real case (docs/decisions/2026-11-26-dev-migration-0422.md): 0422 was
// applied on dev, renumbered to 0423 before merge, and 0423 applied too.
const files = ["0421_a.sql", "0422_other.sql", "0423_keep_an_admin_per_shelter.sql"];

test("a renumbered file's old row is named, with the file that replaced it", () => {
  const applied = [...files, "0422_keep_an_admin_per_shelter.sql"];
  const { missingFile } = migrationDrift(applied, files);
  assert.deepEqual(renumberedRows(missingFile, files, applied), [
    { row: "0422_keep_an_admin_per_shelter.sql", file: "0423_keep_an_admin_per_shelter.sql" },
  ]);
});

test("not offered while the new name is still unapplied: the row is then the only record", () => {
  const applied = ["0421_a.sql", "0422_other.sql", "0422_keep_an_admin_per_shelter.sql"];
  const { missingFile } = migrationDrift(applied, files);
  assert.deepEqual(renumberedRows(missingFile, files, applied), []);
});

test("an orphan with no namesake is left alone (a real abandoned branch)", () => {
  const applied = [...files, "0424_abandoned.sql"];
  const { missingFile } = migrationDrift(applied, files);
  assert.deepEqual(renumberedRows(missingFile, files, applied), []);
});
