# Feature test plan — appeal-photos-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Appeals may show medical photos, one by one": `appeal_photos.medical_ok` (+ audit columns), the guard, the two public views, the `appeal.medical_photo` permission |
| Backlog item | `docs/backlog.md` → **Appeals may show medical photos, chosen one by one, on the appeal's pages only** (left open, status note added on the `backlog` branch) |
| Branch / worktree | `claude/appeal-photos-schema` @ `C:\Development\Animal_Shelter_appeal-photos-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | #696 |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | yes — `0216_appeal_medical_photos.sql` |
| Tested at SHA | `337598d9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) and the audit columns of part (4): a `medical_ok` flag that is the only way a Medical file attaches to an appeal and the only way it becomes public, on a published appeal
- [x] Files/areas touched listed — `supabase/migrations/0216_appeal_medical_photos.sql`, `scripts/check-appeal-medical-photos.mjs` (new), `scripts/check-public-views.mjs`, `src/lib/permissions/catalogue.ts`, both dictionaries (one label), `docs/decisions/2026-10-17-appeal-medical-photos.md`, this plan
- [x] Roles affected identified — Admin gains the right to tick (by default); nobody else. Anon reads the same two views, which now include a Medical file only through a `medical_ok` row on a published appeal; no row has `medical_ok` today, so nothing public changes
- [x] Anything explicitly **out of scope** written down — picker, first-time note, "cover until tapped", Open Graph rule, manual, dictionaries (other than one Settings label), release line: the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `5c0f886d` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. The first run was red on `check-permission-catalogue` (the new activity was not in `catalogue.ts`); fixed and re-run:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all 8 checks passing on #696, read from the PR status

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0216` against highest `0215`; `check-migration-numbers.mjs` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 216 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; one consumer warning (`src/app/appeals` differs from the live release), expected: nothing reads it yet
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0216_appeal_medical_photos.sql … ok`
- [x] File is re-runnable — `add column if not exists`, `create or replace` for functions and views, `drop trigger if exists`, `on conflict` for the activity
- [x] Existing rows still read correctly after the change — no row has `medical_ok`, so both views return what they did; `check-public-views.mjs` ran against dev after applying and its new Medical block reports 45 Medical files checked, none public off an appeal
- [x] **Constraints and defaults exercised against real rows** in `scripts/check-appeal-medical-photos.mjs` (begin … rollback on dev): `HARNESS-OK`. Asserted: Medical attach refused without `medical_ok`; non-image and another resident's photo refused even with it; ticked Medical public to anon on a published appeal by view and by `is_public_drive_file`, with `is_medical` true, and on no resident view; a Medical photo not on the appeal refused everywhere; unpublish, draft, untick, hiding the resident and deleting the row each withdraw it at once; stamp set on tick and cleared on untick; a signed-in user without `appeal.medical_photo` refused (when dev has such a user)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the file header says how to undo in a new file
- [x] Production apply plan stated for the release manager — apply with the next release; `-- consumer` names the app half, so it must be on production before that half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface; no `medical_ok` row exists, so every page renders as before
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; boundaries (unpublish, draft, untick, hidden resident) are in the §3 harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | tick `medical_ok` | allowed | n/a — no UI; admin holds every activity without a row |
| management | tick `medical_ok` | refused unless granted | n/a — no UI; harness checked a non-admin login is refused |
| staff | appeals | unchanged | n/a — no policy or grant changed |
| vet | appeals | unchanged | n/a — as above |
| volunteer | appeals | unchanged | n/a — as above |
| signed out | the two appeal views | Medical file only via a published `medical_ok` row | proven in the §3 harness and `check-public-views.mjs` |

- [ ] Every role above tested — n/a: no policy and no grant changed apart from the new trigger check; the harness covers admin-equivalent and non-permitted
- [x] A role that should not have access is blocked server-side — the trigger refuses a user without `appeal.medical_photo`; anon is refused the Medical file everywhere off a published appeal

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Appeals topic is the app half's
- [ ] Translatable strings go through the translation path — n/a: one Settings label added to both dictionaries; nothing else
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of the two views; they only gain a trailing column
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only the permissions catalogue and two dictionaries gained one entry each
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; a status note goes on the `backlog` branch saying the schema and ruling landed and the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-17-appeal-medical-photos.md`, superseding 0210 decision 3 for appeals only
- [x] `README.md` still accurate — it does not list appeal columns
- [ ] **Release notes.** — n/a: nobody can see anything until the app half; that half writes the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the public/not-public claims come from the harness run on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager, run `check-public-views.mjs --env production` after applying

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the app half reads it, so `0216` must be on production before that half deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only (two views are restated with a trailing column)
- [x] Apply plan stated — `0216` on production with the next release, before the app half

### Rollback

- [x] Rollback position stated — code rollback does not revert `0216` and does not need to: no row has `medical_ok`, so the views behave as before

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First gates run red: `check-permission-catalogue` wanted the new activity in `catalogue.ts` | fixed — entry and both dictionary labels added |
| 2 | info | `check-public-drive-file.mjs` fails on dev: fixture residents clash with an existing `resident_code` (dev sequence behind the rows) | accepted — not this PR; the new harness gives fixtures explicit codes |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
