# 2026-11-14: the two holes the re-own left (`#h8rvk`)

**Decided by Claude, stream `tenancy-lint-holes`, no migration.** Both halves closed.

## 1. Where the new rule lives: in `check-tenancy-catalogue.mjs`, as rule 3

Policies live in `pg_policy`, which PostgREST does not expose, so reading them needs the Management API, exactly as the ownership
rules do. A separate check could not run in CI either, so a second script would only duplicate the plumbing. Rule 3 is in
`scripts/lib/tenancy-catalogue.mjs` (`TABLES_SQL`, pure `lintCatalogue` taking `tables`), and reuses the allow-list-by-name mechanism
(`table:public.<name>` keys; a vanished entry is STALE).

## 2. What counts: the WIDE rule

Every `public` table with RLS on must carry a policy named `definer_all`. Not only tables a view reads today: the next view over a
table is the thing nobody has written yet, and the wide rule cost nothing, see the measurement. The script prints
`Rule 3 (wide): N of M public tables have RLS on` so its output says which rule it applied.

## 3. Report-only or blocking: unchanged, same flag

Measured on dev (the test project `qxkmhwybjggxvsfxsxbd`), 2026-11-14: **120 of 120 public tables have RLS on, 120 carry `definer_all`,
0 flagged: a false-positive rate of 0 on today's tree.** It inherits the script's existing mode: report-only (exit 0) by default,
`--strict` exits 1. Takes about 3 seconds. The release procedure runs `--strict`.

## 4. Proof it fires (rollback harness, dev)

Through the Management API, one `do $$ … $$` block created `public.zz_plant_bad` (RLS on, no policy) and `public.zz_plant_ok` (RLS on,
`definer_all` created), ran `TABLES_SQL` over them and ended in `raise exception`. Result: `zz_plant_bad:true:false,zz_plant_ok:true:true`,
that is the planted table reads `hasDefinerAll=false` (flagged by the rule) and the negative control `true` (clean). The exception rolled
everything back: the lint run straight afterwards again read 0 flagged and 120 tables. **Nothing persisted.** Two further unit tests
(`scripts/check-tenancy-catalogue.test.mjs`, 7 pass) cover the flag, the negative control, a table without RLS, and allow-list/STALE
without a database.

## 5. Hole (b): CI, or the release procedure

**CI cannot carry it without `SUPABASE_ACCESS_TOKEN`, and this item does not add one.** (If the planner decides CI is the better home, that
is a decision about a secret; nothing here prevents it.) The strict run now has a named home: `docs/release-procedure.md` section 5, right
after the schema-assert paragraph, because that is where the release manager has just applied migrations and is already running
catalogue-reading commands. The paragraph gives both commands and what to do for exit 1 and exit 2.

## Not done, on purpose

`login_display_name` and `label_translations` hand-written tenant filters stay with `#ykefa`'s build half. No migration; no secret.
