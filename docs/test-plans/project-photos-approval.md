# Feature test plan

## Header

| | |
|---|---|
| Feature | project-photos-approval |
| Backlog item | `docs/backlog.md` → #k7v2p |
| Branch / worktree | `claude/project-photos-approval` @ `C:\Development\Animal_Shelter_project-photos-approval` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-05 |
| Carries a migration? | yes (0316) |
| Tested at SHA | @@SHA@@ |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a photo filed in a public project folder now waits for approval (new Project photos tab) before the public website, and the file proxy, show it.
- [x] Files/areas touched listed: `supabase/migrations/0316_project_photos_approval.sql`, `src/lib/photos/approval.ts`, `src/app/photos/approve/{page.tsx,actions.ts,ProjectPhotoQueue.tsx}`, `src/lib/i18n/dictionaries/{en,th}.ts`, `docs/hard-coded-security-registry.json`, decision file, backlog tick.
- [x] Cards affected identified: any card carrying `photos.approve` (`approve_photos`, `approve_website`) gains the Project photos tab; holders of `projects.photos` now file photos that wait. Admin sees everything via the short-circuit; the signed-out public sees only approved photos.
- [x] Out of scope written down: no change to resident, event or adoption photo paths; no card added; the portal remainder (#7j2qf) is batch 2's.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code 0:

@@GATES@@

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0315), and no other in-flight branch carries one (this batch's only one)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, `alter policy`, idempotent grants)
- [x] Existing rows still read correctly after the change: zero project attachments had `approved_at is null` before a seeded row, so nothing public disappeared
- [x] Constraints exercised against real rows: a seeded project image inserted by service role was stamped approved, set to waiting, absent from `is_public_drive_file()` (false); after the approver pressed Approve it was stamped with `approved_by` and the proxy answered true; a login without approval could neither read nor update the waiting row (zero rows, row unchanged). Each row used its own distinct fake drive id.
- [x] Down-migration: not written. Restoring 0109's and 0056's view bodies and 0312's stamp would be the undo; nobody should want unreviewed photos public again
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for 0316 before the deploy

## 4. Functional checks

- [x] Happy path works end to end (waiting photo appears on the tab, Approve works)
- [x] Data persists: the database row showed the approval after the page action
- [x] Create / edit / delete all exercised — Approve was pressed; Remove copies the event queue's shape and was not pressed
- [x] Empty state renders sensibly (the tab renders nothing when no photo waits, as the event queue does)
- [ ] Invalid input is rejected with a readable message — n/a: the actions take only ids chosen from the page
- [ ] Boundary cases checked — n/a: no free text or numeric input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | outside the card system | not driven; short-circuit unchanged |
| exactly `approve_photos` | /photos/approve | Project photos tab with Approve and Remove; approval sticks | pass |
| exactly `view_residents` | /photos/approve | no page; database refuses the write | pass (zero rows updated, row unchanged) |
| signed out | public views | waiting photo absent | pass (proxy false while waiting) |

- [x] Every login above tested (admin not driven, reason in the table)
- [x] A login that should not have access is blocked server-side (direct REST update refused with zero rows)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the page already existed; only a tab was added
- [ ] Manual updated — n/a: no manual text names project photos
- [x] Translatable strings: en and th added; Thai not checked by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: reuses the event queue's layout classes unchanged
- [x] Browser console clean: no errors seen driving the tab
- [x] Network clean: no unexpected 4xx/5xx on the page

## 6. Regression

- [x] The pages nearest the change still work: /home (tile counted waiting photos), /photos/approve other tabs rendered
- [x] Shared files touched (dictionaries, approval.ts) loaded from a second page (/home)
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-05-project-photos-approval.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: migration 0316 must be applied on production before a user sees any change, as with 0315's note; the line goes in the release that applies it
- [x] Claims in the decision file were measured on dev, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing date-derived
- [ ] Boundary or banding change — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: the gate lines above are pasted from the run
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code together — deferred: release manager, apply 0316 to production before the deploy
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive views, policies and a trigger body
- [ ] Apply plan stated — deferred: release manager, 0316 on the production project before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; the schema is safe to leave, a code rollback just hides the tab

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `public_projects` also leaked waiting photos (cover, count) | fixed in 0316 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the Project photos tab | /photos/approve in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Thai wording

Manual verification by: pending: Thai wording needs a Thai speaker

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: PR not yet open
- [ ] Handed to the production release manager — n/a: the release manager picks it up from the PR

Result: pass

Release manager acknowledgement: n/a: given at release time
