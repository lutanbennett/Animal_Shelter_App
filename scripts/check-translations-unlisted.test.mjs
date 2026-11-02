import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { DELIBERATE, load, scan } from "./check-translations-unlisted.mjs";

const REGISTER = `insert into translatable_labels (table_name, column_name, th_column, label_group, optional) values
  ('cats', 'name', 'name_th', 'places', false);`;

test("an unregistered _th column fails, and names the table.column", () => {
  const r = scan([{ name: "0001_a.sql", sql: "alter table cats add column if not exists name_th text;" }]);
  assert.deepEqual(r.unlisted.map(([k]) => k), ["cats.name_th"]);
});

test("registering it, in the same or a later file, makes it pass", () => {
  const add = { name: "0001_a.sql", sql: "alter table cats add column if not exists name_th text;" };
  assert.equal(scan([add, { name: "0002_b.sql", sql: REGISTER }]).unlisted.length, 0);
  assert.equal(scan([{ name: "0001_a.sql", sql: add.sql + "\n" + REGISTER }]).unlisted.length, 0);
});

test("a column declared inside create table is seen, a commented-out one is not, a dropped one is forgotten", () => {
  const create = "create table dogs (\n  id uuid,\n  nick_th text\n);";
  assert.deepEqual(scan([{ name: "0001.sql", sql: create }]).unlisted.map(([k]) => k), ["dogs.nick_th"]);
  assert.equal(scan([{ name: "0001.sql", sql: "-- alter table x add column a_th text;" }]).declared.size, 0);
  assert.equal(scan([{ name: "0001.sql", sql: create }, { name: "0002.sql", sql: "alter table dogs drop column if exists nick_th;" }]).unlisted.length, 0);
});

test("rounds.name_th is named in the gate, with a reason, and is not flagged", () => {
  assert.ok(DELIBERATE["rounds.name_th"].length > 10);
  const r = scan([{ name: "0001.sql", sql: "create table rounds (\n  name_th text not null\n);" }]);
  assert.equal(r.unlisted.length, 0);
});

test("today's migrations are clean", () => {
  const r = scan(load("supabase/migrations"));
  assert.ok(r.declared.size > 20);
  assert.deepEqual(r.unlisted, []);
});

test("the CLI exits 1 on a folder holding an omission and 0 on the real one", () => {
  const bad = spawnSync("node", ["scripts/check-translations-unlisted.mjs", "--dir", "scripts/test-fixtures/unlisted-th"], { encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /fixture_cats\.name_th/);
  assert.equal(spawnSync("node", ["scripts/check-translations-unlisted.mjs"], { encoding: "utf8" }).status, 0);
});
