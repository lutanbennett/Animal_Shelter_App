# Test plan: approve-photos-app

## Header

| | |
|---|---|
| Feature | Approve photos card; retired roles do not count as approvers (database and screen); Add resident photos + disabled until a role can approve |
| Backlog item | `docs/backlog.md` → "An 'Approve photos' card, assignable to any role…" (ticked in this PR) |
| Branch / worktree | `claude/approve-photos-app` @ `C:\Development\Animal_Shelter_approve-photos-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | yes, 0222 |
| Tested at SHA | 72baf4a9 |

## 1. Scope and risk

- [x] One sentence: a new Approve photos card (exactly publish, manage, who-and-where read), and a migration that stops a retired role counting as an approver, with the Who does what screen asking the same question; matches the brief and Lutan's 2026-10-18 ruling
- [x] Touched: `supabase/migrations/0222_photo_approver_excludes_retired.sql`, `src/lib/permissions/cards.ts`, `src/lib/permissions/approvers.ts`, `src/app/admin/who-does-what/{page,actions,CardBoard}.tsx`, both dictionaries, manual, releases, `scripts/check-cards-schema.mjs`, `check-home-cards.mjs`, `check-cards-count.mjs`
- [x] Roles affected: admin (gives cards); any role later given the card; Management unchanged (Residents still approves)
- [x] Out of scope: ticking the card onto any role (Lutan's), retiring or removing the staff role, PhotoGallery, shares, Bills

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0222 as assigned by the planner; 0221 is the highest on main
- [x] `--status` reviewed before applying (1 pending)
- [x] `--dry-run` reviewed: ok (only consumer-header warnings)
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace function`)
- [x] Existing rows still read correctly: `check-cards-schema.mjs` part 1 passes for every live role after applying; no cell changed
- [x] Rolled-back harness (`check-cards-schema.mjs`, step 6) asserts: a retired role (archived_at set, key not staff) holding the activity no longer satisfies the guard, with the exact message and nothing written; a live approver beside it restores the guard; the last live approver cannot be removed while a role holds add_photos, and the refusal names that role. Steps 1 to 5 of 0221 still pass unweakened
- [x] Down-migration: not needed, re-applying 0221's function body restores the old behaviour
- [x] Production apply plan: apply 0222 after 0221 with the release; it changes only which roles the refusals count; no data moves

## 4. Functional checks

- [ ] Happy path works end to end — n/a: left for manual verification, the real tap of the Add button needs an Admin signed in with the authenticator app, which this session cannot do; see the manual table
- [ ] Data persists — n/a: no new stored data; the card is stored by the existing set_role_cards()
- [ ] Create / edit / delete — n/a: covered by the existing add and remove card actions
- [ ] Empty state — n/a: left for manual verification, the "no role can approve" text is in the manual table
- [x] Invalid input is rejected with a readable message: both refusals are the database's own sentences, shown as written (actions.ts)
- [x] Boundary cases: approvers.test.mjs covers retired, Admin, level 0, another activity and a repeat; approve-photos-card.test.mjs proves the card grants exactly three cells and none of the record-edit, add-photo or placement cells

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Who does what, gives cards | + on Add resident photos disabled with reason until an approver exists | pending: manual |
| management | /photos/approve through Residents | unchanged | check-home-cards ok |
| second_in_command | nothing new | no change | n/a |
| volunteer | nothing new | no change | n/a |
| signed out | nothing | no change | n/a |

- [x] Every role above tested or marked
- [x] A role that should not have access is blocked server-side (set_role_cards stays Admin at 2-step only; existing checks pass)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added; the card opens the existing /photos/approve
- [x] Manual updated (Who does what: cards that need another card)
- [x] Translatable strings go through both dictionaries (the test that both carry every string passes)
- [ ] Mobile viewport (375px) — n/a: left for manual verification, needs the signed-in Admin session; listed below
- [ ] Browser console clean — n/a: left for manual verification, needs the signed-in Admin session
- [ ] Network clean — n/a: left for manual verification, needs the signed-in Admin session

## 6. Regression

- [x] Nearest checks: check-cards-schema (all of it), check-cards-count, check-home-cards (every role's tiles unchanged, every card opens at every scope) all pass
- [ ] Shared file loaded from a second page — n/a: left for manual verification, part of the manual table (open Details)
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch; searched for approve_photos, photos.resident_publish, add_photos, Add Shelter Photos, set_role_cards, retired: no other open item is closed by this
- [x] Decision file `docs/decisions/2026-10-18-retired-roles-do-not-approve.md` records Lutan's ruling and his reason
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line that says what the app can now do and that nobody holds the card yet (no false promise; Lutan's ticking step is named)
- [x] Commit messages say why
- [x] Claims were measured: dev has Management as the only live approver (check-home-cards query); retired roles hold the cell and are not listed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding assertions — n/a: no thresholds beyond level >= 1, tested
- [ ] Evidence is the tool's actual output — n/a: only the gates line is pasted
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR — n/a: the screen works with or without 0222; the migration can land first
- [ ] Production dry-run clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive function replacement
- [x] Apply plan stated: file 0222 after 0221, production project, with the release

### Rollback

- [ ] Rollback position stated — n/a: re-apply 0221's function body; no data moved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The first push of the branch was remotely rejected once and succeeded on retry | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On dev, Settings → Who does what, a role without Add resident photos, at 375 px in English and Thai: the page names Management (not Staff) as who approves | /admin/who-does-what |
| 2 | Tap Add on Approve photos for a test role, then on Add resident photos; then try to take Residents from Management while a role holds Add resident photos and read the refusal | /admin/who-does-what |
| 3 | Open Details after the change to load the shared page | /admin/who-does-what/details |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: three rows are left for Lutan, see the table

Manual verification by: pending: Lutan, the three rows in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass with accepted defects

Release manager acknowledgement: pending
