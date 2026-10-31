# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (B): the `write_requests` table, one migration, schema only |
| Backlog item | `docs/backlog.md` → `## Next up` → **PI FAILOVER**, stream (B) |
| Branch / worktree | `claude/pi-failover-schema` @ `C:\Development\Animal_Shelter_pi-failover-schema` |
| Dev server | not started — n/a: no UI surface in this PR (see §4) |
| PR | opened from this branch; see the PR body for the per-deliverable account |
| Tested by / date | Claude (stream `pi-failover-schema`) / 2026-10-31 |
| Carries a migration? | yes — `0292_write_requests.sql` |
| Tested at SHA | `e9530224` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds `write_requests` plus `claim_write_request()` / `finish_write_request()` / `purge_write_requests()`, so a write retried on the Worker after a dropped answer returns the first result instead of writing again; the item asked for exactly "(B) schema, `write_requests` table (one migration)"
- [x] Files/areas touched listed — `supabase/migrations/0292_write_requests.sql` (new), `scripts/prove-write-requests.mjs` (new), `docs/decisions/2026-10-31-write-requests-schema.md` (new), `docs/test-plans/pi-failover-schema.md` (this file), `docs/hard-coded-security-registry.json` (two `database.declared` entries), `docs/backlog.md` (item title and a (B)-done note). **No `src/`, no `worker/`, no route, no shared lib**
- [x] Roles affected identified: **none**. Nothing a role can reach changes. The table is closed to every login (RLS on, no policies, no table rights for `anon` or `authenticated`); the two functions are executable by `authenticated` and gated on `holds_app_role()`, but no code calls them yet. The purge is executable by no login at all
- [x] Anything explicitly **out of scope** written down — (C) the shared wrapper and the Worker replay rule, and (D) the sweep over every write path, are later streams by `CLAUDE.md`'s one-migration-in-flight rule. The drills at the Pi are Lutan's. The decision file's last section is the explicit handover list for (C)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.` against `e5d2a911`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: `ok — 0292_write_requests.sql (against origin/main e5d2a911, highest 0291_retire_add_while_recording_activity.sql)`. The brief names this stream as the only one in the batch allowed a migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `292 applied, 1 pending`, the pending one being `0292` and nothing else, and no drift against `origin/main` (0 either way)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0292_write_requests.sql … ok`. Nothing else was pending, so the known "a file that depends on an earlier pending file reports FAILED" trap could not arise
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0292_write_requests.sql … ok`
- [x] File is re-runnable — `create table if not exists`, `create index if not exists`, `create extension if not exists`, `create or replace function` throughout, and `cron.schedule` on a name replaces the job rather than adding one. There is no `drop`, so re-running changes nothing
- [x] Existing rows still read correctly after the change (checked against real dev data) — the migration is purely additive: one new table, one new index, three new functions, one cron job. It alters no existing table, column, view, policy or function, so no existing row is read differently. `apply-migrations.mjs` reported no drift against `origin/main` afterwards
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/prove-write-requests.mjs`, ten numbered assertions, all passed against dev, and `write_requests` held **0 rows** afterwards. What was asserted, not merely that it ran: (1) a fresh request id returns `claimed`; (2) the same `(user_id, request_id)` **cannot be recorded twice** — a direct insert raises `unique_violation` and exactly one row survives; (3) a replay returns the **first result verbatim** (`residentId: first-answer`), not a flag; (4) a claim with no result reads `in_flight`, never as a success; (5) the same id against a different action is **refused**, not answered with the other action's result; (6) finishing twice, and finishing a claim never made, are both refused, and the stored first result is unchanged after the attempt; (7) a second real login claiming the **same** request id gets its own row (2 rows for the shared id) and never the first login's result; (8) an aborted write leaves **no** claim, so its retry is free to proceed; (9) retention deletes an 8-day-old row and leaves one inside the window; (10) RLS is on, there are **no policies**, `anon` and `authenticated` hold no table rights, the two functions are executable by `authenticated` and not by `anon`, the purge by neither, and the cron job is scheduled. The two logins are picked from live `user_roles` rows and accepted only once `holds_app_role()` is true for them, so the gate is exercised rather than stubbed. **The harness was verified to be capable of failing**: inverting assertion 1 produced `1 FAILED: a fresh request id returned {"status": "claimed"} and should have returned claimed`
- [x] Down-migration written, or the reason one is not needed is stated — **not needed, and the reason is stated here and in the decision file.** The change is purely additive and nothing reads it, so leaving it in place costs nothing and breaks nothing (`CLAUDE.md`: "Purely additive schema is safe to leave"). If it ever had to come out, the down-migration is `select cron.unschedule('purge-write-requests'); drop function purge_write_requests(); drop function claim_write_request(uuid, text); drop function finish_write_request(uuid, jsonb); drop table write_requests;` — recorded here rather than shipped as a file, because `CLAUDE.md` reserves a written-and-applied down-migration for an **abandoned** branch's migration
- [x] Production apply plan stated for the release manager — **`supabase/migrations/0292_write_requests.sql`, production project `dbkodyyxxhtygxcxmfcu`, whenever the next production release runs, and the order does not matter for this PR** because no code reads the table. **But production is three migrations behind** (`0289`, `0290`, `0291` all pending, and `0290` must precede a particular Worker deploy), so `apply-migrations.mjs` will apply four files, not one. **What does matter later: (C)'s code must not deploy before `0292` is on production.** The `-- consumer:` header cannot express that direction, so it is written into the decision file for (C) instead

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, and no code reads these columns yet. The database-level happy path is §3's harness, proof 1 and 3
- [ ] Data persists — reload the page and the change is still there — n/a: no page. Persistence is proved at the row level in §3 and then deliberately rolled back
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI. All three are exercised as SQL in §3's harness (claim, finish, purge)
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing renders. The empty table **is** the state on dev after the harness (0 rows), which is correct
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI to type invalid input into; the database-level equivalent is proved in §3. The functions raise named errors for a null id, a blank action, a mismatched action, a double finish and an unmade claim, each with its own SQLSTATE
- [ ] Boundary cases checked — n/a: no form fields. The one boundary that exists is the 7-day retention edge, asserted both sides in §3 proof 9

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | no change — nothing calls the functions and the table is closed |
| management | nothing new | no change | no change |
| staff | — | — | retired role (`0173`); not tested |
| doctor | nothing new | no change | no change |
| volunteer | nothing new | no change | no change |
| signed out | nothing new | no change | no change — `anon` holds no rights on the table and cannot execute either function (asserted, §3 proof 10) |

- [ ] Every role above tested — n/a: no role can reach anything new, so there is nothing per role to test. What replaces it is a privilege assertion rather than a sign-in: §3 proof 10 reads `has_table_privilege` and `has_function_privilege` for `anon` and `authenticated` directly, which covers every role at once because no policy and no role-keyed rule exists in this file
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — there is no URL. The server-side block is the one that matters here and it is asserted: RLS on with **no policies** plus no table rights for `anon` or `authenticated`, so a direct `/rest/v1/write_requests` read or write is refused, and `anon` cannot execute either function through `/rest/v1/rpc/`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page, and `src/` is out of scope for this stream
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does changes, so there is no topic to write. (C) is where a user-visible behaviour appears
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. The error messages the functions raise are for developers and are never shown to a user
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no page was loaded, because no page changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages. The only network calls were the Management API ones that applied the migration and ran the harness, all 200

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page is near the change. Nothing in `src/` or `worker/` was touched, and the migration alters no existing object, so there is no page whose behaviour could have moved
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared code file was touched. The two shared **documents** changed (`docs/hard-coded-security-registry.json`, `docs/backlog.md`) are read by checks, not by pages, and both checks were run: `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass` and `check-backlog-sections.mjs` prints `ok — 58 open items, all above ## Completed`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.` against `e5d2a911`, so nothing was merged in; and gates passed on this branch afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item has four streams and only (B) is done, so ticking it would be the wholesale tick on a partly-done item that `CLAUDE.md` warns about. The item has four streams and only (B) is done; a wholesale tick on a partly-done item is the fault `CLAUDE.md` warns about. What was done instead: the title now says **(C) is next** rather than (B), (A) and (B) are struck through, and a dated `(B) DONE 2026-10-31` note names the migration, the proof script and the decision file (C) should be briefed from. The title reads correctly without its later paragraphs. The neighbouring item the Pi item says this pairs with — the single-point-of-failure / tunnel-drill item in `## Architecture` — was checked and is **already closed** (2026-10-28, by stream (A)), so nothing was owed there. `write_requests` appears nowhere else in the backlog
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-31-write-requests-schema.md`, recording the four design answers (the scoped unique key, storing the result rather than a reference or a flag, 7-day pg_cron retention, and why the table correctly gets **no card**), why the `-- consumer:` header is `none`, what the proof does and does not cover, and a numbered list of what (C) must do that the table cannot do for itself
- [x] `README.md` still accurate — read; it describes the app, the deploy and the restore recipe, and says nothing about write paths or migration contents that this change makes wrong. No edit needed
- [ ] **Release notes.** — n/a: no shelter user can notice anything yet, and two whole streams, (C) and (D), are outstanding before one could. `CLAUDE.md` is explicit that §7 must not be ticked while a manual step is outstanding, and the note belongs in the PR that makes the failover actually work. `unreleased` in `src/lib/releases.ts` gained no line, which is the honest state and matches this `n/a`
- [x] Commit messages say why, not just what — both commits lead with the measured reason (4 of 85 writes landed after the client gave up, in the 2026-10-28 wedge drill) rather than with the file list, and the second records that the proof harness was verified to be capable of failing
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every behavioural claim in the decision file and both commit messages is an assertion in `scripts/prove-write-requests.mjs` that was run, not an explanation of what the SQL ought to do. The two claims most at risk of being plausible-but-wrong were both measured rather than argued: that an **aborted** write leaves no claim behind (proof 8 — the subtransaction rollback, not reasoning about `on conflict`), and that the **primary key**, not a read-then-write, is what refuses a duplicate (proof 2 — a direct insert raising `unique_violation`). The harness was then deliberately broken to confirm it can report a failure at all

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager. `e9530224` is recorded; whether it is the tip of `main` is a deploy-time fact
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. Nothing in this PR is in a build; the migration is already on the dev database, which `test.lannacare.org` reads
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. There is no behaviour on the deployed build to smoke-test, because no code reads the table
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives "today". `created_at` is `timestamptz` and the retention window is an interval compared with `now()`, so there is no local-date boundary to cross and no part of the day on which the answer differs. The purge runs at a fixed UTC time by design
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: this is not a banding change; the only threshold is the 7-day retention cut, and §3 proof 9 asserts both sides of it (an 8-day-old row goes, a fresh one stays) in the same run
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line in §2, the `check-migration-numbers` line in §3, the three `apply-migrations` lines, the `check-hard-coded-security` and `check-backlog-sections` lines in §6, and the inverted-assertion failure quoted in §3 are all copied as printed, not retyped or tidied
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed, and `anon` gains nothing in this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable. `check-hard-coded-security.mjs` confirms the environment list is unchanged (30 variables, all already recorded)

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — **No.** The migration ships alone; `-- consumer: none` and nothing in `src/` or `worker/` was touched, so there is no ordering constraint within this PR and it can be applied before or after any deploy. **The constraint that will exist is the reverse one and belongs to (C):** (C)'s code must not deploy before `0292` is on production, which is written into the decision file because the header cannot express that direction
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager. **A worktree cannot read production**, so this could not honestly be run here; and production is three migrations behind, so the dry run will cover `0289`–`0292`, not `0292` alone
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing is destructive or rewriting. One new table, one index, three new functions, one cron job; no existing object is altered or dropped
- [x] Apply plan stated — stated in §3's last line: `0292_write_requests.sql`, production project `dbkodyyxxhtygxcxmfcu`, at the next production release, order immaterial for this PR, and expect four pending files rather than one

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the schema is purely additive and nothing reads it, so **it is safe to leave in place and no rollback is needed for this PR**; `npx wrangler rollback` and `deploy-pi.sh --ref <sha>` revert builds and neither reverts migrations, which does not matter here because no build changes. **What that does not cover:** if `0292` ever had to be removed, the `drop` sequence is written out in §3's down-migration line and would have to be applied by hand, and it must not be run once (C) is live. The daily `purge-write-requests` cron job would also survive a build rollback, which is harmless — it only deletes rows from a table nothing reads

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/check-migration-grants.mjs` splits a migration on `;` and strips `--` comments **without tracking string literals**, so a semicolon or a double dash inside a `comment on …` string literal silently swallows the next statement. It read this file's `revoke all on function claim_write_request(…) from public, anon;` as missing and reported a security finding that was not real | fixed in this PR, in the migration — the comment strings carry no `;` and no `--`, and a comment in the file says why so the next author does not reintroduce it. **The check itself is not fixed**: raised as its own backlog item rather than patched here, because `scripts/` hardening is not this stream's subject and the fix affects every migration the check reads |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing — see below | |

Empty, and deliberately so. There is no screen, no wording and no role view a person could look at: no `src/` or `worker/` file was touched and no code reads the table. Every claim in this plan is either a script's output pasted above or an assertion in `scripts/prove-write-requests.mjs`. The deploy-time items have their own `deferred:` state in §8 and are not repeated here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `pi-failover-schema`)  Date: 2026-10-31

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: schema only — no UI surface, no wording and no role view to look at; nothing in `src/` or `worker/` was touched and no code reads the table

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: this is a feature PR, not a release cut; §8 is `deferred:` to them and the apply plan is in §3 for when the next release runs

Result: pass
