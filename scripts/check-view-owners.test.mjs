import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findProblems, readState } from "./lib/view-owners.mjs";

test("the real repository is clean", () => {
  assert.deepEqual(findProblems(readState(".")), []);
});

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "viewowners-"));
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  for (const [f, t] of Object.entries(files)) writeFileSync(join(root, "supabase/migrations", f), t);
  return findProblems(readState(root));
}
const base = { "0100_a.sql": "create view public_old as select 1;", "0375_reown.sql": "-- the loop\n do $$ begin null; end $$;" };

test("a NEW view created after the re-own, with no owner change, is caught (the 0430 leak shape)", () => {
  const p = fixture({ ...base, "0440_new.sql": "create view public_zz as select * from site_content;\ngrant select on public_zz to anon;" });
  assert.equal(p.length, 1);
  assert.match(p[0], /public\.public_zz .*owned by postgres/);
});
test("the same view with alter view ... owner to rls_definer passes", () => {
  assert.deepEqual(fixture({ ...base, "0440_new.sql": "create view public_zz as select 1;\nalter view public_zz owner to rls_definer;" }), []);
});
test("security_invoker passes, and so does a view that filters by shelter itself", () => {
  assert.deepEqual(fixture({ ...base, "0440_a.sql": "create view public_a with (security_invoker = true) as select 1;", "0441_b.sql": "create view public_b as select 1 where shelter_id = (select current_shelter_id());" }), []);
});
test("create or replace on an existing re-owned view keeps its owner and passes", () => {
  assert.deepEqual(fixture({ ...base, "0440_r.sql": "create or replace view public_old as select 2;" }), []);
});
test("drop view then create view puts the runner back as owner and is caught", () => {
  const p = fixture({ ...base, "0440_r.sql": "drop view public_old;\ncreate view public_old as select 2;" });
  assert.match(p.join(), /public\.public_old .*owned by postgres/);
});
test("a view made before the re-own is covered by it, and comments or function bodies do not count", () => {
  assert.deepEqual(fixture({ ...base, "0440_c.sql": "-- create view public_c as select 1;\ncreate function f() returns void language sql as $$ create view public_d as select 1 $$;" }), []);
});
