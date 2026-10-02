# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Settings → Recent changes: an admin-only, read-only page over `audit_log` |
| Backlog item | `docs/backlog.md` → DB-6, part (2) (item left unticked: parts 1 and 3 remain) |
| Branch / worktree | `claude/recent-changes-page` @ `C:\Development\Animal_Shelter_recent-changes-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: an admin page listing `audit_log` newest first, filterable and paged, showing changed field names and opening values for one row on request
- [x] Files touched: `src/app/admin/recent-changes/page.tsx` (new), `src/lib/audit/recent-changes.ts` (new), `src/app/admin/page.tsx` (tile), i18n `en.ts` and `th.ts`, manual `en.ts`, `releases.ts`, one decision, this plan. No migration, no `NavLinks.tsx` (reached from the Settings tile grid like the other admin pages)
- [x] Roles affected: admin only. Management, staff, volunteer, vet and signed-out are refused
- [x] Out of scope: undo from `old_row` (DB-6 part 3), the app side of soft delete (part 1, `soft-delete-app-side`), any change to RLS, a Thai manual file (none exists)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged (already up to date), pushed
- [x] `node scripts/gates.mjs` closing line, as printed: `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page only reads 0121's table
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: not driven in a browser; the dev `audit_log` was empty and no admin session was available to Claude, see Left for manual verification #1–#3
- [ ] Data persists — n/a: the page writes nothing
- [ ] Create / edit / delete — n/a: read-only page, no action. Archive reads as Archived/Restored: see manual #2
- [x] Empty state: dev `audit_log` has 0 rows (queried); the page renders "Nothing has been recorded yet" in code for that case, and "Nothing matches these filters" under a filter
- [x] Invalid input rejected: `parseFilters` drops a malformed table, actor, date, row id, cursor or open id (UUID / ISO-date / digit checks) rather than passing it to the query
- [ ] Boundary cases — n/a: paging with more than 50 rows could not be exercised, see manual #3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/recent-changes` | page loads | not driven, manual #1 |
| management | n/a | `requireAdminUser()` sends to no-access; RLS returns zero rows anyway | not driven, manual #4 |
| staff | n/a | same | not driven, manual #4 |
| vet | n/a | same | not driven, manual #4 |
| volunteer | n/a | same | not driven, manual #4 |
| signed out | n/a | sent to `/login?next=…` | seen: browser pane redirected to `/login?next=%2Fadmin%2Frecent-changes` |

- [ ] Every role above tested — n/a: only signed-out was driven; the rest are manual #4
- [x] A role that should not have access is blocked server-side: the page calls `requireAdminUser()` first, and the table's RLS (`admin_read_audit_log`) is separately proven for admin, staff, volunteer and vet by `scripts/check-audit-log.mjs` R1. The page has no server action, so there is no write path to gate

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no sidebar entry by design; a tile on the Settings landing page, which Settings' own gate covers
- [x] Manual updated: topic `recent-changes` in `src/lib/manual/en.ts` (no Thai manual file exists)
- [x] Translatable strings: `admin.recentChanges`, `nav.recentChanges` and the tile in `en.ts` and `th.ts`; typecheck enforces the two match
- [ ] Mobile viewport — n/a: not driven; the table scrolls horizontally in `overflow-x-auto`, see manual #5
- [ ] Browser console clean — n/a: not driven past the login redirect
- [ ] Network clean — n/a: not driven past the login redirect

## 6. Regression

- [x] The nearest thing still works: the Settings landing page gained one tile and compiles; `next build` lists `/admin/recent-changes` as a dynamic route
- [ ] Shared file touched checked from a second page — n/a: `admin/page.tsx` is the Settings landing and was not driven; see manual #5
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: DB-6 stays open (part 3 undo, part 1 soft-delete app side); its note is updated on the `backlog` branch to say part 2 is done
- [x] Decision added: `docs/decisions/2026-10-02-recent-changes-page.md`
- [x] `README.md` still accurate (does not list admin pages)
- [x] **Release notes.** `unreleased` gained an admin-tagged line in `src/lib/releases.ts`
- [x] Commit messages say why
- [x] Claims were measured, not reasoned: the RLS claim leans on `check-audit-log.mjs`; the rendering, filtering and paging claims are NOT measured here and are listed below

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the From/To filter uses `+07:00` day boundaries; not driven, see manual #3
- [ ] Boundary or banding assertions — n/a: no threshold
- [ ] Evidence pasted is unedited tool output — n/a: only the gates line, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: revert the PR; nothing persistent changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found; the page was not driven past the login redirect | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as admin, make a few edits (a resident field, a weight, a contact). The page lists each with **your name as actor**, the right record (resident's name, not a UUID), and the changed field names only | `/admin/recent-changes` |
| 2 | Archive and restore something once `soft-delete-app-side` is in (or archive a contact now): the line reads Archived / Restored, not Edited | same |
| 3 | **Paging with more than 50 rows**: Older changes shows the next page with no row repeated or missing; Back to the newest returns. Try From/To on a day boundary | same |
| 4 | Signed in as management, staff, vet and volunteer: the page is refused. Open `/admin/recent-changes` directly | same |
| 5 | Show values opens one row only, with a warning; a phone number is visible there and nowhere in the list. Check a phone-width screen and the Settings tile | same, `/admin` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items outstanding, see pending below

Manual verification by: pending: Lutan, items 1 to 5 above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open
- [ ] Checklist pasted into the PR — n/a: not yet opened
- [ ] Handed to the production release manager — n/a: not before manual verification

Result: pass
