import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditTriggerTables } from "./lib/audit-triggers.mjs";
import { accessTableProblems, createdTables } from "./lib/access-tables.mjs";

const AUDIT = "create function record_audit() returns trigger language plpgsql as $$ begin insert into audit_log values (1); return new; end $$;";
const trig = (t) => `create trigger ${t}_audit after insert on ${t} for each row execute function record_audit();`;
function run(files, notAccess = {}) {
  const dir = mkdtempSync(join(tmpdir(), "mig-"));
  files.forEach((sql, i) => writeFileSync(join(dir, `000${i + 1}_x.sql`), sql));
  return accessTableProblems(createdTables(dir), new Set(auditTriggerTables(dir).keys()), notAccess);
}

test("a new permissions table with NO audit trigger fails and names itself and where to fix it", () => {
  const r = run([AUDIT + "create table card_grants (id int);" + trig("card_grants"), "create table role_overrides (id int);"]);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /role_overrides/);
  assert.match(r.problems[0], /scripts\/lib\/access-tables\.mjs/);
});

test("the same table with a trigger passes", () => {
  assert.deepEqual(run([AUDIT + "create table role_overrides (id int);" + trig("role_overrides")]).problems, []);
});

test("an unrelated table needs no trigger; a table dropped later is forgotten", () => {
  assert.deepEqual(run([AUDIT + "create table cats (id int); create table card_x (id int);", "drop table card_x;"]).problems, []);
});

test("an excused layout table is not expected, and an excuse for a missing table is stale", () => {
  assert.deepEqual(run([AUDIT + "create table role_groups (id int);"], { role_groups: "layout" }).problems.filter((p) => /role_groups/.test(p)), []);
  assert.match(run([AUDIT], { ghost: "x" }).problems.join(), /NOT_ACCESS but no migration creates it/);
});

test("the real repository passes", () => {
  const r = accessTableProblems(createdTables(), new Set(auditTriggerTables().keys()));
  assert.deepEqual(r.problems, []);
  assert.ok(r.expected.includes("card_includes") && r.expected.includes("card_grants"));
});
