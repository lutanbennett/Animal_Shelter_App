# Feature test plan

## Header

| | |
|---|---|
| Feature | `director-draft-roles`: the Director's first draft of who does what, as data (`src/lib/roles-draft/draft-1.json`), a loader that writes it to `role_permissions` on test (`scripts/load-role-draft.mjs`), an Admin-only review page (`/admin/role-draft`) with a link from `/home/[role]`, and a per-role summary PDF (`scripts/role-draft-pdf.mjs`) |
| Backlog item | `docs/backlog.md` → "Apply the Director's first draft of who does what" — **deliberately not ticked**: it is done when she has looked at each role on test and signed or marked changes |
| Branch / worktree | `claude/director-draft-roles` @ `C:\Development\Animal_Shelter_director-draft-roles` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-05 |
| Carries a migration? | no (a role's cells are rows since `0132`) |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `origin/main` @ `7c5265cd` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: her ticks are loaded into the 2IC, Head of Maintenance, Head of Medical, volunteer and vet cells on test only, with the diff printed and a plain-words page to look at each role; production is not touched
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/lib/roles-draft/` (new), `src/app/admin/role-draft/page.tsx` (new), `src/app/home/[role]/page.tsx` (one link), `scripts/load-role-draft.mjs`, `scripts/role-draft-pdf.mjs`, `docs/roles/` (the scan and the blank sheet), `docs/decisions/2026-10-05-director-draft-roles.md`. No migration, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **on the test database** the 2IC, Head of Maintenance, Head of Medical, volunteer and vet cells changed (46 cells: 30 gained, 15 lost, 1 level); admin sees the new page; management, staff and public unchanged. Nothing changes on production
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: production; extending `/home/[role]` to menus and per-page buttons (the second half of the Director's preview choice); the four unclear marks (loaded as no); changing `jobs.ts`, the role checks or the catalogue's `requires` to match the draft

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (it brought `0146` and `rota-eligibility`, already applied to test)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (run on the synced tree). Closing lines, as printed:

  ```
  === gates: build exited 0 after 65s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration (`--status` run anyway: 146 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration; the loader is, a second `--apply` reports `Nothing to write.`
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the loader replaced cells on five roles and the Settings matrix and `/home/[role]` read them
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration. What the loader did: 46 cells written in one transaction; `role_permissions_guard` accepted every level; `audit_log` gained exactly 46 `role_permissions` rows
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; the earlier cells are printed in the loader's before→after and are restored by loading a draft that holds them
- [ ] Production apply plan stated for the release manager — n/a: nothing applies to production in this PR; applying the approved draft there is its own step, after she signs

## 4. Functional checks

- [x] Happy path works end to end: dry run prints the diff, `--apply` wrote it, `/admin/role-draft` and `/home/<role>` render for an Admin (driven by `check-phone-width.mjs`'s throwaway admin login, no warnings)
- [x] Data persists — reload the page and the change is still there: a second `--apply` after the first printed `0 cells change` and `Nothing to write.`
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no user-facing create/edit/delete; the loader inserts, updates and deletes cells (all three in the 46)
- [ ] Empty state renders sensibly (no rows yet) — n/a: a role with no draft cells shows "Nothing on the sheet."
- [x] Invalid input is rejected with a readable message, not a crash: `cellsFor` throws on an unknown row, a row that is not a cell, an unknown key, or a tick whose level does not suit the activity's kind; `--env production` without `--allow-production` exits 2 with a reason and sends nothing
- [x] Boundary cases checked: a tick at read and another at edit on one activity merges to the higher (rows 1 and 2 on the 2IC); an implied read is not added where the role already holds the cell

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/role-draft`, `/home/<role>` | opens | opens (phone-width run) |
| management | `/admin/role-draft` | refused | not exercised as a session; the page's guard is `loadPermissions()?.isAdmin` then `refuseFor`, the same as `/home/[role]` |
| staff | `/admin/role-draft` | refused | as above |
| vet | `/admin/role-draft` | refused | as above |
| volunteer | `/admin/role-draft` | refused | as above |
| signed out | `/admin/role-draft` | redirected to `/login` | as above, by the guard's first line |

- [ ] Every role above tested — n/a: only admin was signed in; the others share one guard line copied from `/home/[role]`, which has its own checks
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: see above; listed under Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; reached from a link on `/home/[role]`
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a review aid that goes when the draft is signed, not a feature for the shelter's people
- [ ] Translatable strings go through the translation path — n/a: English only on purpose, one reader (decision file)
- [x] Mobile viewport (375px) — no overflow, controls reachable: `check-phone-width.mjs --roles=admin --locales=en,th --pages=/admin/role-draft,/home/second_in_command,/home/head_of_medical`: `6 page view(s) measured … No page scrolls sideways.`
- [x] Browser console clean — no errors or React warnings: no warning from the run above
- [ ] Network clean — n/a: server-rendered, no client requests

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/home/second_in_command` and `/home/head_of_medical` rendered in both languages; `node scripts/check-home-screens.mjs` all ok after the load
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the one shared file, `/home/[role]/page.tsx`, gained a link and was loaded above
- [x] Nothing merged from `main` during `sync` was broken by this branch: `check-recurring-job-eligibility.mjs` "Every case held" after the load
- [x] **Parity moved, as the brief expected.** `check-permission-parity.mjs`: before the load `RESULT: GREEN`, after the load `RESULT: RED` with 27 layer-1 mismatches, every one on an activity the draft changed (visit.book, medical.\* , resident.record, resident.adoption_news, photos.resident_add, recurring.do_own, assistant.ask) and a role the draft changed. No unexplained delta. `check-permission-catalogue`, `check-policy-role-names`, `check-home-screens` stay green. Red on test, and meant to be: `check-medical-role` (6), `check-maintenance-role` (1), `check-2ic-role` (3), `check-volunteer-narrowing` (4: a volunteer may now record a recurring job, because the cell exists), `check-permission-tables` (cell counts). They assert the previous cells; not to be "fixed" until she decides

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately left open until the Director has looked; a status note goes on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `docs/decisions/2026-10-05-director-draft-roles.md`
- [x] `README.md` still accurate: it does not describe role loading
- [ ] **Release notes.** n/a: test site only and Admin only; no shelter user sees any of it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 46 cells and 46 audit rows, the 27 mismatches and the red checks are the scripts' output. Reasoned and worded as such: that the implied reads added no cell because every role already held them (the dry-run diff shows no implied line)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: Lutan (the review page is only on the deployed test site once this is deployed; the cells are already on the dev database)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary logic beyond the read/edit merge checked in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR for the code. The cells on test are not reverted by it; load a draft that holds the old cells (the loader's before column is the list). Production is untouched either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Loaded as ticked, the Head of Medical loses the medication list, diet and photo tiles (her sheet has no prescriptions or "view residents" tick), the volunteer loses the residents list (row 1 is a dot), and a vet is left with only the microchip | accepted: these are the draft's consequences, shown on the review page for the Director to judge; each is in the decision file |
| 2 | Low | Five checks go red against the test database because they assert the previous cells | accepted: expected, listed in §6; they are the before-picture until she decides |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The Director looks at each role** (2IC, Head of Maintenance, Head of Medical, volunteers, vets) on the review page and `/home/<role>`, on her phone, and signs the draft or marks changes. **This is what the backlog item is done on.** | `test.lannacare.org/admin/role-draft`, as the Director |
| 2 | Lutan rules on the four marks that were not ticks (volunteers row 1, 2IC rows 11 and 39, Head of Medical row 49), now loaded as no | the scan in `docs/roles/` |
| 3 | The per-role summary PDF on the Desktop opens and reads well, with its "Change?" boxes | `Lanna Care - who does what, draft 1 by role.pdf` on the Desktop |
| 4 | Signed in as management, staff, a vet and a volunteer, `/admin/role-draft` is refused | test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 4 wait for a person

Manual verification by: pending: the Director's look at each role on test (item 1), Lutan's ruling on the four marks (item 2), and a person opening the pages (items 3 and 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
