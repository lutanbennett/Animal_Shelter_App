#!/usr/bin/env node
/**
 * Checks the consumer warning apply-migrations.mjs prints
 * (scripts/lib/migration-consumers.mjs): header parsing, live vs undeployed
 * consumers, the "declares none" sentence, and that the live-release lookup
 * works against this repo's git. No network, no database.
 *
 *   node scripts/check-migration-consumers.mjs
 */
import { spawnSync } from "node:child_process";
import { assumedLiveRelease, consumerReport, declaredConsumers } from "./lib/migration-consumers.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check("no header -> null", declaredConsumers("-- just prose\nselect 1;") === null);
check("one path", eq(declaredConsumers("-- x\n-- consumer: src/a.ts\nselect 1;"), ["src/a.ts"]));
check("several paths", eq(declaredConsumers("-- consumer: src/a.ts, src/b/[id]/page.tsx\n"), ["src/a.ts", "src/b/[id]/page.tsx"]));
check("none -> empty list", eq(declaredConsumers("-- consumer: none\n"), []));
check("a header below the SQL starts is ignored", declaredConsumers("select 1;\n-- consumer: src/a.ts") === null);

const release = { version: "1.0.0", ref: "REL" };
const files = {
  "REL:src/live.ts": "same", "origin/main:src/live.ts": "same",
  "REL:src/edited.ts": "old", "origin/main:src/edited.ts": "new",
  "origin/main:src/new.ts": "x",
};
const read = (ref, path) => files[`${ref}:${path}`] ?? null;
const f = (name, header) => ({ name, sql: `${header}\nselect 1;` });

const live = consumerReport([f("0001_a.sql", "-- consumer: src/live.ts")], { release, read });
check("consumer live -> silent", live.warnings.length === 0 && live.notes.length === 0, JSON.stringify(live));
const fresh = consumerReport([f("0002_b.sql", "-- consumer: src/new.ts")], { release, read });
check("consumer not in the release -> warns", fresh.warnings.length === 1 && fresh.warnings[0].includes("does not exist in release 1.0.0"), JSON.stringify(fresh));
check("warning states the live release is assumed", fresh.notes.some((n) => n.includes("ASSUMED")));
const edited = consumerReport([f("0003_c.sql", "-- consumer: src/edited.ts")], { release, read });
check("consumer changed since release -> warns as unknown, not as missing", edited.warnings.length === 1 && edited.warnings[0].includes("may or may not"), JSON.stringify(edited));
const gone = consumerReport([f("0004_d.sql", "-- consumer: src/nope.ts")], { release, read });
check("consumer not on main -> warns", gone.warnings.length === 1 && gone.warnings[0].includes("not on origin/main"));
const none = consumerReport([f("0005_e.sql", "-- consumer: none"), f("0006_f.sql", "-- no header")], { release, read });
check("none is silent; no header is counted, not guessed", none.warnings.length === 0 && none.notes.length === 1 && none.notes[0].includes("1 file(s) declare no"), JSON.stringify(none));
const blind = consumerReport([f("0007_g.sql", "-- consumer: src/new.ts")], { release: null, read });
check("unknown live release -> skipped note, no warning", blind.warnings.length === 0 && blind.notes.some((n) => n.includes("skipped")));

const git = (a) => {
  const r = spawnSync("git", a, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
};
let rel = null;
try { git(["rev-parse", "--verify", "origin/main"]); rel = assumedLiveRelease(git); } catch { /* no origin/main here */ }
check("live release resolves from origin/main's package.json", rel === null ? true : /^\d+\.\d+\.\d+$/.test(rel.version) && /^[0-9a-f]{40}$/.test(rel.ref), JSON.stringify(rel));
console.log(rel ? `     (live assumed: ${rel.version} @ ${rel.ref.slice(0, 7)})` : "     (no origin/main here - lookup not exercised)");

process.exit(failures ? 1 : 0);
