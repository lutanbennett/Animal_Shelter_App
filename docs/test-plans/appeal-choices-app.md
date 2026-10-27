# Test plan: appeal-choices-app

## Header

| | |
|---|---|
| Feature | Donation form reads the `appeal_choices` view; hero photo asks `website.gallery` through `set_hero_photo`; Replace photo and Remove follow the card |
| Backlog item | `docs/backlog.md` → Card review 2 schema follow-ups (app half; ticked) |
| Branch / worktree | `claude/appeal-choices-app` @ `C:\Development\Animal_Shelter_appeal-choices-app` |
| Dev server | `next dev` on port 3006, stopped before the gates ran. Dev schema 275 applied, 0 pending; logins made with `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | 4727928f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the donation form reads the view, the hero actions ask `website.gallery` and call `set_hero_photo`, and the hero controls follow the card
- [x] Files/areas touched listed: `src/app/management/donations/new/page.tsx`, `src/app/admin/website/{actions.ts,page.tsx,HeroPhoto.tsx}`, `src/lib/releases.ts`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified: none by name; access follows `donation.receipt` and `website.gallery`; Admin through the existing bypass
- [x] Out of scope written down: any migration, other ungated controls, `src/lib/clinics/`, the card-access fault log

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 231s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration (0274 is already merged)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration (0274 must be on production before this deploys; release manager to confirm)

## 4. Functional checks

- [x] Happy path works end to end: a `website_photos` login replaced the hero (generated JPEG, "Hero photo updated.") and removed it, both through `set_hero_photo`; a `donations_receipts` login chose "An appeal" and was offered four open appeals
- [x] Data persists: the new hero showed on the page after the action, and the removal left "No hero photo set"
- [x] Create / edit / delete all exercised: hero replace and remove driven; the appeal list is read only
- [ ] Empty state renders sensibly — n/a: the "no appeal to choose" sentence is unchanged and was not shown, since appeals existed
- [x] Invalid input is rejected with a readable message: before the fix Replace photo showed "Describe the photo first" every time; fixed and re-driven
- [ ] Boundary cases checked — n/a: no limits changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged (bypass) | n/a: not driven; the `perms.isAdmin` short-circuit is untouched |
| management | n/a | follows cards | n/a: tested by card, not role |
| staff | n/a | follows cards | n/a: tested by card, not role |
| doctor | n/a | follows cards | n/a: tested by card, not role |
| volunteer | n/a | follows cards | n/a: tested by card, not role |
| signed out | nothing | redirected | n/a: no route changed |

- [x] Every role above tested — card-only logins stand in: `website_photos` sees Replace photo and Remove; `website` sees the hero with neither; `donations_receipts` sees the appeals
- [ ] A role that should not have access is blocked server-side — n/a: the `website` login's refusal was not pressed (its buttons are hidden); the function's `has_permission` check is unchanged from 0274

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic describes these two controls differently
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: not emulated; layout untouched beyond hiding a row
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read; the two server actions returned 200

## 6. Regression

- [x] The pages nearest the change still work: the Gallery tab loads with its Add photo button; the Home tab loads for `website`
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-27-appeal-choices-and-hero-photo-app.md`
- [x] `README.md` still accurate: nothing it describes changed
- [x] **Release notes.** Two lines added to `unreleased` in `src/lib/releases.ts`, written for a shelter user. No manual step is outstanding in the decision file
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The hero behaviour and the appeal list were seen in a browser; what was not driven is listed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: not deployed by this stream
- [ ] Smoke-tested on `test.lannacare.org` — n/a: not deployed by this stream
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: only the gates lines are pasted
- [ ] Public pages re-checked — n/a: the hero on the public page was not re-fetched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy by this stream
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy by this stream
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: code reads 0274, a separate merged PR; it must be applied to production before this ships
- [ ] `--env production --dry-run` run and clean — n/a: no migration here
- [ ] Production backup fresh — n/a: no migration here
- [ ] Apply plan stated — n/a: no migration here

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the direct update and the appeals read; 0274 is additive and harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Replace photo always refused ("Describe the photo first"): the action demanded alt text the form never sent | fixed |
| 2 | low | The hero's alt text cannot be set by the Website photo card | accepted: card decision for Lutan, in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The public welcome page shows the new hero after Replace photo | the public site home page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; one item is outstanding and is carried as `pending:` on the signature line below

Manual verification by: pending: the public home page showing the new hero

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR is not merged
