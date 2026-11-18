// Fails when a createAdminClient() call in src/ is not recorded in docs/service-role-sites-registry.json, or a record
// no longer matches a call. Part 7 of the tenancy programme (#ps6ms): the canary diff works through database roles and
// cannot see a service-role call, so this is the check that can. Reads files only; no network, no token.
// Scope (stated on the registry's own face, under `scope`): class A src/ createAdminClient() calls and class B worker/ functions that read
// the service-role key. Classes C (scripts/) and D (database functions, pg_cron) are named there as OUT of scope, with their counts.
//   node scripts/check-service-role-sites.mjs
import fs from "node:fs";
import { execSync } from "node:child_process";
import { findSites, findWorkerSites, compare, unfilteredClaims } from "./lib/service-role-sites.mjs";

const files = {};
for (const f of execSync("git ls-files src", { encoding: "utf8" }).split(/\r?\n/).filter((f) => /\.(ts|tsx)$/.test(f))) files[f] = fs.readFileSync(f, "utf8");
const registry = JSON.parse(fs.readFileSync("docs/service-role-sites-registry.json", "utf8"));
const workerFiles = {};
for (const f of execSync("git ls-files worker", { encoding: "utf8" }).split(/\r?\n/).filter((f) => /\.mjs$/.test(f))) workerFiles[f] = fs.readFileSync(f, "utf8");
const workerSites = findWorkerSites(workerFiles);
const wr = compare(workerSites, { sites: registry.workerSites ?? [] });
const scope = registry.scope ?? {};
const scopeBad = ["src", "worker", "scripts", "database"].filter((k) => !scope[k] || !scope[k].status || !scope[k].why || (scope[k].status === "out-of-scope" && scope[k].count == null));
const sites = findSites(files);
const r = compare(sites, registry);
const count = (c) => registry.sites.filter((s) => s.classification === c).length;
console.log(`${sites.length} createAdminClient() calls in ${new Set(sites.map((s) => s.file)).size} files; registry: ${count("needs-shelter-filter")} need a shelter filter, ${count("cross-shelter")} cross-shelter by design, ${count("unclassified")} unclassified, ${count("filtered")} filtered.`);
for (const s of r.unregistered) console.log(`UNREGISTERED  ${s.id} (line ${s.line}): classify it in docs/service-role-sites-registry.json`);
for (const id of r.stale) console.log(`STALE  ${id}: no such call any more; delete its record`);
for (const s of r.unclassified) console.log(`BAD CLASSIFICATION  ${s.id}: ${s.classification}`);
for (const id of r.noReason) console.log(`NO REASON  ${id}: the reason is the deliverable`);
const liars = unfilteredClaims(files, sites, registry);
for (const id of liars) console.log(`NOT FILTERED  ${id}: recorded filtered, but no shelter_id / actingShelterId in its function`);
console.log(`${workerSites.length} worker/ functions read the service-role key in ${new Set(workerSites.map((x) => x.file)).size} files; registry records ${(registry.workerSites ?? []).length}.`);
for (const x of wr.unregistered) console.log(`UNREGISTERED WORKER  ${x.id} (line ${x.line}): record it under workerSites`);
for (const id of wr.stale) console.log(`STALE WORKER  ${id}: no such function reads the key any more; delete its record`);
for (const x of wr.unclassified) console.log(`BAD CLASSIFICATION  ${x.id}: ${x.classification}`);
for (const id of wr.noReason) console.log(`NO REASON  ${id}: the reason is the deliverable`);
for (const k of scopeBad) console.log(`SCOPE NOT STATED  registry.scope.${k} needs status, why (and count when out-of-scope)`);
const bad = liars.length + scopeBad.length + wr.unregistered.length + wr.stale.length + wr.unclassified.length + wr.noReason.length + r.unregistered.length + r.stale.length + r.unclassified.length + r.noReason.length;
console.log(bad ? "NOT CLEAN" : "every service-role call is recorded");
process.exit(bad ? 1 : 0);
