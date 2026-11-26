import { test } from "node:test";
import assert from "node:assert/strict";
import { lintCatalogue, isInvoker } from "./lib/tenancy-catalogue.mjs";

const v = (name, o = {}) => ({ schema: "public", name, owner: "postgres", opts: "", api: true, ...o });
const f = (name, o = {}) => ({ schema: "public", name, owner: "postgres", secdef: true, api: true, ...o });

test("owner-run API view and definer function are flagged; invoker view and invoker function are not", () => {
  const r = lintCatalogue({
    views: [v("bad"), v("ok", { opts: '{security_invoker=true}' })],
    functions: [f("bad_fn"), f("ok_fn", { secdef: false })],
  });
  assert.deepEqual(r.findings.map((x) => x.object), ["view:public.bad", "function:public.bad_fn"]);
});

test("objects the API cannot reach are not flagged", () => {
  const r = lintCatalogue({ views: [v("hidden", { api: false })], functions: [f("hidden_fn", { api: false })] });
  assert.equal(r.findings.length, 0);
});

test("tenant-owned objects pass", () => {
  const r = lintCatalogue({ views: [v("a", { owner: "t" })], functions: [f("b", { owner: "t" })] }, { tenantRole: "t" });
  assert.equal(r.findings.length, 0);
});

test("allow-list is by name, reported, and a vanished entry is stale", () => {
  const allowed = { "view:public.exc": { reason: "r" }, "view:public.gone": { reason: "r" } };
  const r = lintCatalogue({ views: [v("exc")], functions: [] }, { allowed });
  assert.equal(r.findings.length, 0);
  assert.equal(r.allowedHit.length, 1);
  assert.deepEqual(r.stale, ["view:public.gone"]);
});

test("security_invoker=false is not an invoker view", () => {
  assert.equal(isInvoker("{security_invoker=false}"), false);
  assert.equal(isInvoker("{security_invoker=on}"), true);
});

const t = (name, o = {}) => ({ schema: "public", name, owner: "postgres", rls: true, hasDefinerAll: true, ...o });

test("rule 3: an RLS table without definer_all is flagged; with it, or without RLS, it is not", () => {
  const r = lintCatalogue({ views: [], functions: [], tables: [t("bad", { hasDefinerAll: false }), t("ok"), t("norls", { rls: false, hasDefinerAll: false })] });
  assert.deepEqual(r.findings.map((x) => [x.rule, x.object]), [[3, "table:public.bad"]]);
});

test("rule 3: allow-list by name works and a vanished table entry is stale", () => {
  const allowed = { "table:public.exc": { reason: "r" }, "table:public.gone": { reason: "r" } };
  const r = lintCatalogue({ views: [], functions: [], tables: [t("exc", { hasDefinerAll: false })] }, { allowed });
  assert.equal(r.findings.length, 0);
  assert.deepEqual(r.stale, ["table:public.gone"]);
});

// --- the migration-file gate (#tnc41; scripts/lib/tenancy-migration-lint.mjs) ---
import { lintMigration, qualify } from "./lib/tenancy-migration-lint.mjs";

const fn = (name, extra = "") =>
  `create or replace function public.${name}(p text) returns void language plpgsql security definer set search_path = '' as $$ begin perform 1; end; $$;\n${extra}`;

test("migration gate: a new definer function with no owner is flagged; owner to rls_definer clears it, even inside do $$", () => {
  assert.deepEqual(lintMigration(fn("a")).findings.map((x) => x.object), ["function:public.a"]);
  assert.equal(lintMigration(fn("a", "alter function public.a(text) owner to rls_definer;")).findings.length, 0);
  assert.equal(
    lintMigration(fn("a", "do $$ begin if true then alter function public.a(text) owner to rls_definer; end if; end $$;")).findings.length,
    0,
  );
});

test("migration gate: invoker functions, and definers revoked from the API, are not flagged", () => {
  assert.equal(lintMigration(fn("a").replace("security definer", "security invoker")).findings.length, 0);
  assert.equal(lintMigration(fn("a", "revoke execute on function public.a(text) from public, anon, authenticated;")).findings.length, 0);
  const regranted = fn("a", "revoke all on function public.a(text) from public, anon, authenticated;\ngrant execute on function public.a(text) to authenticated;");
  assert.equal(lintMigration(regranted).findings.length, 1);
});

test("migration gate: views need invoker or an owner; RLS tables need definer_all", () => {
  assert.equal(lintMigration("create view v as select 1;").findings[0].rule, 1);
  assert.equal(lintMigration("create view v with (security_invoker = true) as select 1;").findings.length, 0);
  assert.equal(lintMigration("create view v as select 1; alter view public.v owner to rls_definer;").findings.length, 0);
  const t = "create table if not exists public.t (id int); alter table public.t enable row level security;";
  assert.equal(lintMigration(t).findings[0].object, "table:public.t");
  assert.equal(lintMigration(t + " create policy definer_all on public.t for all to rls_definer using (true);").findings.length, 0);
  assert.equal(lintMigration("create table public.t (id int);").findings.length, 0);
});

test("migration gate: redefinitions of existing objects are left to the nightly; ALLOWED entries pass, by name", () => {
  assert.equal(lintMigration(fn("a"), { existing: new Set(["function:public.a"]) }).findings.length, 0);
  const r = lintMigration(fn("a"), { allowed: { "function:public.a": { reason: "r" } } });
  assert.equal(r.findings.length, 0);
  assert.equal(r.allowedHit.length, 1);
  assert.equal(lintMigration("-- create view v as select 1;\nselect 1;").findings.length, 0);
  assert.deepEqual(qualify('"Private"."X"'), { schema: "private", name: "x" });
});
