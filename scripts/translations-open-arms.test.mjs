// translations-open tests its own coverage against the CODE, never the data: an empty registered table must not read as untaught.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKS, assertSelectOnly } from "./lib/readonly-checks.mjs";

const sql = CHECKS["translations-open"].sql;

test("uncovered reads the taught list, not the arms", () => {
  assert.match(sql, /where not exists \(select 1 from taught a /);
  assert.doesNotMatch(sql, /not exists \(select 1 from arm /);
});

test("every arm's pair is in the taught list, and nothing else is", () => {
  const taught = new Set([...sql.match(/values (.*?)\),\s+arm\(/s)[1].matchAll(/\('(\w+)', '(\w+)'\)/g)].map((m) => m[1] + "." + m[2]));
  const arms = new Set([...sql.matchAll(/select '(\w+)', '(\w+)', id::text/g)].map((m) => m[1] + "." + m[2]));
  assert.ok(arms.size >= 32);
  assert.deepEqual([...taught].sort(), [...arms].sort());
});

test("still one select statement the read-only runner accepts", () => assertSelectOnly("translations-open", sql));
