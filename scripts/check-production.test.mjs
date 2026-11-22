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

test("appeal-override resolves running through private.appeal_running and text approval, and never fails", async () => {
  const { CHECKS, buildQuery } = await import("./lib/readonly-checks.mjs");
  const c = CHECKS["appeal-override"];
  const none = { applied_0347: true, running_appeals: 5, by_override: [] };
  assert.equal(c.failed(none), false);
  assert.match(c.render(none).join(" "), /No animal is public through an appeal alone/);
  const some = { applied_0347: true, running_appeals: 5, by_override: [{ title: "Help Biscuit", status: "live" }] };
  assert.equal(c.failed(some), false);
  assert.match(c.render(some).join(" "), /Help Biscuit/);
  const sql = buildQuery("appeal-override");
  assert.match(sql, /private.appeal_running/);
  assert.match(sql, /public_ok/);
  assert.doesNotMatch(sql, /<> 'draft'/);
});

test("not-listed-publicly lists names, caps the list, resolves running through appeal_running and never fails", async () => {
  const { CHECKS, buildQuery } = await import("./lib/readonly-checks.mjs");
  const c = CHECKS["not-listed-publicly"];
  assert.equal(c.failed([{ name: "A" }]), false);
  const many = Array.from({ length: 45 }, (_, k) => ({ name: "R" + k }));
  const out = c.render(many);
  assert.match(out[0], /45 resident/);
  assert.match(out.join(" "), /and 5 more/);
  assert.match(out.join(" "), /R0/);
  const sql = buildQuery("not-listed-publicly");
  assert.match(sql, /private.appeal_running/);
  assert.match(sql, /public_ok/);
  assert.match(sql, /ready_for_adoption/);
  assert.doesNotMatch(sql, /status in [(]'live'/);
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

test("scheduled-writers says so plainly for a job with no row, and fails only where the status page is red", async () => {
  const { scheduledWriterLines, CHECKS } = await import("./lib/readonly-checks.mjs");
  const now = "2026-11-22T12:00:00Z";
  const cronOk = (jobname) => ({ jobname, job_exists: true, active: true, last_status: "succeeded", last_started_at: now, last_message: "1 row" });
  const base = { now, cron: ["purge-assistant-actions", "purge-donation-tax-ids", "purge-write-requests"].map(cronOk), writers: [] };
  const empty = scheduledWriterLines(base);
  assert.equal(empty.filter((x) => /no row: this job has never reported itself here/.test(x.line)).length, 4);
  assert.ok(!empty.some((x) => x.red), "never reported is amber on the page, so it must not fail");
  const failing = (n) => ({ ...base, writers: [{ job: "calendar-sweep", last_outcome: "failed", last_detail: "boom", last_ran_at: now, last_ok_at: null, fail_runs: n }] });
  assert.ok(!CHECKS["scheduled-writers"].failed(failing(1)), "one failed run is a blip");
  assert.ok(CHECKS["scheduled-writers"].failed(failing(2)), "two in a row is red, as health.ts has it");
  assert.ok(CHECKS["scheduled-writers"].render(failing(2)).some((l) => /RED.*boom/.test(l)));
  const skipped = { ...base, writers: [{ job: "label-drafts", last_outcome: "skipped", last_detail: "x", last_ran_at: now, last_ok_at: null, fail_runs: 0 }] };
  assert.ok(!CHECKS["scheduled-writers"].failed(skipped), "skipped is a legitimate outcome");
});

test("canary-planted-triggers fails only on a trigger on a planted table that reaches out, and its SQL keeps its word-boundary escapes", () => {
  const c = CHECKS["canary-planted-triggers"];
  const quiet = { triggers: [{ table: "residents", name: "t", enabled: "O", calls: "public.f", reaches_out: false, via: "" }], extensions: [], event_triggers: 6, outbound_functions: [] };
  assert.equal(c.failed(quiet), false);
  assert.equal(c.failed({ ...quiet, triggers: [{ ...quiet.triggers[0], reaches_out: true, via: "g" }] }), true);
  assert.ok(c.render({ ...quiet, triggers: [{ ...quiet.triggers[0], reaches_out: true, via: "g" }] }).some((l) => /REACHES OUT via g/.test(l)));
  // The two escapes that were lost once in an edit (a bare m and M then match nothing): in the SQL text they must be a backslash then m / M.
  assert.ok(c.sql.includes(String.fromCharCode(92) + "mnotify" + String.fromCharCode(92) + "M"));
  assert.ok(c.sql.includes("net" + String.fromCharCode(92) + ".http"));
});
