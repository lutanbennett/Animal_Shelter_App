# Feature test plan

## Header

| | |
|---|---|
| Feature | `0137`, `0138`, `0139`: rounds (Morning, Lunch, Evening; food has no Lunch) as a lookup table, the rounds a prescription, a frequency and a diet are given in, status views that flag a dose in no round, and `suggestRound()` on the Asia/Bangkok clock. Schema and model only |
| Backlog item | `docs/backlog.md` → Medical records → **Medication by time of day**. **Not ticked**: it is "a schema change and a feature" and this is the schema; the item carries a status line |
| Branch / worktree | `claude/schema-medication-rounds` @ `C:\Development\Animal_Shelter_schema-medication-rounds` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not started: no screen changed) |
| PR | recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0137_medication_rounds.sql`, `0138_prescription_rounds.sql`, `0139_round_helper_revokes.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `f37ac229` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the database now knows which rounds a dose or meal belongs to, with defaults and a back-fill, and the app has a pure function that suggests a round from the shelter's clock; no screen reads it yet
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0137`–`0139`; `src/lib/rounds/suggest.ts` (new, nothing imports it yet); `scripts/check-shelter-dates.mjs` (round edges added); `scripts/check-medication-rounds.mjs` (new); `docs/decisions/2026-10-04-medication-rounds.md`; `docs/backlog.md`. No routes, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: no role sees a change. New tables carry policies: staff, vet, management and admin read the mappings (a vet only of visible diets and prescriptions); management and admin edit `frequency_rounds`; admin edits `rounds`; the Head of Medical reads `prescription_rounds` through the prescription's own policy; volunteer and signed-out read none of the mappings
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: every screen (the medication list, the add-prescription ticks, the pick list, pictures-first, Feed Special Diets), recording a dose given, `medical.weight`, `record_attachment()`, the diets view

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 28s

  gates: typecheck=0 lint=0 build=0
  ```
  An earlier run read `lint=1`: `check-migration-grants` wanted `revoke … from public, anon` on the two pure helper functions. Fixed in `0137` and, for dev, `0139`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0136`; `check-migration-numbers` reports `0137`–`0139` against `origin/main f37ac229`. This branch is the only migration in flight
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `136 applied, 1 pending` before `0137`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0137` and `0138` each `… ok`; consumer warnings only (the readers are not live yet: the safe direction)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0137 … ok`, `0138 … ok`, `0139 … ok`, from this branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): proven, not read. The harness applies `0137` and `0138` again on top of themselves, inside its transaction, and asserts no row was added, removed or changed (`re-run: nothing duplicated or undone`)
- [x] Existing rows still read correctly after the change (checked against real dev data): every real frequency has the rounds its schedule owes (Once daily morning; Twice daily and Every 12 hours morning and evening; Three times daily and Every 8 hours all three; Weekly, Every other day, Every 2 weeks and Monthly morning; As needed none and `ok`); no existing prescription with a schedule is left in no round; no current prescription or diet reads `none` or `mismatch`; every two-meal diet is morning and evening
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-medication-rounds.mjs`. Asserted: the vocabulary; the back-fill above; a new frequency gets 1 a day morning, 2 a day morning and evening, 3 a day all three, an interval morning, as needed none; 4 a day has three rounds and reads `mismatch`; changing 1 a day to 3 a day re-defaults; a rename does not undo a hand edit; a frequency, a prescription and a diet with no rounds read `none`, not `ok`; the whiteboard case (a twice-a-day prescription takes morning and evening, reads `ok`); an unrelated edit does not re-default a hand-ticked prescription; lunch can be ticked on a prescription and is refused on a diet; changing a prescription's frequency re-defaults; as needed owes nothing and reads `ok`; an ended prescription leaves the status view; and who may read and write each mapping, under seven logins' own JWTs. Output, as printed:

  ```
  70 checks held, 0 failed.
  RESULT: GREEN
  ```

  Green on the first run, so it was not seen red; it was not run against a deliberately broken migration
- [x] Down-migration written, or the reason one is not needed is stated: not written. Additive, and `0137`'s header lists the drops (two views, four triggers, the join tables, `rounds`, the functions). `0138` adds one table, one view, two triggers and a function. Nothing existing was altered
- [x] Production apply plan stated for the release manager (which file, which project, when): `0137`, `0138`, `0139` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--env production --dry-run` then apply, after this PR merges. No code reads them, so the order against the deploy does not matter. Note `--dry-run` runs each file in its own rolled-back transaction: `0138` reads tables `0137` creates, so it will report FAILED until `0137` is really applied; that is the dry-run caveat in `CLAUDE.md`, not a fault in the file

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; nothing reads these tables yet. The model's path is the harness above
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, update and delete of the mapped rows are exercised by the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; the database's empty state (no rounds) is the `none` status, asserted
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the database refuses lunch on a diet with `That round is not used for food.`, asserted
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the clock's edges. `scripts/check-shelter-dates.mjs` runs the real exported `suggestRound()` and `shelterHour()` against fixed instants: 00:00, 06:59:59, 10:59:59, 11:00:00, 15:59:59, 16:00:00 and 23:59:59 Thai time, for medication and for food, under `TZ=UTC`, `Asia/Bangkok`, `America/Los_Angeles` and `Pacific/Kiritimati`. Last lines, as printed:

  ```
  All checks passed.
  ```

### Role access matrix

Read and write of the new tables, under each login's own JWT, from the harness. No screen exists to hit.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | read all four tables; write all | allowed | held |
| management | read all; write `frequency_rounds` and `prescription_rounds` | allowed; `rounds` refused | held |
| staff | read all; write `prescription_rounds` | `frequency_rounds` and `rounds` writes refused | held |
| vet | read all; no write on `prescription_rounds` as the harness vet has no own-clinic prescription | refused | held |
| volunteer | `rounds` only | the mappings return no rows | held |
| signed out | no grant | refused | not exercised: `anon` has its grants revoked in the file; no probe was written for it |

- [x] Every role above tested: five logins and a login with no role by the harness; signed out is revoked in the file and was not probed (said above)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): there is no URL; the refusal is by the database, which is the layer that matters

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no screen
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can do or see yet; the feature half writes the manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string added; the Thai round names live in the `rounds` rows and nothing renders them yet
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): none load the new tables, but the triggers fire on every prescription, frequency and diet insert. The harness inserts all three. The medication list was not loaded in a browser
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**: n/a in substance, none touched. `scripts/check-shelter-dates.mjs` is the only shared script changed and its pre-existing checks still pass in the same run
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged (`Already up to date.`)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; the item is a schema change and a feature and this is the schema. A status line was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-medication-rounds.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** — n/a: nothing a shelter user would notice; no screen reads the new tables and no existing behaviour changed. `unreleased` is left alone on purpose
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The timezone claims were measured by the boundary suite above, and the data claims by the harness against dev. The `lint=1` explanation is from the lint output itself

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: the boundary suite above proves the logic at both edges under `TZ=UTC`; whether the deployed build agrees is the release manager's, and nothing calls `suggestRound()` yet, so there is nothing deployed to observe until the screens land
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: the clock bands (11:00 and 16:00) are asserted on both sides of each edge, as above; there is no bug report here and no earlier behaviour changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted lines are the tools' own closing lines, unedited; no hand-kept results table
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page or its data changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No code reads the tables (`suggest.ts` reads nothing from the database), so there is no ordering constraint between the production apply and the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (the production apply). Expect `0138` to read FAILED until `0137` is really applied (see section 3)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; it writes new rows in new tables and alters nothing existing
- [x] Apply plan stated: `0137`, `0138`, `0139` in order, to production, after merge; stated in section 3

### Rollback

- [x] Rollback position stated, **including what it does not cover**: nothing reads the tables, so a code rollback is moot. The schema is additive and may stay; to remove it, drop the objects `0137`'s and `0138`'s headers list. The back-filled rows go with the tables. Neither `deploy-pi.sh --ref` nor `wrangler rollback` reverts a migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `0137` created two helper functions executable by PUBLIC; `npm run lint` caught it | fixed: revokes in `0137` and `0139` |
| 2 | design | `0137` mapped rounds to the frequency only; Lutan's whiteboard has the person tick rounds on the prescription | fixed: `0138` `prescription_rounds`, with `frequency_rounds` as the default ticks |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: empty; no screen, so nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing a person could look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not open

Result: pass

Release manager acknowledgement: pending
