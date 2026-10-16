# Feature test plan — book-clinic-card-tile-fix

## Header

| | |
|---|---|
| Feature | The Book clinic visits card draws a tile for shelter roles (Management) and still opens the vets' own page for a clinic login |
| Backlog item | `docs/backlog.md` → **BUG: the Book clinic visits card shows no tile on Management's home** (ticked) |
| Branch / worktree | `claude/book-clinic-card-tile-fix` @ `C:\Development\Animal_Shelter_book-clinic-card-tile-fix` |
| Dev server | not started — verified against the real dev role rows with scripts (see section 4) |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `37912605` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a card may name a page for shelter roles (`opensAny`), so Book clinic visits opens `/upcoming-visits` for Management and `/appointments` for a clinic login; plus the guard and the Who does what warning and note
- [x] Files/areas touched listed — `src/lib/permissions/cards.ts` (+ `cards.test.mjs`), `src/lib/home/tiles.ts`, `scripts/check-home-cards.mjs`, `src/app/admin/who-does-what/` (page, CardBoard), `en.ts`/`th.ts`, `src/lib/releases.ts`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified — any shelter role (clinical scope `any`) holding Book clinic visits gains a home tile; a clinic login (doctor) is unchanged; Admin and Management see the new warning and note on Who does what
- [x] Anything explicitly **out of scope** written down — no route scope, permission or role cell changed: `/appointments` stays refused to shelter roles, and no role gains a page. No migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends with all gates 0, pasted exactly as printed:

```
=== gates: build exited 0 after 137s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — computed from the real dev `management` and `doctor` role rows and cells with Book clinic visits added: Management gets `Book clinic visits -> /upcoming-visits`; the doctor gets `Book clinic visits -> /appointments`. View residents is not drawn for Management because Residents stands for it. Not clicked in a browser (see the manual list)
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no data written
- [ ] Empty state renders sensibly — n/a: a role with no cards is unchanged
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — both clinical scopes; a card with no `opensAny` falls back to `opens`; `scripts/check-home-cards.mjs` ran green (`all ok`) on dev, then went red on two planted faults (`opensAny` removed; `opensAny` pointed at `/appointments`), each printing `FAIL card book_clinic_visits at clinical scope "any"` and exiting 1, and was restored. `cards.test.mjs` also passes (inside `npm test`, test=0)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Who does what | sees the warning and the Residents note | not driven in a browser |
| management | home tile, `/upcoming-visits` | tile appears and opens the visits list | tile computed from real dev role data: ok |
| second_in_command / head_of_* | home tile | same as management if they hold the card | covered by the guard at scope `any` |
| doctor | `/appointments` | tile still opens its own appointments | computed from real dev doctor role: ok |
| volunteer | n/a | unchanged | n/a: holds no such card |
| signed out | nothing | nothing | n/a: no route or scope changed |

- [x] Every role above tested — as marked in the table; roles that do not hold the card are unchanged by construction
- [x] A role that should not have access is blocked server-side — no route scope changed (`routes.ts` untouched), so `/appointments` is still refused to scope `any`; the guard proves each tile leads to a page its holder can open

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the card's behaviour is not described in the manual
- [x] Translatable strings go through the translation path — two new strings (`shownAsPart`, `noTile`) added to both `en.ts` and `th.ts`; typecheck requires both
- [ ] Mobile viewport (375px) — n/a: text lines only, not seen in a browser (manual list)
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work — the build compiles `/admin/who-does-what` and the home; `check-home-cards.mjs` re-ran every dev role's tiles in English and Thai: all ok
- [ ] Any shared file touched checked from a second page — n/a: `tiles.ts` is exercised by the same script for every role
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; searched `cards.ts`, `tiles.ts`, `check-home-cards`: the other hits are done or unrelated (the "Book a vet appointment" button item is already ticked)
- [x] Non-obvious design choices added in `docs/decisions/2026-10-16-card-opens-per-clinical-scope.md`
- [x] `README.md` still accurate — it does not describe card pages
- [x] **Release notes.** `unreleased` has a line for Management's new tile and the Who does what notes. No step is outstanding (app only, no deploy-side manual step)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — cause confirmed by reading `routes.ts` and `tiles.ts`; fix shown by running the guard and the real-role computation

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold; the scope boundary was checked at both values
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates output above is verbatim
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in the same PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — code only, no schema: roll back by redeploying the previous ref on the Pi; nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as Management with Book clinic visits given: the home shows a Book clinic visits tile and it opens the upcoming visits list | Management login on the app |
| 2 | Settings → Who does what: View residents under Management shows the "shown as part of Residents" note | `/admin/who-does-what?role=management&card=view_residents` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two items above

Manual verification by: pending: Management-login look at the home tile and the Who does what note

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
