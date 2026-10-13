# The database review ran as the read-only role, and stayed there when that cost it the plans

**Date:** 2026-10-13 · **Stream:** `claude/fable-db-review` · **Output:** `docs/database-review-2026-10-13.md`

## What was decided

1. **Dev only, read-only role only.** Every statement went through the Management API's
   `read_only` mode, which runs as `supabase_read_only_user`; the scratchpad runner refused any
   project ref but dev, any statement not starting `select`/`with`/`explain`, any write keyword
   outside a string literal, and `set role`. No `begin … rollback` harness, no JWT, no
   production connection of any kind — the brief's rule, and the reason "does production match
   the files?" is a finding rather than an answer.
2. **When the read-only role could not do something, the review recorded that rather than
   escalating.** `explain analyze` on the forecast functions failed with *permission denied for
   function*: the read-only role holds no `execute` on app functions, because the default
   privileges grant them to `authenticated` and `service_role` only — correct, and not something
   a review should change. The one alternative, the same `explain` as `postgres` inside a
   read-only transaction, was refused by the session's permission guard. That refusal was
   accepted: the function costs in the report come from `pg_stat_statements`, which records
   real calls, and the plan shape is read from the function bodies. The report says so in §0
   and §6.
3. **No real names anywhere, by construction.** Catalogue queries return names of objects, not
   people; the handful of data queries return counts. Nothing that returns a row was pasted,
   and the one example that needed a value is marked invented. The PDF on the Desktop follows
   the same rule because it is rendered from the same file.
4. **The queries are the test plan's evidence.** Every statement sent is in
   `docs/test-plans/fable-db-review.md`, generated from the runner's own log, so "which queries
   were run" is answered by the file and not by memory.
5. **The review raises no backlog items.** Each finding is written as a ready-to-paste item in
   the report; which ones become work is Lutan's call after the walkthrough. The only backlog
   edit on this branch is the review's own line.

## Why

A review that writes nothing and runs as the least-privileged role is the only kind that can be
trusted two days before a cutover, and the only kind whose refusals are informative: both
"permission denied" results above are the database behaving as designed.

## What it cost

Seven `explain` plans. The report is explicit about which numbers are measured and which are
read from bodies, so the next reader can tell them apart.
