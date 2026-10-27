# Feature test plan — card-review-2-schema-followups

## Header

| | |
|---|---|
| Feature | Schema half: `appeal_choices` names-only view and `set_hero_photo()` (hero photo behind `website.gallery`) |
| Backlog item | `docs/backlog.md` → **Card review 2 schema follow-ups** (left open, schema-half note added; app half remains) |
| Branch / worktree | `claude/card-review-2-schema` @ `C:\Development\Animal_Shelter_card-review-2-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | filled in on the PR |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | yes — `0274_appeal_choices_and_hero_photo.sql` |
| Tested at SHA | PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a view of open appeals for `donation.receipt`, and a function asking `website.gallery` to set the hero photo
- [x] Files/areas touched listed — `supabase/migrations/0274_appeal_choices_and_hero_photo.sql`, `docs/backlog.md` (status note), `docs/decisions/2026-10-27-appeal-choices-and-hero-photo-schema.md`, this plan
- [x] Roles affected identified — none see a change: nothing reads the view or calls the function yet
- [x] Anything explicitly **out of scope** written down — the donation form, `uploadHeroPhoto`/`removeHeroPhoto` and hidden buttons are the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — result recorded on the PR
- [x] CI green on the PR — read from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0274` against `0273`; the brief names this as the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 274 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0274_appeal_choices_and_hero_photo.sql … ok`
- [x] File is re-runnable — `create or replace` view and function, revoke/grant restated
- [x] Existing rows still read correctly after the change — additive: no existing object changed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev: a login with no card reads 0 `appeal_choices` rows and `set_hero_photo` raises 42501; Admin reads the open appeal and not the closed one; `set_hero_photo('probe-file')` sets and `set_hero_photo(null)` clears; anon cannot execute it. Result: `ALL PASSED (rolled back)`. A login holding exactly `donation.receipt` or `website.gallery` was not driven (the WHERE and the function ask those activities directly)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; undo is in the file header
- [x] Production apply plan stated for the release manager — `0274` on `dbkodyyxxhtygxcxmfcu` with the next release, before the app half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the permission refusal is asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; closed appeal excluded and blank id clears, both in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `appeal_choices`, `set_hero_photo` | allowed | pass — §3 harness |
| login with no cards | same | nothing | pass — §3 harness |
| anon | same | refused | pass — §3 harness (function); view not granted to anon |

- [ ] Every role above tested — n/a: access is by card; the two outcomes that matter (Admin yes, no-card no) were driven
- [ ] A role that should not have access is blocked server-side — n/a: done in the row above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing existing changed; `check-public-views`, `check-public-view-owner`, `check-cards-count` and `check-hard-coded-security` all ran clean on dev
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open with a status note; the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — function versus column policy
- [x] `README.md` still accurate — it does not list views or functions
- [ ] **Release notes.** — n/a: nobody would notice; nothing reads the view or function yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: none pasted
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`; `0274` must be on production before the app half deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — with the next release, before the app half

### Rollback

- [x] Rollback position stated — code rollback does not revert `0274` and does not need to: nothing reads it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | First harness run used `roles.is_admin`, which is not a column on dev (`has_permission` keys on `roles.key = 'admin'`) | fixed — harness corrected; migration unaffected |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing reads these yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
