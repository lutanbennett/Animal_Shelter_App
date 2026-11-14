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
