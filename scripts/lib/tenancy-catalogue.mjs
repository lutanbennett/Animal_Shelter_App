// The catalogue lint multi-tenancy must ship with (docs/decisions/2026-11-13-tenancy-catalogue-lint.md).
//
// Pure functions: rows in, findings out, so the unit test needs no database.
//
// Why it exists (docs/decisions/2026-10-09-multi-tenancy-spike.md): on Supabase `postgres` has BYPASSRLS, so a view
// that is not security_invoker, and a security definer function, both skip every row-level policy, including the
// tenant one. Postgres cannot default an object's owner, so a migration that forgets is back to BYPASSRLS silently.

// Survivors, by NAME, each with its reason in checkable terms (the shape check-thai-dictionary.mjs uses for its own
// allow-lists). A name that no longer exists in the catalogue is reported STALE, so an entry cannot outlive its object.
export const ALLOWED = {
  "view:private.app_users": {
    reason:
      "joins auth.users, which has RLS on and no policies, and `postgres` cannot add one (Supabase owns `auth`); " +
      "a re-owned role reads 0 rows. Stays owned by postgres and takes the tenant filter by hand in its join to user_roles " +
      "(multi-tenancy spike, 'What fought back' 2).",
  },
  "function:public.login_display_name": {
    reason:
      "reads auth.users (RLS on, no policy; postgres cannot add one), so a re-owned role reads 0 rows. Stays owned by postgres; " +
      "it must take the tenant filter by hand when the tenancy build lands (docs/decisions/2026-11-14-tenancy-reown.md).",
  },
  "function:public.label_translations": {
    reason:
      "builds dynamic SQL and reaches auth.users, which a re-owned role is refused (42501, measured by " +
      "scripts/regress-tenancy-reown.mjs 2026-11-14). Stays owned by postgres (docs/decisions/2026-11-14-tenancy-reown.md).",
  },
};

// Role that will own tenant-safe objects once the re-own stream has run. None exists yet.
export const DEFAULT_TENANT_ROLE = null;

export const isInvoker = (opts) => /security_invoker\s*=\s*(true|on)/i.test(opts ?? "");

const key = (kind, schema, name) => `${kind}:${schema}.${name}`;

// views: { schema, name, owner, opts, api } (api = anon or authenticated can select it AND reach its schema)
// functions: { schema, name, owner, secdef, api } (api = anon or authenticated can execute it AND reach its schema)
export function lintCatalogue({ views, functions, tables = [] }, { tenantRole = DEFAULT_TENANT_ROLE, allowed = ALLOWED } = {}) {
  const findings = [];
  const allowedHit = [];
  const seen = new Set();
  for (const v of views) {
    const k = key("view", v.schema, v.name);
    seen.add(k);
    if (!v.api) continue;
    if (isInvoker(v.opts) || (tenantRole && v.owner === tenantRole)) continue;
    (allowed[k] ? allowedHit : findings).push({ rule: 1, object: k, owner: v.owner, why: allowed[k]?.reason });
  }
  for (const f of functions) {
    const k = key("function", f.schema, f.name);
    seen.add(k);
    if (!f.api || !f.secdef) continue;
    if (tenantRole && f.owner === tenantRole) continue;
    (allowed[k] ? allowedHit : findings).push({ rule: 2, object: k, owner: f.owner, why: allowed[k]?.reason });
  }
  // Rule 3: every public table with RLS on must carry the permissive `definer_all` policy (migration 0375). Without it a
  // re-owned view over the table reads 0 rows: the blank-page failure, not a leak. WIDE rule: all RLS tables, not only
  // those a view reads, because the next view over a table is exactly what nobody has written yet.
  for (const t of tables) {
    const k = key("table", t.schema, t.name);
    seen.add(k);
    if (!t.rls || t.hasDefinerAll) continue;
    (allowed[k] ? allowedHit : findings).push({ rule: 3, object: k, owner: t.owner, why: allowed[k]?.reason });
  }
  // An allow-list entry is only meaningful while its object still exists in the catalogue (API-reachable or not).
  const stale = Object.keys(allowed).filter((k) => !seen.has(k));
  return { findings, allowedHit, stale };
}

export const VIEWS_SQL = `
select n.nspname as schema, c.relname as name, pg_get_userbyid(c.relowner) as owner,
       coalesce(c.reloptions::text, '') as opts,
       ((has_table_privilege('anon', c.oid, 'select') and has_schema_privilege('anon', n.oid, 'usage'))
        or (has_table_privilege('authenticated', c.oid, 'select') and has_schema_privilege('authenticated', n.oid, 'usage'))) as api
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('v', 'm') and n.nspname in ('public', 'private') order by 1, 2`;

export const FUNCTIONS_SQL = `
select n.nspname as schema, p.proname as name, pg_get_userbyid(p.proowner) as owner, p.prosecdef as secdef,
       ((has_function_privilege('anon', p.oid, 'execute') and has_schema_privilege('anon', n.oid, 'usage'))
        or (has_function_privilege('authenticated', p.oid, 'execute') and has_schema_privilege('authenticated', n.oid, 'usage'))) as api
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.prokind = 'f' and n.nspname in ('public', 'private') order by 1, 2`;

// RLS tables in public and whether each carries the definer_all policy (named in 0375_reown_definers.sql).
export const TABLES_SQL = `
select n.nspname as schema, c.relname as name, pg_get_userbyid(c.relowner) as owner, c.relrowsecurity as rls,
       exists (select 1 from pg_policy p where p.polrelid = c.oid and p.polname = 'definer_all') as "hasDefinerAll"
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and n.nspname = 'public' order by 1, 2`;
