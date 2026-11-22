# The tenancy canary may run against production, behind one typed flag — after checking nothing a planted row sets off survives a rollback

**2026-11-22. Backlog `#cnypd` (the last blocker of `#ykefa`).** Lutan chose, 2026-11-22, to make production opt-in
rather than close `#ykefa` on the UAT run (`2026-11-22-tenancy-canary-not-run-on-production.md`). That decision
named one question to settle first. This file settles it, then records the flag.

## The question

The canary plants a second shelter's rows (`shelters`, `residents`, `attachments`) inside one transaction that
always ends in `raise exception`. A rollback is total **inside** Postgres. What it cannot undo is a side effect that
**leaves** the database: mail or a webhook sent by a trigger, a `pg_net` request, a `NOTIFY` something acts on,
or anything consumed that is not transactional (a sequence). **If anything did, a flag would be the wrong answer.**

## What was measured, and how

Not by reading migration files, which say what we deploy and not what is live. A new named check,
`canary-planted-triggers` (`scripts/lib/readonly-checks.mjs`, run with
`node scripts/check-production.mjs --env <env> canary-planted-triggers`), reads the **live** catalogue: every
non-internal trigger on `shelters`, `residents` and `attachments`, the function each calls, and whether that function's
body (or a public function whose name it contains, one level) matches `pg_net`, `net.http`, `http_post/get/request`,
`pg_notify`, `notify`, `dblink`, `pg_background`, `supabase_functions`, `lo_export` or `to program`. It also lists
the installed extensions that could send anything out. It runs inside `begin read only`, so it cannot write.

**Proved able to go red** (dev, one rolled-back transaction, nothing left behind): a trigger on `attachments` calling a
function that calls a function that calls `pg_notify` was reported `REACHES OUT via zz_canary_prove_red` and
`failed()` returned true; afterwards no `zz_` object existed. A first draft of the check lost two backslashes in the
pattern (`\m`, `\M` and `net\.http` became plain letters) and would have reported "nothing" for everything; that is why
`scripts/check-production.test.mjs` now asserts the escapes are present in the SQL.

| Environment | Triggers on the planted tables | Reaches outside the database | Outbound extensions | Event triggers |
|---|---|---|---|---|
| dev (`--env test`, `qxkmhwybjggxvsfxsxbd`) | 13 (7 on `attachments`, 6 on `residents`, none on `shelters`) | **0** | none | 6 (DDL only; they cannot fire on a row insert) |
| UAT (`--env uat`, `fsjagxmxjosauwmxwype`) | the same 13 | **0** | none | 6 |
| production | **not read here** | **not read here** | **not read here** | **not read here** |

The 13 triggers are stamps, locks and guards, the audit writer (`record_audit`), `queue_translations` /
`drop_translations`, `record_label_sources` and `shares_cleanup`. Each writes only to other tables; the translation
queue and the audit log are tables, so their rows roll back with the rest and the Worker, which reads committed rows,
never sees them.

**Correction to the brief's sweep:** it read *"no trigger on `attachments` at all"* and *"exactly one on `residents`"*.
That was wrong: there are seven and six. None of the extra ones reaches out, so the conclusion survives, but it is
the live read, not the migration grep, that shows it.

**Sequences are not transactional, so one was checked directly.** `residents.resident_code` defaults to
`nextval('residents_resident_number_seq')`. The canary supplies every column of the planted row (through
`jsonb_populate_record`), so the default should never fire. Measured on dev and on UAT: the sequence's `last_value`
before a full `--untrusted --strict` canary run and after it was identical (dev 9499 / 9499, UAT 454 / 454). No resident
number is burnt. No other default on the three tables calls `nextval`, `http` or `notify`.

**Realtime and replication:** logical decoding emits a transaction only when it commits, and this one always aborts, so
nothing is published to a subscriber. This is reasoning from how Postgres works, not a measurement.

## What could not be read, and who can

**Production's own catalogue.** A worktree must not read production. The check is built so the planner or Lutan can
answer it in one command from the main checkout, bare: `node scripts/check-production.mjs canary-planted-triggers`.
Production and UAT were both `435 applied, 0 pending, no drift` on 2026-11-22, so the schema should match, but "should
match" is not a reading. **The flag below does not remove that step: read the check on production first; a red there
means do not run the canary and re-open `#cnypd`.**

## Conclusion, in checkable terms

On dev and UAT, which share production's schema: **0 triggers on `shelters`/`residents`/`attachments` reach outside
the database, 0 outbound extensions, and the resident-number sequence does not move.** So nothing a planted row sets off
survives the rollback **there**, and the premise that blocked the item did not hold. What remains is two hands-on facts
that are not a flaw: it takes brief row locks and writes (then discards) WAL on the production database, and it needs a
Management API token that can write.

## The flag

`--i-understand-this-plants-rows-in-production`, typed in full (it cannot be passed by accident, and it has no
short form). On `--env production` the canary now refuses unless **all** of these hold, each with its own message:

1. that flag is present (the old refusal, reworded to name it instead of saying "never");
2. `--untrusted` is present too (a trusted run on production proves nothing about the path PostgREST uses and plants for nothing);
3. no `--prove-red` (sabotage has no business in production, even rolled back);
4. it is not running in CI (`GITHUB_ACTIONS` unset): this repository is public and the token this needs can write.

Every other limit is unchanged. **The guard was not deleted or weakened:** without the flag production is still refused,
and the nightly workflow neither passes the flag nor can (4). Run bare from the main checkout, the production run is
`node scripts/check-tenancy-canary.mjs --env production --untrusted --strict --i-understand-this-plants-rows-in-production`;
**it is Lutan's, with a write-capable token, and nobody should read the plain (trusted) pass on production as a pass.**
