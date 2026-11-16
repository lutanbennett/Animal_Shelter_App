// #bcl1t: the browser Supabase client carries no x-shelter-id (a browser talks to Supabase directly, never through the Worker),
// so under Part 5's per-shelter policies a browser-side data read would return ZERO rows with no error. The agreed design is
// that no client code reads data through it: only auth calls (signOut, updateUser), which do not touch RLS tables.
// Data reads go through server.ts, which carries the header. If this fails, route the read through a server component or
// action; do not add a header to client.ts without reading docs/decisions/2026-11-16-browser-client-shelter.md.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const DATA_CALL = /\.(from|rpc|storage|channel|realtime)\s*[.(]/;

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) out.push(p);
  }
  return out;
}

/** Files that import the browser client, and the data-API lines in them. */
export function browserDataReads(files) {
  const bad = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (!/supabase\/client["']/.test(src)) continue;
    src.split("\n").forEach((l, i) => { if (DATA_CALL.test(l)) bad.push(`${f}:${i + 1}: ${l.trim()}`); });
  }
  return bad;
}

test("no file using the browser Supabase client reads data through it", () => {
  assert.deepEqual(browserDataReads(walk(join(ROOT, "src"))), []);
});

test("the detector does fire on a browser-side read (so a green above means something)", () => {
  // inline probe via the regexes rather than writing into src
  assert.ok(DATA_CALL.test('const { data } = await supabase.from("residents").select()'));
  assert.ok(DATA_CALL.test('await supabase.rpc("x")'));
  assert.ok(!DATA_CALL.test("await supabase.auth.signOut()"));
});
