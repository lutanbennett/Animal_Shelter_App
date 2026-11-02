# Feature test plan

## Header

| | |
|---|---|
| Feature | Correct a resident's intake date from Settings, moving the dates the intake stamped with it (new card `correct_intake_date`, migration 0302) |
| Backlog item | `docs/backlog.md` → **CORRECT A RESIDENT'S INTAKE DATE FROM ADMIN SETTINGS** (Management) |
| Branch / worktree | `claude/intake-date-correction` @ `C:\Development\Animal_Shelter_intake-date-correction` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-02 |
| Carries a migration? | yes, `0302_correct_intake_date.sql` |
| Tested at SHA | 09c242aa |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one definer function moves the intake date and the four records it stamped, behind a new card, with a Settings page
- [x] Files/areas touched listed — `supabase/migrations/0302_*`, `src/lib/permissions/{cards,catalogue,routes}.ts`, `scripts/check-cards-count.mjs`, `src/app/admin/intake-date/**`, `src/app/admin/page.tsx`, `src/lib/write-requests.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/prove-intake-date-correction.mjs`, a decision file
- [x] Roles affected identified — analysis by card: only the new card `correct_intake_date` gains anything; no role holds it yet, so only Admin sees the page until Lutan assigns it
- [x] Anything explicitly **out of scope** written down — `group_origins.date` is not moved, no other date is correctable, nothing feeds Cashflow or reports; the production apply is Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0301`), and no other in-flight branch carries one
- [x] `--status` reviewed before applying: 303 applied, 1 pending
- [x] `--dry-run` reviewed: `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`on conflict`, `or replace`, `drop function if exists`)
- [x] Existing rows still read correctly after the change — the migration adds one activity, one card and one function; the trigger keeps every protection it had
- [x] **Constraints and defaults exercised against real rows** — `scripts/prove-intake-date-correction.mjs`, a `begin … rollback` harness: an earlier date moves all five values; a later diet, weighing and move are untouched; moving later is refused naming the weight, the diet and the move; a refusal changes nothing; preview writes nothing; `group_origins.date` is not moved; a login without the activity gets 42501; a future date is refused. Passed against dev, nothing kept
- [ ] Down-migration written — n/a: additive, and the function and card are inert until a card is assigned; the one trigger change only adds an exemption that nothing but the new function can raise
- [x] Production apply plan stated: `node scripts/apply-migrations.mjs --env production`, `0302` is the first pending file, Lutan's step in the release cut

## 4. Functional checks

Driven on dev, port 3001, with `dev-signin.mjs --cards correct_intake_date` and `--cards view_residents`, reached by clicking Settings, then the tile.

- [x] Happy path works end to end — found a resident, saw the records that move, saved 2026-09-24 to 2026-09-23, the page confirmed it
- [x] Data persists — after the save the page shows the new intake date and the first place from the new date
- [ ] Create / edit / delete all exercised — n/a: a single edit action exists
- [ ] Empty state renders sensibly — n/a: nothing is listed until a search is made; "No resident matches that." is a string, not exercised
- [x] Invalid input is rejected with a readable message — a deceased resident's lock message came back as "something went wrong" on the first try; fixed (code 23001 passed through) and the refusals in the harness read as sentences naming the record
- [x] Boundary cases checked — in the harness: later than a later move, diet and weight, future date, same date

### Role access matrix

Analysis by card, not by role (`CLAUDE.md`).

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `correct_intake_date` alone | Settings, Correct an intake date | one tile; page opens; search works; Save drawn | confirmed on dev |
| `view_residents` alone | the same address | refused ("You don't have access to this page"), no tile, no control | confirmed on dev |
| Admin | same | opens through the existing Admin short-circuit | n/a: not re-driven; `can.ts` untouched |
| signed out | same | redirected to login | n/a: guard is `requirePermission`, unchanged behaviour |

- [x] Every card above tested, except where marked n/a with a reason
- [x] A login without the card is blocked server-side — hit the address directly, refused; and the function itself returns 42501 (harness)

## 5. Cross-cutting

- [x] Nav entry correct — a tile on Settings, shown only when the route opens for the login; no dead links
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Correcting a resident's intake date")
- [x] Translatable strings go through the dictionaries (en and th); Thai is our own wording, not read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: Settings pages are larger-screen pages and say so (`LargerScreenNotice`)
- [x] Browser console clean — no errors seen during the driven flow beyond the expected refusal
- [x] Network clean — no unexpected 4xx/5xx on the page

## 6. Regression

- [x] The pages nearest the change still work — Settings landing loads with the new tile for a one-card login, and without it for a no-card login
- [x] Shared files touched (`cards.ts`, `catalogue.ts`, `routes.ts`, `admin/page.tsx`, dictionaries) are covered by `check-cards-count`, `check-card-grants` (all 68 roles hold exactly what their cards require), `check-permission-catalogue` (all ok), `check-hard-coded-security` (no coded security outside the Admin bypass)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing new merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as `docs/decisions/2026-11-02-intake-date-correction.md`
- [ ] `README.md` still accurate — n/a: no README text covers this
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a card-tagged line (`correct_intake_date`) for it, written for a shelter user. The production apply is part of the release cut that publishes it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the dev failure and the harness results were observed; the trigger pattern was read from 0119

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: dates are compared as shelter calendar days through `shelter_date()` and the intake stamp is `date::timestamptz` exactly as `record_intake` stamps it
- [ ] Boundary or banding change covered at both edges — n/a: the harness covers both sides of each later-record boundary (earlier is never refused, later than each record is refused)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gate output below is pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? yes: the production apply must happen before the deploy, written into the plan — deferred: release manager
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — n/a: additive
- [ ] Apply plan stated — deferred: Lutan, before the deploy of the release carrying `0302`

### Rollback

- [ ] Rollback position stated — n/a: additive schema is safe to leave; the Pi rollback is `deploy-pi.sh --ref <sha>`, which does not revert migrations

## Evidence

```
=== gates: typecheck exited 0 after 16s
=== gates: lint exited 0 after 109s
=== gates: test exited 0 after 20s
=== gates: build exited 0 after 90s
gates: typecheck=0 lint=0 test=0 build=0
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A deceased resident's lock message showed as "something went wrong" | fixed: code 23001 now passes through |
| 2 | low | Refusal sentences from the database are English only | deferred to backlog: for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the Thai text on the page, the card and its description | Settings, Correct an intake date, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: someone who reads Thai

Manual verification by: pending: a Thai speaker to read the new Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan file is part of the PR
- [ ] Handed to the production release manager — n/a: handed over at the release cut

Result: pass with accepted defects

Release manager acknowledgement: n/a
