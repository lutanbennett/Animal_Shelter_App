import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKS, assertSelectOnly, buildQuery } from "./lib/readonly-checks.mjs";

test("every production check is one SELECT and runs in a read-only transaction", () => {
  for (const name of Object.keys(CHECKS)) {
    const q = buildQuery(name);
    assert.match(q, /^begin read only;/);
    assert.match(q, /rollback;$/);
  }
});

test("the lint refuses anything that could write", () => {
  for (const bad of [
    "delete from roles",
    "select 1; select 2",
    "select 1 from t where x = (insert into y values (1))",
    "with a as (update roles set name = 'x' returning 1) select * from a",
    "select nextval('s')",
    "select 1 -- ok\n; drop table t",
  ]) {
    assert.throws(() => assertSelectOnly("bad", bad), undefined, bad);
  }
  assert.doesNotThrow(() => assertSelectOnly("ok", "select 'insert; delete' as note"));
});

test("a caller cannot supply SQL: an unknown check name is refused", () => {
  assert.throws(() => buildQuery("select 1"));
  assert.throws(() => buildQuery("constructor"));
});

test("role-cards-coverage and cards-union read card_grants, not a literal", async () => {
  const { buildQuery } = await import("./lib/readonly-checks.mjs");
  for (const name of ["role-cards-coverage", "cards-union"]) {
    const sql = buildQuery(name);
    assert.match(sql, /card_grants/);
    assert.match(sql, /card_closure/);
    assert.doesNotMatch(sql, /values \(/);
  }
});

test("activities-grantable reads card_grants against permission_activities per level, not a literal", async () => {
  const { buildQuery } = await import("./lib/readonly-checks.mjs");
  const sql = buildQuery("activities-grantable");
  assert.match(sql, /permission_activities/);
  assert.match(sql, /card_grants/);
  assert.match(sql, /max\(g\.level\)/); // per level: an activity granted at read but never at edit is a gap at edit
  assert.doesNotMatch(sql, /values \(/);
});

// The verdict activities-grantable and check-ungranted-activities.mjs share (docs/decisions/2026-11-09-activities-grantable-ruling.md).
test("activities-grantable passes on the ruled set exactly and fails naming an activity that joins or leaves it", async () => {
  const { CHECKS } = await import("./lib/readonly-checks.mjs");
  const c = CHECKS["activities-grantable"];
  const file = {
    adminOnlyOnPurpose: [{ activity: "a.ruled", level: "edit", ruled: "2026-10-28", by: "Lutan", reason: "only Admin" }],
    foundNotRuled: [{ activity: "a.open", level: "edit", found: "2026-11-06", note: "not ruled" }],
  };
  const { compareToAllowlist } = await import("./lib/ungranted-allowlist.mjs");
  const cat = ["a.ruled", "a.open", "a.new"];

  const exact = compareToAllowlist(["a.ruled@edit", "a.open@edit"], cat, file);
  assert.deepEqual(exact.fails, []);
  assert.equal(exact.unruled.length, 1); // printed every run, does not fail

  const joined = compareToAllowlist(["a.ruled@edit", "a.open@edit", "a.new@read"], cat, file);
  assert.equal(joined.fails.length, 1);
  assert.match(joined.fails[0], /a\.new at read .*not on the allow-list/);

  const left = compareToAllowlist(["a.open@edit"], cat, file);
  assert.equal(left.fails.length, 1);
  assert.match(left.fails[0], /a\.ruled at edit, which a card now grants/);

  // The real allow-list, against the check's own failed(): a gap nobody recorded fails it.
  assert.equal(c.failed({ catalogue: ["zz.planted"], gaps: ["zz.planted@edit"] }), true);
});
