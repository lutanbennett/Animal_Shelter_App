# Feature test plan — shelter-photos-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Add Shelter Photos" and photo approval: the activity `photos.shelter_add`, `attachments.approved_at/approved_by`, the back-fill, approved-only public views |
| Backlog item | `docs/backlog.md` → **A separate "Add resident photos" card** and **Photos filed by a volunteer stay unpublished until Management approves them** (both annotated, neither ticked) |
| Branch / worktree | `claude/shelter-photos-schema` @ `C:\Development\Animal_Shelter_shelter-photos-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number is known once opened |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | yes — `0217_photo_approval.sql` |
| Tested at SHA | `b9245562` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — a new Shelter-only activity, an approval state on photos that is waiting for anyone who cannot publish, a back-fill that keeps every existing photo public, and approved-only public views
- [x] Files/areas touched listed — `supabase/migrations/0217_photo_approval.sql`, `scripts/check-photo-approval.mjs` (new), `scripts/check-public-views.mjs`, `src/lib/permissions/catalogue.ts` and both dictionaries (one activity row and its label, so the catalogue check stays green), decision file, this plan
- [x] Roles affected identified — none sees a change today: no code reads the columns, and no card grants `photos.shelter_add`. The signed-out public sees the same photos as before (counts below)
- [x] Anything explicitly **out of scope** written down — the "Add Shelter Photos" card, `photoCategoriesFor()`, upload routes, the Photos to approve queue and labels are the app half; see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ran; lint is red for a reason that is not this PR (see Defects #3) and is not hidden. Closing lines from the run:

```
=== gates: build exited 0 after 107s

gates: FAILED — lint
gates: typecheck=0 lint=1 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0217` against highest `0216`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 217 applied, 1 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — failed twice for real reasons, both fixed in the file before anything was kept: `permission_activities.sort` is unique (22 taken, now 65), and the back-fill was stopped by the deceased-resident lock (0026), now bypassed with that lock's own transaction-local setting. Third dry run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0217_photo_approval.sql … ok`
- [x] File is re-runnable — the column and back-fill sit in a guard that runs only when `approved_at` is absent, so a re-run cannot approve a waiting photo; everything else is `or replace` / `drop … if exists` / `on conflict`
- [x] Existing rows still read correctly after the change — **public view row counts on dev, read as anon, before and after the apply, identical:** `public_resident_photos` 0, `public_resident_cards` with a profile photo 25, `public_resident_profiles` with one 0, `public_recent_adoptions` with one 1, `public_adoption_updates` 4, `public_appeal_photos` 6, `public_appeals` with a cover 3. Dev has no photos on the public gallery view today, so the back-fill is also asserted directly: after the apply **0 attachments are waiting** (harness step 0)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`scripts/check-photo-approval.mjs`, HARNESS-OK). Asserted: no existing photo waiting after the back-fill; the activity exists as yes/no; a script-filed photo is approved on save and public by every view and by `is_public_drive_file` as anon; a photo filed by a signed-in login that cannot publish is waiting, and a caller-supplied `approved_at` is discarded; the waiting photo is absent from every public view and the proxy, even when set as the profile photo; refused on an appeal; that login cannot approve it or withdraw another's approval; a Medical photo from the same login is approved on save and still not public; approving makes it public, withdrawing removes it again. `check-appeal-medical-photos.mjs` (0216's harness) still returns HARNESS-OK
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive columns and an activity row; the file header lists what a new down-migration would restore (0216/0215/0205/0214/0101 views, 0190's function)
- [x] Production apply plan stated for the release manager — `0217_photo_approval.sql` on `dbkodyyxxhtygxcxmfcu` with the next release. **Run `--status --env production` first and compare the public photo counts before and after**: production has real photos, and the back-fill is what keeps them on the site. `-- consumer:` names the app half, so it can land before that code

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface yet, no code reads these columns or grants the activity
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, approve and withdraw exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the boundaries (waiting vs approved, Medical, adopter's photo, withdrawn approval, appeal attach) are in the §3 harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | attachments | unchanged | n/a — no policy or grant changed |
| management | attachments | unchanged | n/a — as above |
| staff | attachments | unchanged | n/a — as above |
| doctor | attachments | unchanged | n/a — as above |
| volunteer | attachments | unchanged; no card grants `photos.shelter_add`, so nothing new | n/a — no policy or grant changed |
| signed out | public photo views and proxy | the same photos as before; a waiting photo never | `check-public-views.mjs` and the harness (below) |

- [ ] Every role above tested — n/a: no policy and no grant changed; the harness exercised a signed-in login that cannot publish and a script, and anon via `set local role anon`
- [x] A role that should not have access is blocked server-side — a non-publishing login cannot approve a photo or withdraw an approval, and a waiting photo is refused to anon by view and by `is_public_drive_file` (the direct file URL's own question). `check-public-views.mjs` now also checks, against live data, that every waiting photo is refused both ways: `ok Waiting photos: 0 checked, none public by view or by direct file URL`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the manual topic is the app half's
- [ ] Translatable strings go through the translation path — n/a: one activity label added to both dictionaries; no screen shows it yet
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the public views keep their columns, grants and filters except the one added condition; `check-public-views.mjs` and `check-appeal-medical-photos.mjs` pass against dev with 0217 applied; the build gate compiles every reader
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared files touched are the catalogue and dictionaries, each by one added line, and `check-permission-catalogue.mjs` passes
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately not ticked, the app half is outstanding; both items annotated on the `backlog` branch as the brief directs. Searched the backlog for `approved`, `publish`, `shelter_add`, `public_resident_photos`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-17-photo-approval-schema.md` (approval rules, back-fill, appeal interaction, what the app half must do, the plural card name)
- [x] `README.md` still accurate — it does not describe photo columns
- [ ] **Release notes.** — n/a: the schema half is invisible; no volunteer can file a Shelter photo and nobody can approve one until the app half merges
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — view list from reading the latest definition of every view that touches `attachments` and every `is_public_drive_file` branch; behaviour from the harness; the two apply failures are quoted from the runner

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
- [ ] Public pages re-checked after a cache purge — deferred: release manager, who must see the same photos on `/adopt` and a resident page before and after the production apply

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the code that reads it is the app half, which must deploy after `0217` is on production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the back-fill writes one new column
- [x] Apply plan stated — `0217` on production with the next release, with public photo counts compared before and after

### Rollback

- [x] Rollback position stated — code rollback does not revert `0217` and does not need to: older code ignores the columns; but a photo filed after the apply by a non-publisher stays waiting until approved, which only the app half can do. Today nobody can file one, so no photo is stranded

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First dry run: `permission_activities.sort` is unique and 22 was taken | fixed — 65 |
| 3 | low | `lint` exits 1 only on `check-backlog-sections`: `docs/backlog.md` line 908, an open item ("Guard against function-valued props at client boundaries") sits below `## Completed`. It arrived on `main` through the daily backlog merge, not from this branch; eslint itself has 0 errors | deferred — backlog edits go on the `backlog` branch, which this PR may not touch; the item's owner must move it up |
| 2 | high | Second dry run: the back-fill was stopped by the deceased-resident lock, which would have failed the apply on any production photo of a dead animal | fixed — the lock's transaction-local bypass |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface; the production before/after photo counts are the release manager's, in section 8 | |

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
