// Fails if the per-shelter export could start including another shelter's rows (#sxyw3). OFFLINE: it needs no database.
//   node scripts/check-shelter-export.mjs
// What it asserts, against a fixture catalogue and the real registry:
//   1. every scoped table is read with exactly `shelter_id = '<the shelter>'`, and the shelter's own row only for `shelters`;
//   2. a table the registry leaves out is not read at all, and every unscoped table in the registry has a treatment;
//   3. parents load before children, and a foreign-key cycle is reported rather than looped on;
//   4. a row with no shelter is looked for in every scoped table (so it is refused, not dropped or included);
//   5. the CLI builds no row filter of its own (all filters come from scripts/lib/shelter-export.mjs).
// What it cannot assert: that the live schema matches the fixture. That is `node scripts/shelter-export.mjs --prove`, which
// needs a dev database holding a second shelter and a throwaway PostgreSQL server (docs/decisions/2026-11-17-per-shelter-export.md).
import fs from "node:fs";
import { insertSql, loadOrder, nullRowsSql, planTables, selectSql } from "./lib/shelter-export.mjs";

const A = "11111111-1111-4111-8111-111111111111";
const bad = [];
const expect = (ok, msg) => { if (!ok) bad.push(msg); };

const cols = (...n) => n.map((name) => ({ name }));
const fixture = {
  tables: [
    { name: "residents", scoped: true, columns: cols("id", "shelter_id", "name") },
    { name: "weights", scoped: true, columns: cols("id", "shelter_id", "resident_id") },
    { name: "a_cycle", scoped: true, columns: cols("id", "shelter_id", "b_id") },
    { name: "b_cycle", scoped: true, columns: cols("id", "shelter_id", "a_id") },
    { name: "shelters", scoped: false, columns: cols("id", "key") },
    { name: "units", scoped: false, columns: cols("id", "label") },
    { name: "status_alert_runs", scoped: false, columns: cols("id") },
  ],
  fks: [
    { child: "weights", parent: "residents" }, { child: "a_cycle", parent: "b_cycle" }, { child: "b_cycle", parent: "a_cycle" },
    { child: "residents", parent: "shelters" }, { child: "weights", parent: "units" }, { child: "residents", parent: "residents" },
  ],
};
const fixtureRegistry = { exportTreatment: { shelters: "own-row", units: "all", status_alert_runs: "none" } };

const plan = planTables(fixture, fixtureRegistry);
expect(plan.problems.length === 0, `fixture plan has problems: ${plan.problems.join("; ")}`);
const names = plan.tables.map((t) => t.name);
expect(!names.includes("status_alert_runs"), "a table treated as 'none' was exported");
expect(names.indexOf("shelters") < names.indexOf("residents") && names.indexOf("residents") < names.indexOf("weights") && names.indexOf("units") < names.indexOf("weights"), `parents must load before children: ${names.join(", ")}`);
expect(plan.cyclic.join() === "a_cycle,b_cycle", `the cycle should be reported, got [${plan.cyclic}]`);
expect(loadOrder(["x"], [{ child: "x", parent: "x" }]).cyclic.length === 0, "a self-referencing table is not a cycle");

for (const t of plan.tables) {
  const s = selectSql(t, A);
  const want = t.kind === "scoped" ? `shelter_id = '${A}'` : t.kind === "own-row" ? `id = '${A}'` : "true";
  expect(s.where === want, `${t.name}: filter is "${s.where}", expected "${want}"`);
  expect(s.count.includes(`where ${want}`) && s.page(0, 5).includes(`where ${want}`), `${t.name}: count/page SQL does not carry the filter`);
}
expect(!plan.tables.some((t) => t.kind === "scoped" && selectSql(t, A).where === "true"), "a scoped table would be read unfiltered");
expect(planTables(fixture, { exportTreatment: {} }).problems.length === 3, "an unscoped table with no treatment must be a problem (shelters, units, status_alert_runs)");
expect(planTables(fixture, { exportTreatment: { ...fixtureRegistry.exportTreatment, ghost: "all" } }).problems.some((p) => p.startsWith("ghost")), "a treatment for a table that is not unscoped must be a problem");
const nulls = nullRowsSql(plan.tables);
for (const t of plan.tables.filter((x) => x.kind === "scoped")) expect(nulls.includes(`'${t.name}'`) && nulls.includes("shelter_id is null"), `${t.name}: null-shelter rows are not looked for`);
expect(!/'shelters'|'units'/.test(nulls), "null-shelter look-up should cover scoped tables only");
let threw = false; try { selectSql(plan.tables[0], "x' or true --"); } catch { threw = true; }
expect(threw, "a shelter id that is not a uuid must be refused");
let collided = false; try { insertSql(plan.tables[0], [{ id: "$z$" }], "z"); } catch { collided = true; }
expect(collided, "a dollar-quote collision must throw, not corrupt the SQL");

// the real registry: every unscoped table recorded there has an export treatment
const reg = JSON.parse(fs.readFileSync("docs/tenancy-shared-tables-registry.json", "utf8"));
for (const t of Object.keys(reg.tables)) expect(["all", "own-row", "none"].includes(reg.exportTreatment?.[t]), `registry: ${t} has no exportTreatment (all | own-row | none)`);
for (const t of Object.keys(reg.exportTreatment ?? {})) expect(reg.tables[t], `registry: exportTreatment names ${t}, which is not a recorded unscoped table`);

// the CLI makes no filter of its own
const cli = fs.readFileSync("scripts/shelter-export.mjs", "utf8");
expect(!/shelter_id\s*=/.test(cli.replace(/\/\/.*$/gm, "")) || /shelter_id is distinct from/.test(cli), "scripts/shelter-export.mjs builds a shelter filter of its own; it must come from scripts/lib/shelter-export.mjs");
expect(!/shelter_id\s*=\s*'\$\{/.test(cli), "scripts/shelter-export.mjs interpolates a shelter_id filter itself");
expect(!/writeFileSync\([^)]*\b(script|plain)\b/.test(cli), "the CLI writes the plaintext script to disk");

bad.forEach((b) => console.log(`FAIL  ${b}`));
console.log(bad.length ? "NOT CLEAN" : "the shelter export reads only the named shelter's rows (fixture and registry)");
process.exit(bad.length ? 1 : 0);
