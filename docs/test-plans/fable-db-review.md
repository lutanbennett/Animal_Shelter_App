# Feature test plan — fable-db-review

## Header

| | |
|---|---|
| Feature | Read-only review of the database structure, ending in a report: `docs/database-review-2026-10-13.md` (and a PDF of it on the Desktop) |
| Backlog item | `docs/backlog.md` → **Fable review of the database structure, ending in a report.** (Architecture; ticked with a status note — the walkthrough with Lutan is outstanding) |
| Branch / worktree | `claude/fable-db-review` @ `C:\Development\Animal_Shelter_fable-db-review` |
| Dev server | not started — no UI surface; the brief says none is needed |
| PR | #596 — https://github.com/lutanbennett/Animal_Shelter_App/pull/596 |
| Tested by / date | Claude (Fable 5.1) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `7746e214` (after sync with `origin/main` `a0f8bc5d`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a read-only review of the dev database's catalogue against the 194 migration files, the roles paper and the 2026-09-22 architecture review, written up with a five-minute summary and ranked findings as ready-to-paste backlog items; the item asked for exactly that and for nothing to be changed
- [x] Files/areas touched listed — `docs/database-review-2026-10-13.md` (new), `docs/decisions/2026-10-13-fable-db-review.md` (new), `docs/backlog.md` (one tick plus status note), this plan; a PDF written to `C:\Users\Leidos\OneDrive\Desktop` outside the repo. No `src/`, `worker/`, `scripts/` or `supabase/` file changed
- [x] Roles affected identified — none; no code, policy, grant or schema changed. The review *describes* what each role can read (report §2.1) and changes none of it
- [x] Anything explicitly **out of scope** written down — production was not read or connected to (the brief's rule; report §0 and §6); no statement ran under a login's JWT, so policy behaviour was read, not re-probed; `explain` plans for the forecast functions could not be captured (report §0); the walkthrough of the summary with Lutan is the step after this PR; the review raises no backlog items itself

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `a0f8bc5d` merged in cleanly as `7746e214` (six files from the stream-tooling PR; `docs/backlog.md` auto-merged, the review's tick intact at line 481)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code 0 read directly, output kept in a file; closing lines exactly as printed:

```
=== gates: build exited 0 after 218s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the database was read, never written
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; the applied ledger was read through the catalogue instead (q14: 194 rows, `0001` to `0193`, both `0191`s)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: nothing to apply; dev was only queried
- [ ] File is re-runnable — n/a: no migration file; the report's T3 lists which existing files are not
- [ ] Existing rows still read correctly after the change — n/a: no change; no row was altered
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, and the brief forbade any harness; every statement sent was a `select` or an `explain`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; the report's F1 proposes a rehearsal the cutover item should carry, as a backlog item for Lutan to raise

### What was asked of the dev database, and how

Every statement went through the Management API endpoint `scripts/apply-migrations.mjs` uses
(`POST /v1/projects/<ref>/database/query`) with `read_only: true`, which runs it as
`supabase_read_only_user`, from a runner kept in the session's scratchpad (not the repo) that
refused any project ref other than dev, any statement not beginning `select`, `with`, `explain`,
`show` or `table`, any write keyword outside a string literal, and `set role`. The runner appended
every statement to a log, and the appendix at the end of this plan is generated from that log:
60 distinct statements, 51 of them numbered. Outcomes:

- q01–q41, q49, q50, q51: succeeded. The three statement-statistics queries (q26, q27, q27b)
  appear twice in the appendix: the first form named `pg_stat_statements` unqualified and failed
  with *relation does not exist*; the second named `extensions.pg_stat_statements` and succeeded.
- q42, q43, q44, q46, q48 (`explain analyze` on `diet_forecast`, `medication_forecast`,
  `cashflow_forecast`, `is_public_drive_file`, `resident_who_and_where`): **failed** with
  *permission denied for function* — the read-only role holds no `execute` on app functions,
  which is the intended default privilege. They were not retried under any other role: the one
  alternative was refused by the session's permission guard and the refusal was accepted
  (`docs/decisions/2026-10-13-fable-db-review.md`). q45 and q47 (`explain` on two views)
  succeeded but their plans reduced to an index-only scan of `residents` and are not informative.
- No statement returned personal data that was kept: the catalogue queries return object names,
  the data queries return counts. Nothing was written, and no `begin`, `commit`, `set role` or
  harness ran. Production was not connected to.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; a review document
- [ ] Data persists — n/a: no UI surface; nothing was written
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the brief forbade writes
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a — no policy, grant or code changed; the review read the policies and did not run them |
| management | unchanged | unchanged | n/a — as above |
| staff | unchanged (role archived since `0173`) | unchanged | n/a — as above |
| doctor | unchanged | unchanged | n/a — as above; the report's §2.1 records what the policy text says a clinic login reads |
| volunteer | unchanged | unchanged | n/a — as above |
| signed out | the 14 `public_*` views and 5 functions | unchanged | n/a — as above; the grants catalogue (q05, q16, q33) confirms `anon` holds nothing else |

- [ ] Every role above tested — n/a: nothing changed for any role; the last run of the policies under real logins is the 2026-10-09 dynamic assessment, which the report checks its reading against
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; nothing a user does changed
- [ ] Translatable strings go through the translation path — n/a: no strings added to the app
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed; the `build` gate compiled the app unchanged after the sync
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched; `docs/backlog.md` gained one tick and a status note on the review's own line
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought the stream-tooling PR (`scripts/worktree.mjs`, `CLAUDE.md`, a skill, a decision, a plan, two backlog lines); gates ran after it and passed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — the review's own line (Architecture, line 481), with a status note that the walkthrough with Lutan is outstanding and that which findings become work is his call. **What else the review touched, noted and not ticked**: the backlog was searched for every table, function and theme the report describes. The cutover item (Deployment: *Cut production over to `lannacareforanimals.org`*) is the one the report's F1 bears on — it builds production from the files, and the report recommends a rehearsal; the report is written so that F1 can be pasted under it. The multi-tenancy items (Architecture: *Multi-tenancy build*, *Roles and permissions each shelter configures*, *Per-shelter Drive*) are re-checked in the report's §4 and unchanged. *Rehearse a restore from a production backup*, *Who does what: purchasing job … stock receipts*, *Retention period for what people typed at the assistant*, *Thirteen dev check harnesses still red*, *release-procedure says `--drift dev`*, *Several pack sizes*, *Thai for a resident's breed and colour*, *Senior Staff role*, *Who may read other people's assistant rows* and *One person, more than one role* each name an object the report describes; a review document closes none of them, so none was ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-fable-db-review.md`: read-only role only, dev only, the refused `explain` route accepted rather than escalated, no names by construction, the queries as the plan's evidence, no backlog items raised
- [x] `README.md` still accurate — nothing it describes changed; the report's §1.11 records that README describes the roles correctly and does not describe the tables
- [ ] **Release notes.** — n/a: a review document — no change to the app, nothing a shelter user would see.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every count in the report comes from a statement in the appendix below or from a `grep` over the repo named in the report's §0; the report marks which numbers are measured (`pg_stat_statements`, the catalogue) and which are read from function bodies (the forecast plan shape), and says in §6 what could not be established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; nothing visible changes, so the smoke test is the ordinary one
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code changed; the report *describes* the three UTC-day leftovers (W1) and alters none of them
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates lines above and the SQL appendix below are copied from the tool's output and the runner's own log
- [ ] Public pages re-checked after a cache purge — n/a: the public site is untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: it contains neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — documents only: reverting the merge commit removes the report, the decision file and the backlog tick; there is nothing in the database or the Worker to roll back, and the PDF on the Desktop is outside the repo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none: the review changes no behaviour; what it found about the database is in the report's §2 as proposed backlog items, none raised here | accepted — Lutan picks after the walkthrough |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Walk through the five-minute summary with Lutan: does it read in plain English, and which of the sixteen findings become backlog items | `docs/database-review-2026-10-13.md`, top section, in chat; the PDF on the Desktop is the same text |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the gates, the 60 catalogue statements (outcomes recorded above), the repo greps the report cites, `node scripts/check-test-plan.mjs` on this plan
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Fable 5.1)  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is the walkthrough and waits for Lutan

Manual verification by: pending: the walkthrough of the five-minute summary with Lutan, and his pick of which findings become backlog items

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — as a comment on #596 (this plan without its SQL appendix), 2026-10-13
- [ ] Handed to the production release manager — n/a: nothing to deploy — a review document; the release manager meets it as docs in the next release

Result: pass

Release manager acknowledgement: n/a: nothing ships — the release manager reads this when the next release is cut

---

## Appendix — every statement sent to the dev database

Generated from the scratchpad runner's log; one entry per distinct statement, in label order, SQL
verbatim. All ran as `supabase_read_only_user` through the Management API's `read_only` mode on
project `qxkmhwybjggxvsfxsxbd` on 2026-10-13. Outcomes are listed under §3 above.

#### q01_tables (run 2 times)

```sql
select n.nspname as schema, c.relname as "table", c.relrowsecurity as rls, c.relforcerowsecurity as force_rls, pg_get_userbyid(c.relowner) as owner, c.reltuples::bigint as est_rows, pg_total_relation_size(c.oid) as total_bytes, pg_relation_size(c.oid) as heap_bytes, pg_indexes_size(c.oid) as index_bytes
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind in ('r','p') and n.nspname in ('public','private')
order by n.nspname, c.relname
```

#### q02_views (run 2 times)

```sql
select n.nspname as schema, c.relname as view, pg_get_userbyid(c.relowner) as owner,
 coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker'),'off') as security_invoker,
 has_table_privilege('anon', c.oid,'SELECT') as anon_select, has_table_privilege('authenticated', c.oid,'SELECT') as auth_select,
 (has_table_privilege('authenticated', c.oid,'INSERT') or has_table_privilege('authenticated', c.oid,'UPDATE') or has_table_privilege('authenticated', c.oid,'DELETE')) as auth_write,
 (has_table_privilege('anon', c.oid,'INSERT') or has_table_privilege('anon', c.oid,'UPDATE') or has_table_privilege('anon', c.oid,'DELETE')) as anon_write
from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='v' and n.nspname in ('public','private') order by 1,2
```

#### q03_functions (run 2 times)

```sql
select n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as secdef, pg_get_userbyid(p.proowner) as owner, p.proconfig as config, p.provolatile as vol, l.lanname as lang, p.prorettype::regtype::text as returns,
 has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec, p.prokind as kind
from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where n.nspname in ('public','private') order by 1,2,3
```

#### q04_policies (run 2 times)

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname in ('public','private') order by tablename, policyname
```

#### q05_table_grants (run 2 times)

```sql
select n.nspname as schema, c.relname as rel, c.relkind as kind,
 has_table_privilege('anon', c.oid,'SELECT') as anon_s, has_table_privilege('anon', c.oid,'INSERT') as anon_i, has_table_privilege('anon', c.oid,'UPDATE') as anon_u, has_table_privilege('anon', c.oid,'DELETE') as anon_d,
 has_table_privilege('authenticated', c.oid,'SELECT') as auth_s, has_table_privilege('authenticated', c.oid,'INSERT') as auth_i, has_table_privilege('authenticated', c.oid,'UPDATE') as auth_u, has_table_privilege('authenticated', c.oid,'DELETE') as auth_d
from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','v','m','p') and n.nspname in ('public','private') order by 1,2
```

#### q06_indexes (run 2 times)

```sql
select s.schemaname, s.relname as "table", s.indexrelname as index, s.idx_scan, pg_relation_size(s.indexrelid) as bytes, i.indisunique as uniq, i.indisprimary as pk, pg_get_indexdef(s.indexrelid) as def
from pg_stat_user_indexes s join pg_index i on i.indexrelid=s.indexrelid where s.schemaname in ('public','private') order by s.relname, s.indexrelname
```

#### q07_table_stats (run 2 times)

```sql
select schemaname, relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch, n_live_tup, n_dead_tup, n_tup_ins, n_tup_upd, n_tup_del, last_autovacuum::date as last_av, last_autoanalyze::date as last_aa from pg_stat_user_tables where schemaname in ('public','private') order by relname
```

#### q08_ext

```sql
select extname, extversion, extnamespace::regnamespace::text as schema from pg_extension order by 1
```

#### q08b_version

```sql
select current_setting('server_version') as version, pg_database_size(current_database()) as db_bytes, current_user as who, (select count(*) from pg_stat_activity) as sessions, (select setting from pg_settings where name='shared_preload_libraries') as preload, (select setting from pg_settings where name='pg_stat_statements.track') as pgss_track
```

#### q08c_pgss

```sql
select name, installed_version, default_version from pg_available_extensions where name in ('pg_stat_statements','pg_cron','pgsodium','pgcrypto','pg_net','vector','supabase_vault','pg_graphql') order by 1
```

#### q09_fks (run 2 times)

```sql
select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def from pg_constraint where contype='f' and connamespace in ('public'::regnamespace,'private'::regnamespace) order by 1,2
```

#### q09b_fk_noindex

```sql
select c.conrelid::regclass::text as tbl, c.conname, a.attname, (select reltuples::bigint from pg_class where oid=c.conrelid) as est_rows
from pg_constraint c join lateral unnest(c.conkey) as k(attnum) on true join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum
where c.contype='f' and c.connamespace='public'::regnamespace
and not exists (select 1 from pg_index i where i.indrelid=c.conrelid and i.indkey[0]=k.attnum)
order by 1,2
```

#### q10_columns (run 2 times)

```sql
select c.table_schema as sch, c.table_name, c.ordinal_position as pos, c.column_name, c.udt_name as type, c.is_nullable as nullable, c.column_default as dflt
from information_schema.columns c join pg_tables t on t.tablename=c.table_name and t.schemaname=c.table_schema where c.table_schema in ('public','private') order by c.table_schema, c.table_name, c.ordinal_position
```

#### q11_constraints (run 2 times)

```sql
select conrelid::regclass::text as tbl, contype, conname, pg_get_constraintdef(oid) as def, condeferrable as deferrable from pg_constraint where connamespace in ('public'::regnamespace,'private'::regnamespace) and contype in ('c','u','x','p','t') order by 1,2,3
```

#### q12_triggers (run 2 times)

```sql
select c.relname as tbl, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) as def from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','private') order by 1,2
```

#### q13_enums

```sql
select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by 1 order by 1
```

#### q14_migrations

```sql
select count(*) as applied, min(filename) as first, max(filename) as last, min(applied_at)::date as first_at, max(applied_at) as last_at from public.schema_migrations
```

#### q15_roles

```sql
select rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolinherit, rolcanlogin from pg_roles where rolname in ('postgres','anon','authenticated','service_role','supabase_admin','authenticator','supabase_auth_admin','supabase_storage_admin','dashboard_user','supabase_read_only_user') or rolname like 'app%' or rolname like 'spike%' order by 1
```

#### q16_default_acl

```sql
select pg_get_userbyid(defaclrole) as role, case when defaclnamespace=0 then '(all)' else defaclnamespace::regnamespace::text end as schema, defaclobjtype as objtype, defaclacl::text as acl from pg_default_acl order by 1,2,3
```

#### q17_view_defs (run 2 times)

```sql
select schemaname, viewname, definition from pg_views where schemaname in ('public','private') order by 1,2
```

#### q18_function_defs (run 2 times)

```sql
select n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by 1,2
```

#### q19_sequences

```sql
select sequencename, last_value, data_type from pg_sequences where schemaname='public' order by 1
```

#### q20_schemas

```sql
select n.nspname, pg_get_userbyid(n.nspowner) as owner, has_schema_privilege('anon', n.oid, 'USAGE') as anon_usage, has_schema_privilege('authenticated', n.oid, 'USAGE') as auth_usage from pg_namespace n where n.nspname not like 'pg_%' and n.nspname <> 'information_schema' order by 1
```

#### q21_other_rels

```sql
select c.relkind, n.nspname, c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind not in ('r','v','i','S') order by 1,2,3
```

#### q22_storage

```sql
select id, name, public, file_size_limit, allowed_mime_types, created_at::date as created from storage.buckets order by 1
```

#### q23_schema_migrations_grants

```sql
select has_table_privilege('anon','public.schema_migrations','SELECT') as anon_s, has_table_privilege('authenticated','public.schema_migrations','SELECT') as auth_s, (select count(*) from pg_policies where tablename='schema_migrations') as policies
```

#### q24_auth_counts

```sql
select (select count(*) from auth.users) as users, (select count(*) from public.user_roles) as user_roles, (select count(*) from public.user_roles where archived_at is not null) as archived, (select count(*) from public.roles) as roles, (select count(*) from public.roles where archived_at is not null) as roles_archived, (select count(*) from public.permission_activities) as activities, (select count(*) from public.role_permissions) as cells
```

#### q25_role_keys

```sql
select r.key, r.kind, r.opens_app, r.scope_residents, r.scope_clinical, r.scope_contacts, r.scope_photos, r.sees_login_emails, r.archived_at is not null as archived, (select count(*) from public.user_roles ur where ur.role_id=r.id and ur.archived_at is null) as live_logins, (select count(*) from public.role_permissions rp where rp.role_id=r.id) as cells from public.roles r order by r.key
```

#### q26_pgss_total

```sql
select r.rolname as who, s.calls, round(s.total_exec_time::numeric, 1) as total_ms, round(s.mean_exec_time::numeric, 2) as mean_ms, round(s.max_exec_time::numeric, 1) as max_ms, s.rows, s.shared_blks_hit, s.shared_blks_read, left(regexp_replace(s.query, '\s+', ' ', 'g'), 400) as query
from pg_stat_statements s join pg_roles r on r.oid = s.userid
where s.dbid = (select oid from pg_database where datname = current_database())
order by s.total_exec_time desc limit 40
```

#### q26_pgss_total

```sql
select r.rolname as who, s.calls, round(s.total_exec_time::numeric, 1) as total_ms, round(s.mean_exec_time::numeric, 2) as mean_ms, round(s.max_exec_time::numeric, 1) as max_ms, s.rows, s.shared_blks_hit, s.shared_blks_read, left(regexp_replace(s.query, '\s+', ' ', 'g'), 300) as query
from extensions.pg_stat_statements s join pg_roles r on r.oid = s.userid
where s.dbid = (select oid from pg_database where datname = current_database())
order by s.total_exec_time desc limit 40
```

#### q27_pgss_mean

```sql
select r.rolname as who, s.calls, round(s.total_exec_time::numeric, 1) as total_ms, round(s.mean_exec_time::numeric, 2) as mean_ms, round(s.max_exec_time::numeric, 1) as max_ms, s.rows, left(regexp_replace(s.query, '\s+', ' ', 'g'), 400) as query
from pg_stat_statements s join pg_roles r on r.oid = s.userid
where s.dbid = (select oid from pg_database where datname = current_database()) and s.calls >= 20
order by s.mean_exec_time desc limit 40
```

#### q27_pgss_mean

```sql
select r.rolname as who, s.calls, round(s.total_exec_time::numeric, 1) as total_ms, round(s.mean_exec_time::numeric, 2) as mean_ms, round(s.max_exec_time::numeric, 1) as max_ms, s.rows, left(regexp_replace(s.query, '\s+', ' ', 'g'), 300) as query
from extensions.pg_stat_statements s join pg_roles r on r.oid = s.userid
where s.dbid = (select oid from pg_database where datname = current_database()) and s.calls >= 20
order by s.mean_exec_time desc limit 40
```

#### q27b_pgss_meta

```sql
select count(*) as statements, sum(calls) as calls, round(sum(total_exec_time)::numeric/1000,1) as total_s, (select stats_reset from pg_stat_statements_info) as stats_reset from pg_stat_statements where dbid = (select oid from pg_database where datname = current_database())
```

#### q27b_pgss_meta

```sql
select count(*) as statements, sum(calls) as calls, round(sum(total_exec_time)::numeric/1000,1) as total_s, (select stats_reset from extensions.pg_stat_statements_info) as stats_reset from extensions.pg_stat_statements where dbid = (select oid from pg_database where datname = current_database())
```

#### q27c_pgss_by_role

```sql
select r.rolname as who, count(*) as statements, sum(s.calls) as calls, round(sum(s.total_exec_time)::numeric/1000,1) as total_s from extensions.pg_stat_statements s join pg_roles r on r.oid = s.userid where s.dbid = (select oid from pg_database where datname = current_database()) group by 1 order by 4 desc
```

#### q27d_pgss_app_reads

```sql
select r.rolname as who, s.calls, round(s.total_exec_time::numeric, 1) as total_ms, round(s.mean_exec_time::numeric, 2) as mean_ms, s.rows, left(regexp_replace(s.query, '\s+', ' ', 'g'), 300) as query
from extensions.pg_stat_statements s join pg_roles r on r.oid = s.userid
where s.dbid = (select oid from pg_database where datname = current_database()) and r.rolname in ('authenticator','authenticated','anon','service_role') and s.query ilike 'select%'
order by s.total_exec_time desc limit 40
```

#### q28_unused_indexes

```sql
select s.relname as "table", s.indexrelname as index, s.idx_scan, pg_relation_size(s.indexrelid) as bytes, pg_get_indexdef(s.indexrelid) as def
from pg_stat_user_indexes s join pg_index i on i.indexrelid = s.indexrelid
where s.schemaname = 'public' and s.idx_scan = 0 and not i.indisunique and not i.indisprimary
order by s.relname, s.indexrelname
```

#### q29_dup_indexes

```sql
select a.indrelid::regclass::text as "table", a.indexrelid::regclass::text as idx_a, b.indexrelid::regclass::text as idx_b, pg_get_indexdef(a.indexrelid) as def_a, pg_get_indexdef(b.indexrelid) as def_b
from pg_index a join pg_index b on a.indrelid = b.indrelid and a.indexrelid < b.indexrelid and a.indkey::text = b.indkey::text
 and coalesce(pg_get_expr(a.indpred, a.indrelid),'') = coalesce(pg_get_expr(b.indpred, b.indrelid),'')
 and coalesce(pg_get_expr(a.indexprs, a.indrelid),'') = coalesce(pg_get_expr(b.indexprs, b.indrelid),'')
join pg_class c on c.oid = a.indrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' order by 1
```

#### q30_sizes

```sql
select c.relname, pg_size_pretty(pg_total_relation_size(c.oid)) as total, pg_size_pretty(pg_relation_size(c.oid)) as heap, pg_size_pretty(pg_indexes_size(c.oid)) as idx, c.reltuples::bigint as est_rows, (select count(*) from pg_index i where i.indrelid = c.oid) as n_indexes
from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and n.nspname in ('public','private') order by pg_total_relation_size(c.oid) desc limit 25
```

#### q31_policy_counts

```sql
select tablename, count(*) as policies, count(*) filter (where permissive = 'PERMISSIVE') as permissive, count(*) filter (where permissive = 'RESTRICTIVE') as restrictive, count(*) filter (where qual ilike '%has_permission%' or with_check ilike '%has_permission%') as uses_cell, count(*) filter (where (qual ilike '%has_permission(%' and qual not ilike '%( SELECT has_permission(%' and qual not ilike '%(select has_permission(%') or (with_check ilike '%has_permission(%' and with_check not ilike '%( SELECT has_permission(%' and with_check not ilike '%(select has_permission(%')) as bare_cell_call
from pg_policies where schemaname = 'public' group by tablename order by tablename
```

#### q32_tables_without_policies

```sql
select c.relname, c.relrowsecurity as rls, (select count(*) from pg_policies p where p.schemaname = n.nspname and p.tablename = c.relname) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and n.nspname = 'public' and (not c.relrowsecurity or (select count(*) from pg_policies p where p.schemaname = n.nspname and p.tablename = c.relname) = 0) order by 1
```

#### q33_roles_rls_bypass_views

```sql
select c.relname as view, coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker'),'off') as invoker, has_table_privilege('authenticated', c.oid, 'SELECT') as auth, has_table_privilege('anon', c.oid, 'SELECT') as anon
from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'v' and n.nspname = 'public' order by 2, 1
```

#### q34_text_date_columns

```sql
select table_name, column_name, udt_name from information_schema.columns where table_schema = 'public' and (udt_name in ('date','timestamp') or (udt_name = 'numeric' and numeric_precision is null) or (udt_name = 'float8') or (udt_name='text' and column_name ~ '(_date|_at|_on)$')) and table_name in (select tablename from pg_tables where schemaname='public') order by udt_name, table_name, column_name
```

#### q35_null_fraction_hints

```sql
select s.tablename, s.attname, s.null_frac, s.n_distinct from pg_stats s where s.schemaname = 'public' and s.null_frac = 1 and s.tablename in (select tablename from pg_tables where schemaname='public') order by 1,2
```

#### q36_audit_log_shape

```sql
select table_name, op, count(*) as rows, min(at)::date as first, max(at)::date as last from public.audit_log group by 1,2 order by 1,2
```

#### q37_audit_log_size

```sql
select pg_size_pretty(pg_total_relation_size('public.audit_log')) as total, (select count(*) from public.audit_log) as rows, (select count(*) from public.audit_log where actor is null) as no_actor, (select pg_size_pretty(avg(pg_column_size(old_row)+pg_column_size(new_row))::bigint) from public.audit_log) as avg_row_images
```

#### q38_translations_shape

```sql
select table_name, status, count(*) from public.translations group by 1,2 order by 1,2
```

#### q39_row_counts

```sql
select 'residents' t, count(*) from public.residents union all select 'placement_history', count(*) from public.placement_history union all select 'attachments', count(*) from public.attachments union all select 'prescriptions', count(*) from public.prescriptions union all select 'immunization_records', count(*) from public.immunization_records union all select 'weight', count(*) from public.weight union all select 'clinic_visits', count(*) from public.clinic_visits union all select 'contacts', count(*) from public.contacts union all select 'maintenance', count(*) from public.maintenance union all select 'stock_counts', count(*) from public.stock_counts union all select 'stock_receipts', count(*) from public.stock_receipts union all select 'translations', count(*) from public.translations union all select 'audit_log', count(*) from public.audit_log union all select 'status_alert_runs', count(*) from public.status_alert_runs union all select 'assistant_actions', count(*) from public.assistant_actions union all select 'enclosures', count(*) from public.enclosures union all select 'zones', count(*) from public.zones order by 2 desc
```

#### q40_seq_vs_rows

```sql
select (select count(*) from public.residents) as residents, (select last_value from public.residents_resident_number_seq) as resident_seq, (select max(substr(resident_code,3)::int) from public.residents where resident_code ~ '^R-[0-9]+$') as max_code, (select count(*) from public.maintenance) as jobs, (select last_value from public.maintenance_job_number_seq) as job_seq
```

#### q41_orphan_checks

```sql
select 'attachments resident owner missing' as what, count(*) from public.attachments a where a.owner_type = 'resident' and not exists (select 1 from public.residents r where r.id = a.owner_id)
union all select 'attachments project owner missing', count(*) from public.attachments a where a.owner_type = 'project' and not exists (select 1 from public.project_folders f where f.id = a.owner_id)
union all select 'attachments maintenance owner missing', count(*) from public.attachments a where a.owner_type = 'maintenance' and not exists (select 1 from public.maintenance m where m.id = a.owner_id)
union all select 'attachments blood_test owner missing', count(*) from public.attachments a where a.owner_type = 'blood_test' and not exists (select 1 from public.blood_tests b where b.id = a.owner_id)
union all select 'attachments procedure owner missing', count(*) from public.attachments a where a.owner_type = 'procedure' and not exists (select 1 from public.procedures p where p.id = a.owner_id)
union all select 'translations row missing (residents)', count(*) from public.translations t where t.table_name = 'residents' and not exists (select 1 from public.residents r where r.id = t.row_id)
union all select 'residents with no placement', count(*) from public.residents r where not exists (select 1 from public.placement_history p where p.resident_id = r.id)
union all select 'residents with no open placement', count(*) from public.residents r where not exists (select 1 from public.placement_history p where p.resident_id = r.id and p.end_date is null)
union all select 'profile photo not in attachments', count(*) from public.residents r where r.profile_photo_drive_file_id is not null and not exists (select 1 from public.attachments a where a.owner_type='resident' and a.owner_id=r.id and a.drive_file_id=r.profile_photo_drive_file_id)
union all select 'user_roles without auth user', count(*) from public.user_roles ur where not exists (select 1 from auth.users u where u.id = ur.user_id)
union all select 'auth users without user_roles', count(*) from auth.users u where not exists (select 1 from public.user_roles ur where ur.user_id = u.id)
```

#### q42_explain_diet_forecast

```sql
explain (analyze, buffers, costs off, summary) select * from public.diet_forecast(public.shelter_today(), public.shelter_today() + 90)
```

#### q43_explain_medication_forecast

```sql
explain (analyze, buffers, costs off, summary) select * from public.medication_forecast(public.shelter_today(), public.shelter_today() + 90)
```

#### q44_explain_cashflow_forecast

```sql
explain (analyze, buffers, costs off, summary) select * from public.cashflow_forecast(public.shelter_today(), public.shelter_today() + 90)
```

#### q45_explain_resident_list_view

```sql
explain (analyze, buffers, costs off, summary) select resident_id from public.resident_list_view
```

#### q46_explain_is_public_drive_file

```sql
explain (analyze, buffers, costs off, summary) select public.is_public_drive_file('invented-file-id-for-the-review')
```

#### q47_explain_public_resident_cards

```sql
explain (analyze, buffers, costs off, summary) select 1 from public.public_resident_cards
```

#### q48_explain_resident_who_and_where

```sql
explain (analyze, buffers, costs off, summary) select 1 from public.resident_who_and_where
```

#### q49_function_volatility

```sql
select p.proname, p.provolatile, p.prosecdef, l.lanname, p.prorows, p.procost from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_language l on l.oid = p.prolang where n.nspname = 'public' and p.proname in ('diet_forecast','medication_forecast','cashflow_forecast','stock_diet_forecast','stock_medication_forecast','is_public_drive_file','has_permission','my_permissions','current_user_role','shelter_today','shelter_time_zone','sees_all_residents','sees_all_clinical','current_doctor_resident_ids','current_clinic_resident_ids','immunization_due_dates','prescription_doses_between') order by 1
```

#### q50_fn_acl

```sql
select p.proname, p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('immunization_due_dates','immunization_next_due_dates','prescription_doses_between','diet_forecast','cashflow_forecast','is_known_drive_file','can_see_drive_file')
```

#### q51_numeric_precision

```sql
select table_name, column_name, numeric_precision, numeric_scale, is_nullable, column_default from information_schema.columns where table_schema = 'public' and data_type = 'numeric' order by 1, 2
```

