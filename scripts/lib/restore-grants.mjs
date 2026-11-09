// Put a restored database's privileges back to exactly what the backup recorded.
//
// WHY. Every restore recipe here uses `pg_restore --no-owner --no-privileges`: production's
// ownership and grants name roles and grantors a fresh project may not have, so they are left
// out and the target's defaults fill in. On Supabase that default is wrong in BOTH directions
// (measured on UAT, 2026-11-09, against Test built by migrations): objects in a hand-made
// `private` schema get NOTHING, so the app cannot show residents (#rg7pv); and everything in
// `public` gets Supabase's default privileges, which hand anon/authenticated/service_role
// every privilege on every table and function, bringing back about 890 grants the migrations
// had deliberately revoked (TRUNCATE, DELETE, EXECUTE on internal functions, ...).
//
// HOW. The backup still holds production's ACL entries (backup.mjs does not strip them). So:
//   1. reset every object in the schemas to its built-in default ACL (acldefault: the owner
//      only, plus PUBLIC EXECUTE on functions), which is exactly the baseline pg_dump writes
//      its GRANT/REVOKE statements against;
//   2. replay the archive's own ACL entries for those schemas;
// both in ONE transaction, so a failure part-way leaves the database as it was rather than
// with nothing granted. Then prove it: pg_dump the target's schema and compare its
// GRANT/REVOKE lines with the archive's, line for line (compareAcls).
//
// Used by scripts/restore-grants.mjs (a real target) and scripts/restore-rehearsal.mjs (the
// local throwaway server), so the recipe and its rehearsal cannot drift apart.

export const GRANT_SCHEMAS = ["public", "private"];

/**
 * The TOC lines (`pg_restore --list`) to replay: ACL entries on objects in `schemas`, the
 * schemas' own ACLs, and DEFAULT ACL entries in `schemas` held by `owner` (default privileges
 * for another role cannot be set by a non-superuser, and Supabase's restorer is not one).
 * owner null: every role's, for COMPARING with a real Supabase target, whose platform defaults
 * (FOR ROLE supabase_admin) the backup also records and the target should already hold.
 */
export function aclTocLines(toc, schemas = GRANT_SCHEMAS, owner = "postgres") {
  return toc.split(/\r?\n/).filter((line) => {
    let m = /^\d+; \d+ \d+ ACL (\S+) (.+) \S+$/.exec(line);
    if (m) {
      const [, ns, tag] = m;
      if (ns === "-") return schemas.includes(/^SCHEMA (\S+)$/.exec(tag)?.[1]);
      return schemas.includes(ns);
    }
    m = /^\d+; \d+ \d+ DEFAULT ACL (\S+) .+ (\S+)$/.exec(line);
    return Boolean(m) && schemas.includes(m[1]) && (owner === null || m[2] === owner);
  });
}

/**
 * SQL that resets every table, view, sequence and function in `schemas` to acldefault, and
 * strips the API roles from the schemas themselves (except `public`, whose USAGE grants
 * Supabase made at project creation and which the replay may not restate). Extension members
 * are left alone: they are the extension's, not ours.
 */
export function resetSql(schemas = GRANT_SCHEMAS, objects = null) {
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  const list = schemas.map(q).join(",");
  // Only objects the backup holds (archiveObjects keys), when given: an object a newer migration
  // created is not in the backup, so the replay would not restate its grants, and resetting it
  // would strip them. Without `objects`, every object in the schemas is reset.
  const only = (kind) => {
    if (!objects) return "";
    const names = [...objects].filter((k) => k.startsWith(`${kind} `)).map((k) => q(k.slice(kind.length + 1)));
    return names.length ? ` and (n.nspname || '.' || %NAME%) = any (array[${names.join(",")}]::text[])` : " and false";
  };
  return `
do $reset$ declare r record; begin
  perform set_config('search_path', '', true);  -- so regprocedure text is schema-qualified
  for r in
    select format('%I.%I', n.nspname, c.relname) as o, c.relkind
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname in (${list}) and c.relkind in ('r','v','m','p','f','S')
       and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e')
       and ((c.relkind <> 'S'${only("TABLE").replace("%NAME%", "c.relname")}) or (c.relkind = 'S'${only("SEQUENCE").replace("%NAME%", "c.relname")}))
  loop
    execute format('revoke all on %s %s from public, anon, authenticated, service_role',
                   case when r.relkind = 'S' then 'sequence' else 'table' end, r.o);
  end loop;
  for r in
    select p.oid::regprocedure::text as o, p.prokind
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in (${list}) and p.prokind in ('f','p')
       and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
       and ((p.prokind = 'f'${only("FUNCTION").replace("%NAME%", "p.proname")}) or (p.prokind = 'p'${only("PROCEDURE").replace("%NAME%", "p.proname")}))
  loop
    execute format('revoke all on %s %s from public, anon, authenticated, service_role',
                   case when r.prokind = 'p' then 'procedure' else 'function' end, r.o);
    execute format('grant execute on %s %s to public',
                   case when r.prokind = 'p' then 'procedure' else 'function' end, r.o);
  end loop;
  for r in select nspname from pg_namespace where nspname in (${list}) and nspname <> 'public' loop
    execute format('revoke all on schema %I from public, anon, authenticated, service_role', r.nspname);
  end loop;
  -- Default privileges for objects created later: Supabase's give the API roles everything in
  -- public; production's revoke anon's (measured: the backup's DEFAULT ACL has no anon line).
  -- Clear postgres's per-schema defaults so the replay restates exactly the backup's.
  for r in select nspname from pg_namespace where nspname in (${list}) loop
    execute format('alter default privileges for role postgres in schema %I revoke all on tables from anon, authenticated, service_role', r.nspname);
    execute format('alter default privileges for role postgres in schema %I revoke all on sequences from anon, authenticated, service_role', r.nspname);
    execute format('alter default privileges for role postgres in schema %I revoke all on functions from anon, authenticated, service_role', r.nspname);
  end loop;
end $reset$;
`;
}

/** The privilege statements in SQL text written by pg_dump/pg_restore: GRANT, REVOKE, ALTER DEFAULT PRIVILEGES. */
export function aclStatements(sql) {
  return sql
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(GRANT|REVOKE|ALTER DEFAULT PRIVILEGES) /.test(l));
}

/**
 * The object a privilege statement is about, as a kind and a schema-qualified name WITHOUT
 * arguments ("FUNCTION private.works_with_residents"): pg_dump writes function arguments with
 * their names in ACL statements and without them in the TOC, so overloads are folded together.
 * Default-privilege statements key on their own prefix.
 */
export function aclObject(statement) {
  if (statement.startsWith("ALTER DEFAULT PRIVILEGES")) return statement.replace(/ (GRANT|REVOKE) .*$/, "");
  const m = / ON (TABLE|SEQUENCE|FUNCTION|PROCEDURE|SCHEMA) (.+?) (?:TO|FROM) /.exec(statement);
  return m ? `${m[1]} ${m[2].replace(/\(.*$/, "").replace(/"/g, "")}` : statement;
}

/** Every object the archive holds in `schemas`, keyed as aclObject keys them (from `pg_restore --list`). */
export function archiveObjects(toc, schemas = GRANT_SCHEMAS) {
  const keys = new Set();
  const kinds = { TABLE: "TABLE", VIEW: "TABLE", "MATERIALIZED VIEW": "TABLE", "FOREIGN TABLE": "TABLE", SEQUENCE: "SEQUENCE", FUNCTION: "FUNCTION", PROCEDURE: "PROCEDURE" };
  for (const line of toc.split(/\r?\n/)) {
    const m = /^\d+; \d+ \d+ (TABLE|VIEW|MATERIALIZED VIEW|FOREIGN TABLE|SEQUENCE|FUNCTION|PROCEDURE) (\S+) ([^ (]+)/.exec(line);
    if (m && schemas.includes(m[2])) keys.add(`${kinds[m[1]]} ${m[2]}.${m[3].replace(/"/g, "")}`);
    const s = /^\d+; \d+ \d+ SCHEMA - (\S+) /.exec(line);
    if (s && schemas.includes(s[1])) keys.add(`SCHEMA ${s[1]}`);
  }
  for (const ns of schemas) keys.add(`SCHEMA ${ns}`); // `public` exists before any restore and is not in the TOC
  return keys;
}

/**
 * Compare the archive's privilege statements with the target's. `missing`: in the archive, not
 * on the target. `extra`: on the target for an object the archive holds, but not in the archive.
 * `newer`: statements for objects the archive does not hold at all (a migration applied after
 * the backup was taken), reported apart because they are not a restore fault.
 */
export function compareAcls(archiveSql, targetSql, toc, schemas = GRANT_SCHEMAS) {
  const known = archiveObjects(toc, schemas);
  const isDefaultAcl = (s) => s.startsWith("ALTER DEFAULT PRIVILEGES");
  const inSchemas = (s) =>
    isDefaultAcl(s) ? schemas.some((ns) => s.includes(`IN SCHEMA ${ns} `)) : schemas.some((ns) => aclObject(s).startsWith(`SCHEMA ${ns}`) || aclObject(s).includes(` ${ns}.`));
  const want = new Set(aclStatements(archiveSql).filter(inSchemas));
  const got = new Set(aclStatements(targetSql).filter(inSchemas));
  const missing = [...want].filter((s) => !got.has(s));
  const extraAll = [...got].filter((s) => !want.has(s));
  const ours = (s) => isDefaultAcl(s) || known.has(aclObject(s));
  return {
    matched: [...want].filter((s) => got.has(s)).length,
    missing,
    extra: extraAll.filter(ours),
    newer: extraAll.filter((s) => !ours(s)),
  };
}
