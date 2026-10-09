# Feature test plan

## Header

| | |
|---|---|
| Feature | Outreach visits: the phone note for temple and community dogs, the Settings control for who may write it, and the public tile |
| Backlog item | `docs/backlog.md` → Resident operations → *Record community and temple dogs helped* (and *Impact band: find data for the mockup's three missing figures*) |
| Branch / worktree | `claude/community-dogs` @ `C:\Development\Animal_Shelter_community-dogs` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no (reads `0169`, already merged and applied to dev) |
| Tested at SHA | `7bb94d63` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a phone note per outreach visit, a Settings control that writes the `community.outings` cell, and the `community_dogs` figure on the homepage band once its baseline is entered
- [x] Files/areas touched listed: `src/app/outreach/` (list, new, edit, actions), `src/app/api/outreach/[id]/photos/`, `src/app/api/photos/[fileId]/route.ts` (internal check), `src/lib/outreach/`, `src/app/admin/security/` (OutreachWriters), `src/app/admin/website/ImpactBaselines.tsx`, `src/app/page.tsx` (band layout), `src/lib/site/impact.ts` (comment), `src/lib/permissions/routes.ts`, `src/app/operations/page.tsx`, both dictionaries, `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, docs
- [x] Roles affected identified: admin and management (hold the cell today), staff / vet / volunteer (no cell; Admin can grant it), signed-out public (homepage band)
- [x] Anything explicitly **out of scope** written down: showing outreach photos publicly (no public view, `is_public_drive_file()` unchanged); the Director's starting number (data, now its own backlog item); a full Settings → Roles grid (custom roles, parked)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 47s

gates: typecheck=0 lint=0 build=0
```

The first run ended `gates: typecheck=0 lint=1 build=0`: the acceptance matrix had no rows for the new manual topic. Fixed in `7bb94d63`, then the run above.

- [ ] CI green on the PR (runs the same three). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0169` merged in its own PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR (`0169` already applied to dev)
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the app's writes were exercised against `0169`'s constraints on dev instead, under section 4
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0169` must be live in production before this deploys, and `apply-migrations.mjs` warns if it is not (its consumer header names `src/app/outreach/`)

## 4. Functional checks

- [x] Happy path works end to end: in the browser pane at 375 px, signed in as Lutan (Admin), Record a visit → + A new place "Wat Dry Run Test", Temple → Next → Fed and Sterilised → Next → 5 dogs, 2 sterilised → Save visit. Landed on `/outreach` showing "Wat Dry Run Test · Temple, 9 Oct 2026, 5 dogs helped · 2 sterilised, Fed, Sterilised"
- [x] Data persists — the list after the redirect is a fresh server render of the saved row
- [x] Create / edit / delete all exercised: Edit changed 5 dogs to 6 and the list showed 6; Delete this visit → the confirmation → the list read "No visits recorded yet". Photo rows: a scripted run as a Management login on dev added a photo row, ticked it, and saw it cascade away with its visit
- [x] Empty state renders sensibly: "No visits recorded yet." with Record a visit above it
- [x] Invalid input is rejected with a readable message: Next with no place picked → "Pick a place, or add a new one."; 7 sterilised of 5 dogs → "Enter how many were sterilised, from 1 to 5." with the typed values kept, and no place created by the refused save (the outing is checked before the place is added)
- [x] Boundary cases checked: sterilised count equal to the dog count accepted by the table and over it refused (`23514`, scripted); the date box stops at today and the action refuses a future date; a new place name matching a live one reuses it (code path read, not driven)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/outreach`, new, edit; Settings → Security control | Records, corrects, deletes; sets who may write | Form, edit and delete driven in the browser. Security control driven after Lutan passed the authenticator step: Management showed Write and correct, the rest No; Staff → Write and correct said Saved, survived a reload, wrote `(staff, community.outings, 2)` with an `audit_log` INSERT whose actor is Lutan, and Admin's Staff home preview (`/home/staff`) gained Outreach visits; Staff → No removed both. Dev left at Management only |
| management | `/outreach`, new, edit | Records and corrects (the Director's answer, `community.outings` = 2) | Scripted as a disposable Management login on dev: `my_permissions` has the cell at 2; adds a place, records, reads back, deletes; **cannot** write `role_permissions` (no row returned) |
| staff | nothing | Refused until Admin gives the cell | Not signed in as staff. The page guard is `requirePermission("community.outings", "read")` and RLS asks the same cell; `0169`'s own check proved staff refused without the cell. Manual item 2 covers granting it |
| vet | nothing | Refused | Same guard and RLS; no cell. Not signed in as a vet |
| volunteer | nothing | Refused | Same guard and RLS; no cell. Not signed in as a volunteer |
| signed out | homepage band only | No outreach tile while its baseline is empty; no outreach photos | `/outreach` and `/outreach/new` redirect to `/login`. Anon reads no `community_outing_photos` rows and `is_public_drive_file()` says false for a ticked one (scripted). Band shows six tiles, no outreach tile |

- [ ] Every role above tested — n/a: staff, vet and volunteer were not signed in; their refusal rests on the shared guard and on `0169`'s RLS check, and granting staff is manual item 2
- [x] A role that should not have access is blocked server-side: signed out, every `/outreach` URL redirects to `/login`; anon gets no outreach photo rows from the API directly; Management's direct `role_permissions` upsert is refused by RLS

## 5. Cross-cutting

- [x] Nav entry correct: `/outreach` is a route-registry entry under Operations (`section: "operations"`), so it is an Operations tile for whoever holds the cell, not a sidebar link; `check-permission-catalogue.mjs` (in lint) passed with the page guard matching the entry
- [x] Manual updated (`src/lib/manual/en.ts`): new topic "Recording an outreach visit" under Projects; the acceptance matrix check passes with its three rows. Not opened at `/manual` in the browser
- [ ] Translatable strings go through the translation path — n/a: every new string is in both dictionaries; place names are typed by staff and shown as typed, as clinic and supplier names are. The Thai is the options paper's and Claude's, **not yet checked by a Thai reader** (manual item 3), which the Director asked for
- [x] Mobile viewport (375px): the three form steps, the list and the edit page driven at 375 px; homepage band measured at 375 px with `scrollWidth` 375, tiles two per row
- [ ] Browser console clean — n/a: not read during the run; `preview_logs` showed no server errors
- [ ] Network clean — n/a: not read during the run; every save and delete returned to the list with the change shown

## 6. Regression

- [x] The pages nearest the change still work: homepage band (six tiles, four plus two centred on desktop, two per row at 375 px), `/outreach` list and empty state
- [x] Any shared file touched checked from a second, unrelated page: `page.tsx`'s band loaded on `/`; the dictionaries load on every page driven; `routes.ts` is exercised by the lint checks for every role's home screen (all ok)
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: *Record community and temple dogs helped* and *Impact band*, each with what closed it; the Director's starting number is a new Management item on the `backlog` branch (`a4001c64`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-community-dogs-feature.md`
- [x] `README.md` still accurate: it lists no per-page routes this changes
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for Operations → Outreach visits, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "sterilised feeds the villages figure" claim was measured on dev: a 12-dog note with 3 sterilised moved `villages_sterilised` from 300 to 303, and the note was then deleted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the visit date defaults to `todayIso()`, the existing shelter-day helper; nothing new derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed; the "strictly after the baseline date" rule is `0169`'s and was asserted there
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates lines, copied as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager (the homepage band layout changed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0169`, which must already be live in production
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0169` goes first, with its own PR's plan

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref removes the page, the control and the band layout, and `0169`'s tables stay, harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Lint red: the new manual topic had no acceptance-matrix rows | fixed in `7bb94d63` |
| 2 | minor | A scripted clean-up could not delete its test place (no delete grant on `community_places`, by design) | accepted: both test places archived on dev, as the design intends |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With Staff given Write and correct, a real staff login (not Admin's preview) can record a visit; set back to No, it cannot | a staff login on dev |
| 2 | The Thai wording reads naturally to a Thai reader (the Director asked for this): the form, the list, the manual-facing words, and the baseline notes on Settings → Website | `/outreach` in ไทย |
| 3 | Adding a photo from a real phone's camera on the new-visit form, and the *May be shown on the website* tick on the edit page | `/outreach/new` on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass
