# Feature test plan — card-review-schema-all

## Header

| | |
|---|---|
| Feature | Card review 2, schema half: split Medical and Contacts, Publish Shelter Friends and Website photo cards, reads for nine cards, landing cards deleted, Who does what read only |
| Backlog item | `docs/backlog.md` → Card review decisions, cards 11-21 and 22-29, clause (a) only; the app half is a later stream, so neither item is ticked |
| Branch / worktree | `claude/card-review-schema-all` @ the Animal_Shelter_card-review-schema-all folder |
| Dev server | not started: schema, card definitions, labels |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | yes — `0268_card_review_2_cards.sql` |
| Tested at SHA | the tip of the branch at PR time (gates: typecheck=0 lint=0 test=0 build=0) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — four new cards, two landing cards deleted, grants changed on fifteen cards, roles.view held at read, site_content_photos writes ask website.gallery
- [x] Files/areas touched listed — `supabase/migrations/0268_*.sql`, `src/lib/permissions/cards.ts`, `catalogue.ts`, `routes.ts`, `who-does-what.ts`, the Who does what page guard, both dictionaries, `check-cards-count.mjs`, `docs/card-walkthrough.md`, two retired card reports, `src/lib/releases.ts`, `docs/decisions/2026-10-26-card-review-2-schema.md`, this plan
- [x] Roles affected identified — holders of Medical records (staff) and Contacts (management) keep every cell; holders of Book clinic visits, Dashboard, Donations, Bills, Enclosures, Assistant, Meme library, Add Shelter Photos, Approve photos, Run appeals, Who does what change as in the decision file; Admin unchanged and given nothing
- [x] Anything explicitly **out of scope** written down — the app half (hidden buttons, saves, wording), Run appeals medical read, the appeals list for Donations, the Website hero photo, new card reports

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` exit codes read directly: see the PR description for the final line
- [ ] CI green on the PR — n/a: read from the PR status before merging

## 3. Schema and data

- [x] Migration number is one above the highest on `main` and no other branch carries it — `main` ends at 0267 after #967; this is 0268
- [x] `--status` reviewed before applying — 268 applied, 1 pending
- [x] `--dry-run` reviewed — `ok`; the only warning was a consumer path that did not exist, corrected in the header
- [x] Applied to **dev** — `applying 0268_… ok`
- [x] File is re-runnable — `on conflict do update` for the grants, `create or replace` for the function
- [x] Existing rows still read correctly — grants, two activity rows and one policy expression
- [ ] Constraints and defaults exercised against real rows — n/a: no rows are written; the policy change affects only the photo strip, which no role but Admin can write today
- [x] Down-migration not needed — grants reverse by restating the previous rows
- [x] Production apply plan — `0268` with the next release; `check-card-grants.mjs` passes against dev with it applied (37 roles hold exactly what their cards require)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no new screen; the grants are proved by `check-card-grants.mjs`
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | n/a — not touched, given nothing |
| staff / management | what they could do before | unchanged or wider | `check-card-grants.mjs` ok; production holders read 2026-10-26 |
| any role holding a changed card | the reads named in the decision file | as decided | `check-card-grants.mjs` ok |

- [ ] Every role above tested — n/a: card-derived; the check script covers all 37 roles
- [ ] A role that should not have access is blocked server-side — n/a: policies changed only on site_content_photos (Admin-only in practice); the check covers the grants

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no new screen
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the typecheck gate compiles every reader of cards.ts
- [ ] Any shared file touched checked from a second page — n/a: no page code changed beyond a guard level
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: only clause (a) of both items; the app half ticks them
- [x] Non-obvious design choices in `docs/decisions/` — `2026-10-26-card-review-2-schema.md`
- [x] `README.md` still accurate
- [x] **Release notes.** — one line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — migration order from `git ls-tree`, production holders from `check-production.mjs role-cards`, grants from the check script

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: nothing numeric in this change — two `card_grants` rows and one folder-name condition; no thresholds, ranges or dates
- [ ] **Evidence pasted is unedited** — n/a: no evidence pasted here; the deployed-build checks above are deferred to the release manager
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

- [x] Rollback position stated — code rollback does not revert 0268; older code asking roles.view as a yes/no would refuse Management on the read cell, so ship the code and migration together

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Typecheck: a level activity needs an explicit level in the bundle | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding only View medical (or Book clinic visits) sees the clinic names and the medical tabs read only | a resident's page |
| 2 | Management still opens Who does what and Shelter Friends | `/admin/who-does-what`, `/management/contacts` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; it is waiting on a person, see the signature below

Manual verification by: pending: a person checks items 1 and 2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: linked
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
