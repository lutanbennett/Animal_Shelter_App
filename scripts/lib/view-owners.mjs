// #m52yp: which owner will each view have once every migration has run? Read from the migration FILES only: no database, no token,
// so it rides `npm run lint` into CI (the catalogue lint, tenancy-catalogue.mjs, reads the live owner and needs a token, so it runs
// nightly against dev only). Why owner matters (docs/decisions/2026-11-21-public-views-owner-check.md): a view that is not
// security_invoker runs as its OWNER, and the restrictive per-shelter policies of 0392 apply to it only if its owner obeys row-level
// security. `rls_definer` does; `postgres` (the migration runner, BYPASSRLS) does not. `create view` as the runner makes a postgres-owned
// view; `create or replace view` on an existing one keeps its owner. So a NEW view needs an `alter view ... owner to rls_definer`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// 0375 re-owned every API-reachable owner-run view to rls_definer in a DO loop this reader cannot execute: it is modelled here.
export const REOWN_MIGRATION = 375;

export function stripSql(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\$([a-z_]*)\$[\s\S]*?\$\1\$/gi, " "); // function and DO bodies: not top-level statements
}

const NAME = String.raw`(?:"?(public|private)"?\.)?"?([a-z0-9_]+)"?`;
const key = (schema, name) => `${schema ?? "public"}.${name}`;

/** Fold one file's statements into `state` (Map view -> {owner, invoker, scoped, file}). */
export function applyMigration(state, file, sql) {
  const text = stripSql(sql);
  const events = [];
  for (const m of text.matchAll(new RegExp(String.raw`create\s+(or\s+replace\s+)?(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?${NAME}([^;]*)`, "gi"))) {
    events.push({ at: m.index, kind: "create", replace: !!m[1], k: key(m[3], m[4]), body: m[5] });
  }
  for (const m of text.matchAll(new RegExp(String.raw`alter\s+(?:materialized\s+)?view\s+(?:if\s+exists\s+)?${NAME}\s+owner\s+to\s+"?([a-z0-9_]+)"?`, "gi"))) {
    events.push({ at: m.index, kind: "owner", k: key(m[1], m[2]), owner: m[3] });
  }
  for (const m of text.matchAll(new RegExp(String.raw`alter\s+(?:materialized\s+)?view\s+(?:if\s+exists\s+)?${NAME}\s+set\s*\(([^)]*)\)`, "gi"))) {
    events.push({ at: m.index, kind: "opts", k: key(m[1], m[2]), opts: m[3] });
  }
  for (const m of text.matchAll(new RegExp(String.raw`drop\s+(?:materialized\s+)?view\s+(?:if\s+exists\s+)?${NAME}`, "gi"))) {
    events.push({ at: m.index, kind: "drop", k: key(m[1], m[2]) });
  }
  events.sort((a, b) => a.at - b.at);
  const invoker = (s) => /security_invoker\s*=\s*(true|on)/i.test(s);
  for (const e of events) {
    if (e.kind === "drop") state.delete(e.k);
    else if (e.kind === "owner") { const v = state.get(e.k); if (v) v.owner = e.owner; }
    else if (e.kind === "opts") { const v = state.get(e.k); if (v && invoker(e.opts)) v.invoker = true; }
    else {
      const scoped = /current_shelter_id\s*\(/i.test(e.body);
      const had = state.get(e.k);
      if (e.replace && had) { // create or replace keeps the owner; options only change if restated
        had.scoped = scoped; had.file = file;
        had.invoker = invoker(e.body) || (had.invoker && !/with\s*\(/i.test(e.body));
      } else {
        state.set(e.k, { owner: "postgres", invoker: invoker(e.body), scoped, file });
      }
    }
  }
}

export function readState(root) {
  const dir = join(root, "supabase/migrations");
  const files = readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
  const state = new Map();
  for (const f of files) {
    applyMigration(state, f, readFileSync(join(dir, f), "utf8"));
    if (Number(f.slice(0, 4)) === REOWN_MIGRATION) for (const v of state.values()) if (!v.invoker) v.owner = "rls_definer";
  }
  return state;
}

/** A view is fine when it is security_invoker, owned by a non-bypass tenant role, or filters by shelter itself (0391/0430). */
export function findProblems(state, { tenantRole = "rls_definer" } = {}) {
  const out = [];
  for (const [k, v] of state) {
    if (v.invoker || v.owner === tenantRole || v.scoped) continue;
    out.push(`${k} (last created in ${v.file}) will be owned by ${v.owner} and does not scope itself: it answers every shelter's rows to anyone. Add "alter view ${k} owner to ${tenantRole};" to the migration, or set security_invoker, or filter by current_shelter_id() (0430).`);
  }
  return out.sort();
}
