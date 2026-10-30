// Hard-coded security is forbidden (Lutan, 2026-10-24): "A role is a placeholder that gets no permissions until a card
// is assigned ... there are to be zero exceptions to this rule."
//
//   node scripts/check-no-role-column-security.mjs [--env test|production]
//
// This is the DATABASE half of that rule. scripts/check-hard-coded-security.mjs ratchets the known debt in src/ and
// CANNOT see the database at all -- it counts lines in src/**/*.ts(x). Migration 0259 removed the last clauses in the
// database that read a column on `roles`, and this is what stops them coming back, because nothing else would notice.
//
// WHY IT EXISTS AT ALL: the brief for 0259 listed eleven functions. Reading the LIVE definitions found four more --
// holds_app_role() had already moved from roles.opens_app to `r.key <> 'public_viewer'`, and my_permissions(),
// photos_medical_only() and reassign_recurring_job() were never on the list. A grep for `create or replace` misses that
// (0224 rewrote guards in place by text replacement), so this asks the database what it actually holds.
//
// It also asserts what must NOT change: the Admin short-circuit. Admin sits OUTSIDE the card system and holds no cards,
// so removing `r.key = 'admin'` from has_permission() or holds_app_role() would lock the only administrator out of
// Settings -> Who does what, which is the screen needed to give Admin cards again. A one-way door (CLAUDE.md).
//
// Comments are stripped before matching, exactly as check-hard-coded-security.mjs does for src/: the ratchet counts
// CODE. An SQL comment recording that a column USED to be read is history, not a rule.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const ref = projectRef(env);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error("check-no-role-column-security: need the project and SUPABASE_ACCESS_TOKEN. Nothing was read.");
  process.exit(2);
}

const COLUMNS = "scope_residents|scope_clinical|scope_contacts|scope_photos|opens_app|sees_login_emails";

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}

console.log(`Read-only check on ${envName} (${ref}).\n`);

// 1. Nothing that grants or denies may read a role column.
const strip = (expr) => `regexp_replace(${expr}, '--[^\\n]*', '', 'g')`;
const offenders = await query(`
  select 'function' as kind, n.nspname||'.'||p.proname as name
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public','private') and p.prokind = 'f'
     and ${strip("pg_get_functiondef(p.oid)")} ~ '(${COLUMNS})'
  union all
  select 'view', c.relnamespace::regnamespace||'.'||c.relname
    from pg_class c
   where c.relkind in ('v','m') and c.relnamespace::regnamespace::text in ('public','private')
     and ${strip("pg_get_viewdef(c.oid)")} ~ '(${COLUMNS})'
  union all
  select 'policy', schemaname||'.'||tablename||' :: '||policyname
    from pg_policies
   where ${strip("coalesce(qual,'')||' '||coalesce(with_check,'')")} ~ '(${COLUMNS})'
  order by 1, 2
`);

let failed = 0;
if (offenders.length) {
  failed++;
  console.log(`FAIL ${offenders.length} database object(s) still decide access from a column on \`roles\`:`);
  for (const o of offenders) console.log(`  ${o.kind.padEnd(9)} ${o.name}`);
  console.log(
    "\n  A role is exactly the set of cards it holds. Delete the role-column clause; what remains is the card check\n" +
      "  beside it (has_permission() against card_grants). Do NOT swap the column for a different card requirement --\n" +
      "  a card applies access, it is not a requirement list checked against the role. Where removing the clause leaves\n" +
      "  a role unable to do something, that is the intended outcome: record it in docs/card-access-faults.md.",
  );
} else {
  console.log("ok   no function, view or policy reads a role column to grant or deny anything.");
}

// 2. The Admin short-circuit must still be there. Admin holds no cards, so this is its only access.
const [{ has_permission_admin, holds_app_role_admin, admin_cells }] = await query(`
  select
    pg_get_functiondef('public.has_permission(text,text)'::regprocedure) like '%r.is_admin%' as has_permission_admin,
    pg_get_functiondef('public.holds_app_role()'::regprocedure)          like '%r.is_admin%' as holds_app_role_admin,
    (select count(*) from public.role_permissions rp
       join public.roles r on r.id = rp.role_id where r.is_admin)                                 as admin_cells
`);

for (const [ok, what] of [
  [has_permission_admin, "has_permission() no longer short-circuits on admin"],
  [holds_app_role_admin, "holds_app_role() no longer lets Admin in"],
]) {
  if (!ok) {
    failed++;
    console.log(
      `FAIL ${what}. Admin sits OUTSIDE the card system and holds no cards, so this locks the only administrator\n` +
        "  out of Settings -> Who does what -- the screen needed to give Admin cards again. See CLAUDE.md; settled.",
    );
  }
}
if (!failed) console.log("ok   Admin still reaches everything without holding a card.");

// 3. Admin must never be given cards. "Admin holds every card" silently fails the day a card is added.
if (Number(admin_cells) !== 0) {
  failed++;
  console.log(
    `FAIL Admin has been given ${admin_cells} permission cell(s). Admin is NEVER given cards: the short-circuit must\n` +
      "  answer before any cell is read, which is what \"no matter what cards exist\" requires (CLAUDE.md).",
  );
} else {
  console.log("ok   Admin holds no cards and no cells, as it must.");
}

await exitWith(failed ? 1 : 0);
