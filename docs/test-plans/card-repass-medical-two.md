# Test plan: card-repass-medical-two

## Header

| | |
|---|---|
| Feature | Card re-pass: `view_medical` (13 steps) and `add_medical_photos` (6) driven in a browser after `0276`, `0278` and `0279`; one control gate fixed on the resident's Clinic Visits tab |
| Backlog item | `docs/backlog.md` → the re-pass item (addendum added; already ticked) |
| Branch / worktree | `claude/card-repass-medical-two` @ `C:DevelopmentAnimal_Shelter_card-repass-medical-two` |
| Dev server | `next dev` on port 3002, stopped before the gates ran. Each login made with `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | d80f4727 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two cards driven as logins holding only that card, every walkthrough step, findings recorded, and one control gate (inside those cards) fixed
- [x] Files/areas touched listed: `src/app/residents/[id]/[section]/sections/clinic-visits.tsx` (four links gated), `src/lib/releases.ts` (one note), `docs/card-access-faults.md` (one heading appended), `docs/decisions/2026-10-29-card-repass-medical-two.md`, `docs/backlog.md` (addendum), this plan. No migration
- [x] Roles affected identified: none by name; the change follows the cards `medical.blood_tests`, `medical.prescriptions`, `medical.weight` and `medical.procedures`
- [x] Out of scope written down: the unexplained empty Medical photos on the Photos tab and the stale words on `/medical/photos` (both recorded, not fixed), the generated walkthrough, `src/app/adopt/`, every `scripts/check-*.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 195s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

Two card-only logins were driven on the dev project in the built-in browser, aal1; no page asked for the second step. Results are in `docs/card-access-faults.md` and `docs/decisions/2026-10-29-card-repass-medical-two.md`.

- [x] Happy path works end to end: every `view_medical` page opened with nothing to add or edit (after the fix), and a photo was filed as `add_medical_photos`; both refused pages went to `/no-access`
- [x] Data persists: the filed photo was read back with a service-key query (one `attachments` row, `sub_folder` Medical, approved)
- [ ] Create / edit / delete all exercised — n/a: an access review; only the one add (the photo) exists in these cards
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input changed
- [ ] Boundary cases checked — n/a: no input changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: gate follows cards, not roles |
| management | nothing new | no change | n/a: gate follows cards, not roles |
| staff | nothing new | no change | n/a: gate follows cards, not roles |
| doctor | nothing new | no change | n/a: gate follows cards, not roles |
| volunteer | nothing new | no change | n/a: gate follows cards, not roles |
| signed out | nothing new | no change | n/a: gate follows cards, not roles |

- [ ] Every role above tested — n/a: the change follows cards, and each card was tested on a login holding only it
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed; `/medical/photos` and `/maintenance` were opened directly and went to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: four links disappear for a login that was refused on them anyway; no topic describes them
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: driven at the pane's width; no layout changed
- [ ] Browser console clean — n/a: the console was not read
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work: the Clinic Visits tab re-driven after the fix (visits still open), and the other five medical tabs
- [ ] Any shared file touched checked from a second page — n/a: the file is a section renderer used only by the resident hub tab
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` had nothing new to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: already ticked; an addendum records this second pass
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-29-card-repass-medical-two.md`
- [x] `README.md` still accurate: nothing it describes changed
- [x] **Release notes.** `unreleased` gained a line, tagged `view_medical`: the four links on the Clinic Visits tab now follow the login's cards
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The unexplained empty Photos tab is labelled "not diagnosed"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only evidence is the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this change
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this change
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the four links; nothing else is affected, no migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Medical-folder photo does not show on the Photos tab for a `view_medical` login (not diagnosed); recorded in the fault log | deferred to backlog |
| 2 | low | `/medical/photos` words for `add_medical_photos` are stale after `0279`; recorded | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the Clinic Visits tab as a login holding only `view_medical`: only the visit links should appear | `/residents/<id>/clinic-visits` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; one item is outstanding and is carried as `pending:` on the signature line below

Manual verification by: pending: the one item under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: no migration; rides the next release

Result: pass with accepted defects

Release manager acknowledgement: n/a: rides the next release
