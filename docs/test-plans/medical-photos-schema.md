# Feature test plan — medical-photos-schema

## Header

| | |
|---|---|
| Feature | Schema half: Medical-folder photos need `photos.resident_medical`, not View residents (`0276`) |
| Backlog item | `docs/backlog.md` → **MEDICAL PHOTOS ARE READABLE WITH THE VIEW RESIDENTS CARD** (left open: the app half remains) |
| Branch / worktree | `claude/medical-photos-schema` @ `C:\Development\Animal_Shelter_medical-photos-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | yes — `0276_medical_photos_card.sql` |
| Tested at SHA | `4bf19567` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a Medical-folder resident photo is readable only with the new `photos.resident_medical` read, granted to View medical and Manage medical
- [x] Files/areas touched listed — `supabase/migrations/0276_medical_photos_card.sql`, `src/lib/permissions/catalogue.ts`, `src/lib/i18n/dictionaries/en.ts` and `th.ts` (one line each, required by lint), `docs/proofs/0276-medical-photos-harness.sql`, a decision file, this plan
- [x] Roles affected identified — lose the read: volunteer, second_in_command, head_of_maintenance, head_of_medical (and any role holding View residents without a medical card). Keep it: admin, management and doctor (via Book clinic visits, which includes View medical)
- [x] Anything explicitly **out of scope** written down — gallery, uploader and Move choice (app half), the Drive link sharing, `set_resident_profile_photo()` lacking a Medical test (found, not fixed), production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 79s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0276` against highest `0275`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 275 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied, then re-run once more after a literal-row edit
- [x] File is re-runnable — run again against dev after being applied: succeeded with no change
- [x] Existing rows still read correctly after the change — dev's 52 Medical and 37 Shelter resident photos are the data the harness read through
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`docs/proofs/0276-medical-photos-harness.sql`). One resident, photos filed as Shelter, Medical, a trailing-space Medical, Medical plus a tab, and MEDICAL. Asserted per login: Admin, View medical, Manage medical, Management and Doctor read all 4 Medical variants and the Shelter photo; View residents only, volunteer, 2IC, head of maintenance and head of medical read the Shelter photo and zero Medical variants. Add-medical-photos-only reads neither (its shelter count was not compared with before)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: restoring `0264`'s `attachments_select_perm` body and deleting the grant rows and activity undoes it; nothing else depends on it
- [x] Production apply plan stated for the release manager — `0276` on `dbkodyyxxhtygxcxmfcu`, planner applies after merge

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the read behaviour is asserted in §3's harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: insert, update and delete policies untouched
- [ ] Empty state renders sensibly — n/a: no UI surface; the empty Medical heading is the app half's
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: the folder-name boundary (case, trailing space, tab) is in §3's harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Medical photos | all | harness: reads 4 of 4 |
| management | Medical photos | all (via Book clinic visits) | harness: 4 of 4 |
| staff | retired | n/a | n/a: role retired |
| doctor | Medical photos | all (via Book clinic visits) | harness: 4 of 4 |
| volunteer | Shelter photos only | no Medical | harness: Shelter 1, Medical 0 |
| signed out | nothing | nothing | n/a: policy is for authenticated; anon untouched |

- [x] Every role above tested — in the harness, plus 2IC, head of medical, head of maintenance and four card-only logins
- [x] A role that should not have access is blocked server-side — the harness reads through RLS as each login

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the app half carries it
- [x] Translatable strings go through the translation path — the new activity has an English and a Thai label in the dictionaries
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — checked at the database, not the browser; the build compiles every reader, and the harness shows Shelter photos still readable by every login
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the three shared files gained one line each, checked by typecheck, lint and build
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-medical-photos-need-their-own-read.md`
- [x] `README.md` still accurate — it does not list activities
- [ ] **Release notes.** — n/a: production does not have `0276` until the planner applies it, so a note would be false; the cut or PR that closes the apply carries any note (a volunteer who used to see Medical photos is the audience)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — role lists and the live policy were read from dev, the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: the one boundary, the folder name, is asserted at its edges in §3 (exact, case, space, tab)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the code is three registration lines. The app half reads it next batch
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: planner, at the production apply
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: a policy body and two rows, no data rewritten
- [x] Apply plan stated — `0276` on production by the planner after merge; the catalogue line is harmless before it

### Rollback

- [x] Rollback position stated — code rollback does not revert `0276`; to undo, a new file restores `0264`'s policy body and deletes the grants and activity

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `set_resident_profile_photo()` (live body `0264:518`) has no Medical test; a `photos.resident_manage` login can set a Medical file as profile photo (public views still exclude it, `0101`/`0103`) | deferred to backlog |
| 2 | low | Head of medical files Medical photos and can no longer browse them | accepted: the ruling "decrease to just what is required"; one grant if wanted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the planner's apply

Result: pass

Release manager acknowledgement: n/a: not yet released
