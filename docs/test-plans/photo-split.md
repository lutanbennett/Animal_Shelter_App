# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Photo split (`0152`): the last role-named policies converted; publishing a resident photo is its own cell, enforced in the database |
| Backlog item | `docs/backlog.md` → Security: a vet's "Medical folder only" for photos is enforced by the app, not the database; foundation 3 (database half only) |
| Branch / worktree | `claude/photo-split` @ `C:\Development\Animal_Shelter_photo-split` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | yes, `0152` |
| Tested at SHA | tip of `claude/photo-split` at the time of the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `attachments`, `maintenance_photos` and `project_photos` answer through `has_permission()`, and a non-Medical resident photo is filed only by a login that holds `photos.resident_publish`
- [x] Files/areas touched listed: `supabase/migrations/0152_perm_convert_photos.sql`, `src/app/residents/[id]/photos/actions.ts`, `src/components/PhotoUploader.tsx`, both dictionaries, `src/lib/releases.ts`, `scripts/check-perm-convert-photos.mjs` (new), `scripts/lib/permission-probes.mjs`, `scripts/check-policy-role-names.mjs`, three older role harnesses, `docs/roles-and-permissions.md` §15, `docs/decisions/2026-10-07-photo-split.md`
- [x] Roles affected identified: admin, management, staff unchanged; a vet can no longer file outside Medical by a hand-made request; the Head of Maintenance and 2IC (draft cell `maintenance.photos`) now reach job photos; volunteer unchanged (already narrowed by `0134`)
- [x] Out of scope written down: per-photo "shown on the website" state and a separate publish action (backlog), the vet policies (Vet is last), the app's `assertPhotoWriteAccess` (foundation 3 app sweep)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 176s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0151`), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change: parity 1,910 match / 24 known / 21 mismatch before and after, same 21 mismatch lines (all vet, on purpose)
- [x] Constraints exercised against real rows in a rolled-back harness: `check-perm-convert-photos.mjs`, 457 checks under 16 principals' own JWTs, including a vet's `record_attachment` into Shelter refused and a vet's direct insert/update into Shelter refused
- [ ] Down-migration written — n/a: the undo is in the file header (drop the `*_perm` policies and guards, re-create the `0001`/`0039` policies and the `0134`/`0140` functions); nothing is dropped that cannot be re-created
- [x] Production apply plan: apply `0152` to production from the main checkout (`--dry-run` first), before or with the deploy; behaviour-preserving for admin, management and staff

## 4. Functional checks

- [x] Happy path works end to end: staff opens a resident's Photos tab, picks Shelter and the page says it can appear on the public website, picks Medical and it says it never will (driven in a browser on :3001 as a throwaway staff login; 0 console errors)
- [ ] Data persists — n/a: no new stored data in the UI; the database side is the harness
- [x] Create / edit / delete all exercised: insert, caption, refile, delete per principal in the harness
- [ ] Empty state — n/a: no list or empty state changed
- [x] Invalid input is rejected with a readable message: "This login can add photos to the Medical folder only."
- [x] Boundary cases checked: Medical case and spacing, no folder, an adopter's dated folder, a role holding `medical_only` with publish

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all photo tables, all folders | everything | held (harness) |
| management | same | everything | held (harness) |
| staff | same | everything | held (harness) |
| vet | own clinic's resident photos | Medical only; Shelter refused for insert, update and `record_attachment` | held (harness) |
| volunteer | none | nothing | held (harness) |
| signed out | none | nothing | held (no policy for anon) |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: the harness runs as each login's own JWT against the tables and functions

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic describes the folder picker in a way that changed
- [x] Translatable strings go through the dictionary: two new strings in `en.ts` and `th.ts`
- [ ] Mobile viewport — n/a: one line of hint text under an existing select; not measured at 375px
- [x] Browser console clean on the Photos tab
- [x] Network clean — no 4xx/5xx seen during the browser run

## 6. Regression

- [x] Nearby pages: `/residents/<id>/photos` loaded as staff. `check-public-views`, `check-home-screens`, `check-role-write-policies`, `check-volunteer-narrowing`, `check-medical-photos`, `check-adoption-updates`, `check-vet-own-clinic-writes` all exit 0
- [x] Shared files touched (`releases.ts`, both dictionaries) checked by loading the Photos page that uses them
- [x] Nothing merged from `main` during `sync` (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (the vet folder guard). Foundation 3 deliberately not ticked: the app guards remain
- [x] Decisions recorded in `docs/decisions/2026-10-07-photo-split.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line about the folder picker saying whether a photo goes on the website
- [x] Commit messages say why, not just what
- [x] Claims were measured: parity compared by diffing the mismatch lines; harness counts quoted from its output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [x] This PR contains a migration and a small app change (`movePhotoToFolder` asks `photos.resident_manage`); the migration is behaviour-preserving for the current app, so production apply before the deploy is the safe order
- [ ] `--env production --dry-run` — deferred: Lutan, from the main checkout
- [ ] Destructive migration backup — n/a: additive and re-creatable, nothing destructive
- [x] Apply plan stated: `0152`, production project, before the deploy

### Rollback

- [x] Rollback: the file header's undo; code rollback is `deploy-pi.sh --ref <sha>`. Neither reverts the migration, which is safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Head of Maintenance and 2IC now reach job photos through the draft's `maintenance.photos` cell (`0141` had not meant to give it) | accepted, named in the decision for the Director to confirm |
| 2 | Low | A role that manages but cannot publish can edit only Medical-folder rows | accepted, no such role in the agreed draft |
| 3 | Info | `check-maintenance-role` bundle, `check-medical-role`, `check-2ic-role`, `check-medical-jobs` still red on medication/diet_types and cells lines | accepted, not caused by this change (no photo table involved) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Management on a real resident, add a photo to Shelter and to Medical, refile one, choose a profile photo, remove one, and read the hint under the folder picker | `/residents/<id>/photos` on port 3001 |
| 2 | Whether the Head of Maintenance and 2IC should hold `maintenance.photos` | Roles draft |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are listed and a person has not yet looked

Manual verification by: pending: Lutan to try items 1 and 2 above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defects 1 to 3 are accepted above and await the manual items
- [ ] Checklist pasted into the PR — n/a: pasted into the PR description once it exists
- [ ] Handed to the production release manager — n/a: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
