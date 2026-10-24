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

test("the expected grants come from cards.ts and only plain keys reach SQL", async () => {
  const { expectedGrants, expectedGrantsSql } = await import("./lib/card-bundles.mjs");
  const g = expectedGrants();
  assert.ok(g.some((r) => r.card === "my_tasks" && r.activity === "recurring.do_own" && r.level === 2));
  assert.ok(g.some((r) => r.card === "residents" && r.activity === "resident.record" && r.level === 2));
  assert.match(expectedGrantsSql(), /^\('[a-z_]+','[a-z_.]+',[12]\)(,\('[a-z_]+','[a-z_.]+',[12]\))*$/);
});
