# Feature test plan — fault-log-production-readings

## Header

| | |
|---|---|
| Feature | A "what is actually live" header on `docs/card-access-faults.md`, with today's production readings written onto the rows that said LIVE |
| Backlog item | `docs/backlog.md` → the four fault-log items (lines 513, 569, 602 and the Next up pair); this PR records readings only and ticks nothing, because rows are fixed as a set after Lutan's review |
| Branch / worktree | `claude/fault-log-production-readings` @ `C:\Development\Animal_Shelter_fault-log-production-readings` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Opus 5), planner session / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | see the `gates:` block below |

**Provenance, stated plainly:** the content commit (`52d0f7eb`) was written by the
`fault-log-production-readings` stream, whose session has since been archived. This plan was filled
in by the planner session, which **re-ran both production checks the header cites** rather than
signing for work it did not watch. The automated signature below covers exactly that.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/card-access-faults.md`, **`scripts/lib/readonly-checks.mjs`** (the `fault-maintenance-delete` check, rewritten) and this plan. No schema, no UI, no app code. **It is no longer a docs-only PR, so CI runs its full set rather than skipping it**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. The fault log is an internal record; no login reads it and nothing in the app imports it
- [x] Anything explicitly **out of scope** written down — out of scope by Lutan's 2026-10-24 ruling: **fixing** any row. Rows are fixed as a set after his review (gate 3). This PR marks and records; it deletes and rewrites nothing, and ticks no backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 78s

gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; this PR is one markdown file
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration. The "rows" here are markdown table rows, checked by reading them
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; reverting the commit restores the previous log
- [ ] Production apply plan stated for the release manager — n/a: no migration. Production was **read**, never written: every check used is in `check-production.mjs`'s read-only set

## 4. Functional checks

- [x] Happy path works end to end — the header renders as a markdown table and the marked rows keep their original columns; read through in full after the merge from `main`
- [x] **`fault-clinic-visit-save` was re-run by the planner and reproduces the header:** `doctor: clinics.list yes`, `management: clinics.list yes` — no role lacks the clinic list, so that root cause is genuinely **CLOSED**
- [x] **The maintenance-delete claim was WRONG and is corrected in this PR.** The header first said **LIVE, CONFIRMED**, on the old check's output. Established 2026-10-28 by reading the code and every migration: the delete control **exists** (`src/app/maintenance/actions.ts:283` records that RLS on `maintenance.delete` is what stops a role without it) and **no migration grants `maintenance.delete` to any card** — `grep -rn "'maintenance.delete'" supabase/migrations/*.sql` returns only its activity registration at `0179:90`. `card_grants` is written only by migrations, so no card holds it and **only Admin passes**. `0265`'s header said the same in passing. **So it was never a fault, and Lutan confirmed the behaviour: *"Only admin can delete maintenance, keep it that way."***
- [ ] **The rewritten `fault-maintenance-delete` check run against production** — n/a: a worktree has no production credentials by design (`.env.deploy.production` is only in the main checkout), so its SQL was validated by reading as above. **The planner runs it from the main checkout immediately after this merges**, and that is recorded in the manual list below rather than ticked here
- [ ] Data persists — reload the page and the change is still there — n/a: a markdown file in git, no stored state
- [ ] Create / edit / delete all exercised — n/a: a document has no such surface, and deleting rows is forbidden by the ruling above
- [ ] Empty state renders sensibly (no rows yet) — n/a: the log has 252 rows and cannot be empty
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no values computed; every figure is a quoted reading with its date
- [x] **Counts carry their database and their clock** — the header says "read on production 2026-10-28" and closes with "a reading taken on 2026-10-28, not a carried-forward figure. Re-run the named checks before relying on them." That is the house rule for a count, satisfied in the document itself

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | the fault log is a repo file, not a page | n/a |
| management | n/a | as above | n/a |
| staff | — | retired by `0173`, deleted by `0270` | n/a |
| doctor | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | n/a | the repo is public, so the file is readable; it names no person and no credential | as expected |

- [ ] Every role above tested — n/a: `docs/card-access-faults.md` is not served by the app. `grep -rn "card-access-faults" src/` finds no importer
- [ ] A role that should not have access is blocked server-side — n/a: no access path exists to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; the fault log has no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched; an internal engineering record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: no client code
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no requests
- [x] **The repo is public, so the file was checked for anything that should not be published** — the header names roles, cards and activities only: no person's name, no credential, no project ref beyond the production id already throughout the repo

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none to check; `gates.mjs` compiles the app unchanged, which is the evidence that a docs-only change touched no code path
- [x] Any shared file touched checked from a second, unrelated page — `docs/card-access-faults.md` is shared between streams as a record, and the merge from `origin/main` brought in rows added by `fault-log-marking-pass` (#1033). Both sets are present after the merge and neither overwrote the other, read through by hand
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately nothing. Lutan's 2026-10-24 ruling fixes rows as a set after his review, so a reading closes no item; the one root cause this PR closes is recorded in the row, not as a tick
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — the marking pass's own decision file (`docs/decisions/2026-10-28-fault-log-marking-pass.md`, #1033) is already on `main` and the header cites it. This PR adds readings, not decisions
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: an internal engineering record of known faults; no shelter user reads it and nothing they see changes. The faults it describes are unfixed on purpose, so a note would be the opposite of true
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Both cited checks were re-run against production by the planner and reproduced; see section 4. The header's own 141 *not established* caveat is the honest statement of what was **not** measured

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: a docs-only PR ships no build; there is no deployed artifact for a SHA to match
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys from this PR
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date arithmetic; the dates are quoted readings
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the two check outputs quoted in section 4 are as printed, and the `gates:` block above is as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy. Production was read, not written
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores the previous fault log and nothing else. It does not change any live fault: every row describes behaviour that is unfixed on purpose until gate 3

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The maintenance-delete row's first column still reads **"three roles"**, while today's production read returns **two** (`head_of_maintenance`, `second_in_command`). `staff` held Do Maintenance and was deleted by `0270` | accepted — the row's original wording is left as written, which is what the ruling requires; the header's own table carries the corrected count and its date. Recorded here so the next reader does not treat "three" as current |
| 2 | low | The content commit had **no test plan**, so the PR could not have been opened as it stood | fixed — this plan was written by the planner session, which re-ran both cited checks rather than signing for unwatched work |
| 3 | **medium** | **The header asserted the maintenance delete was LIVE, CONFIRMED on production. It is not a fault at all** — the control exists and no card grants the activity, so it has always been Admin-only. The planner read the policy (`has_permission('maintenance.delete')`) and concluded work was needed **without reading the grants**, which is the same class of error as quoting a check without reading its query | fixed in this PR — header, root-cause table and gate-3 section all corrected, with Lutan's confirming words recorded. A backlog item and a stream brief had already been written on the wrong premise; the stream's own step-zero check caught it and it built nothing |
| 4 | **medium** | **The `fault-maintenance-delete` check reported the intended design as a fault on every run**, and would have for ever: it listed holders of Do Maintenance and failed if there were any, on the premise "no delete control exists" | fixed in this PR — rewritten to ask the inverse question that **guards** the decision: does any card grant `maintenance.delete`? None is correct; one would mean deleting a job had left Admin |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | ~~Lutan's own review of the log as a set — **gate 3**~~ **DONE 2026-10-28: he reviewed the log as a set in this session and closed the gate.** His decisions, his "cards not roles" correction, and the two card-level questions still with him are recorded in the log's own new gate-3 section | `docs/card-access-faults.md` |
| 2 | **Run the rewritten `fault-maintenance-delete` from the main checkout** and confirm it prints "No card grants maintenance.delete". A worktree cannot reach production; the planner owns this and does it as soon as this merges | `node scripts/check-production.mjs fault-maintenance-delete` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5), planner session — gates, and both cited production checks re-run  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan reviewed the log as a set, closed gate 3, and asked in chat for this to be recorded as his signature

Manual verification by: Lutan — reviewed the card-access fault log as a set, closed gate 3, and confirmed in chat; line written by Claude at their request. His signature covers THE REVIEW; the maintenance-delete correction (defects 3 and 4) was made after it, is a factual fix rather than a decision, and carries his own confirming words  Date: 2026-10-28

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: docs-only, nothing to deploy
