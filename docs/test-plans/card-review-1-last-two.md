# Feature test plan — card-review-1-last-two

## Header

| | |
|---|---|
| Feature | Card review 1, last two items: My tasks for Record weight and Feed special diets; a Medical upload is never the profile picture |
| Backlog item | `docs/backlog.md` → Card review decisions, cards 1-10 (the two schema leftovers of the app half) |
| Branch / worktree | `claude/card-review-1-last-two-schema` @ `C:\Development\Animal_Shelter_card-review-1-last-two-schema` |
| Dev server | not started: schema plus a two-line bundle mirror |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | yes — `0267_my_tasks_for_two_cards_and_medical_not_profile.sql` |
| Tested at SHA | the tip of the branch at PR time (gates: typecheck=0 lint=0 test=0 build=0) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two cards gain `recurring.do_own`, and `record_attachment()` stops a Medical-folder upload becoming the profile picture
- [x] Files/areas touched listed — `supabase/migrations/0267_*.sql`, `src/lib/permissions/jobs.ts` (two bundle lines), `src/lib/releases.ts`, `docs/decisions/2026-10-26-card-review-1-last-two.md`, this plan
- [x] Roles affected identified — any login holding Record weight or Feed special diets gains My tasks; anyone uploading a resident photo to the Medical folder; Admin unchanged and given nothing
- [x] Anything explicitly **out of scope** written down — Send to hospital on Residents, the ten-card driven re-pass, cards 11-30

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` exit codes read directly: see the PR description for the final line
- [ ] CI green on the PR — n/a: read from the PR status before merging

## 3. Schema and data

- [x] Migration number is one above the highest on `main` and no other branch carries it — `main` ends at 0265; `clinic-login-drop` holds 0266 (already applied on dev), this is 0267
- [x] `--status` reviewed before applying — 267 applied, 1 pending
- [x] `--dry-run` reviewed — `ok`; the only warning was a consumer path that did not exist, corrected in the header
- [x] Applied to **dev** — `applying 0267_… ok`
- [x] File is re-runnable — `on conflict do update` for the grants, `create or replace` for the function
- [x] Existing rows still read correctly — grants only; the function body is 0259's with one added condition
- [ ] Constraints and defaults exercised against real rows — n/a: the profile branch was not driven with a real upload; the change is one `and lower(btrim(coalesce(p_sub_folder,''))) <> 'medical'` on the existing branch. Left for manual verification below
- [x] Down-migration not needed — additive grants; the function change is reverted by restating 0259's
- [x] Production apply plan — `0267` with the next release; `check-card-grants.mjs` passes against dev with it applied (37 roles hold exactly what their cards require; card_grants changes reach every holder)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the My tasks link follows the cell, proved by `check-card-grants.mjs` and the bundle mirror
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | n/a — not touched, given nothing |
| any login holding Record weight / Feed special diets | My tasks | now allowed | `check-card-grants.mjs` ok |
| any other role | My tasks | unchanged | n/a — no other grant changed |

- [ ] Every role above tested — n/a: card-derived; the check script covers all 37 roles
- [ ] A role that should not have access is blocked server-side — n/a: access only widened for two named cards

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no new screen
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles `jobs.ts` readers
- [ ] Any shared file touched checked from a second page — n/a: one data file
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: ticked from the backlog branch with the app half
- [x] Non-obvious design choices in `docs/decisions/` — `2026-10-26-card-review-1-last-two.md`
- [x] `README.md` still accurate
- [x] **Release notes.** — one line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — migration order from `git ls-tree`, grants from the check script

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a
- [ ] **Evidence pasted is unedited** — n/a
- [ ] Public pages re-checked after a cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var — n/a: none

### Migration ordering

- [x] **Migration and code that reads it in one PR?** — yes, but both directions are safe: the extra bundle lines are ignored by `can()` until the cell exists, and the cell does nothing without them
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: additive
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — code rollback does not revert 0267; older code ignores the two cells and the function guard only makes it stricter

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Consumer header named a path that does not exist | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a photo to a resident with no profile picture, folder Medical: it is saved but the profile picture stays empty; a Shelter-folder photo still fills it | a resident's photos |
| 2 | A login holding only Record weight sees My tasks | `/my` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by:

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: linked
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
