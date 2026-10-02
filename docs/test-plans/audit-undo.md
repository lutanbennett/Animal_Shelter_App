# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Undo on Settings → Recent changes: put back the newest edit or hard delete of a record from `audit_log.old_row` |
| Backlog item | `docs/backlog.md` → Security: Audit trail and soft delete (DB-6), part (3); ticked, DB-6 complete |
| Branch / worktree | `claude/audit-undo` @ `C:\Development\Animal_Shelter_audit-undo` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (not driven: see Left for manual verification) |
| PR | linked from the PR itself |
| Tested by / date | Claude (audit-undo session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `d59cb38` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an admin can undo the newest edit (changed fields written back) or hard delete (row put back) of a record on Recent changes, refused when the record has changed since, and the undo is itself logged
- [x] Files/areas touched listed: `src/app/admin/recent-changes/` (page, `actions.ts`, `UndoButton.tsx`), `src/lib/audit/undo.ts` (new), `src/lib/audit/recent-changes.ts` (helpers exported), both i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-audit-undo.mjs` (new harness), docs. No `worker/`, no `supabase/`
- [x] Roles affected identified: admin only (the page and `audit_log` are admin-only); every other role cannot see the page or the table
- [x] Out of scope written down in `docs/decisions/2026-10-02-audit-undo.md`: undo of archive/restore (the record's own Restore), of an add, of a resident delete, and of anything on files; no "Undone" label in the list (needs a schema marker)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date." before the last push
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 47s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (`audit_log.old_row` is the mechanism)
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, no column touched
- [x] Constraints exercised against real dev tables in a `begin … rollback` harness, `node scripts/check-audit-undo.mjs`, as an admin under the real RLS. Output as printed: `HARNESS-OK A: edit undo applies and is logged as a new UPDATE by the admin | B: weight, vaccination, prescription, contact and visit go back identical, logged as INSERT by the admin | C: a taken day refuses with 23505, an archived one does not | D: a row whose visit is gone refuses with 23503 | E: resident image has no chip number; staff read no audit rows`. B compares the whole row to its before-image, not a few columns
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The database half is exercised by the harness above. The app half (the server action's latest-change check, the race guard, the button and its refusal text) is covered by typecheck, lint and build only; no browser session was driven (see Left for manual verification).

- [x] Happy path works end to end — for the database writes only: the harness's edit undo and five delete undos. The button-to-action path was not driven
- [x] Data persists — the harness reads the rows back after each undo and compares them (B)
- [x] Create / edit / delete all exercised (whichever the feature has): edit undo (contact), delete undo (weight, vaccination, prescription, contact, visit)
- [ ] Empty state renders sensibly — n/a: the page's empty state is unchanged; Undo adds nothing to an empty list
- [x] Invalid input is rejected with a readable message, not a crash: a taken day (23505) and a missing visit (23503) refuse in the harness; the action maps both, 23514 and 42501, to written sentences, and anything else to a reference. The mapping was read, not run
- [x] Boundary cases checked: slot taken then freed by archiving the other row (C); resident delete image carries no chip number (E); the changed-columns-only write for an edit leaves excluded columns alone by construction

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Recent changes, Undo | sees the log and can write back through RLS | harness A/B/C/D: writes accepted |
| management | nothing here | page redirects; table returns no rows | not driven; E shows a non-admin reads no rows |
| staff | nothing here | page redirects; table returns no rows | E: staff `audit_log` read returned no rows |
| vet | nothing here | as staff | not driven; covered by `check-audit-log.mjs` R1 |
| volunteer | nothing here | as staff | not driven; covered by `check-audit-log.mjs` R1 |
| signed out | nothing here | redirected to sign-in | not driven |

- [x] Every role above tested — only partly: admin and staff by the harness; the rest by the existing `check-audit-log.mjs` assertions, not rerun here. The action also calls `hasAdminRole()` itself
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven; the table's RLS and the action's own admin check are the server side, and E shows RLS returns nothing to staff

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change (the page already exists)
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Who changed what"); read as text, not loaded at `/manual`
- [x] Translatable strings go through the dictionary: English and Thai added together (`t.admin.recentChanges.undo`); not checked at `/management/translations`
- [ ] Mobile viewport (375px) — n/a: not driven; the button is inline text in an existing table cell
- [ ] Browser console clean — n/a: no browser session driven
- [ ] Network clean — n/a: no browser session driven

## 6. Regression

- [x] The pages nearest the change: Recent changes still type-checks and builds with the new cell; the existing list, filters and detail panel code is untouched apart from one added line. Not loaded in a browser
- [ ] Shared file touched checked from a second page — n/a: `en.ts` (i18n), the manual and `releases.ts` were edited; the build renders every route and passed, but no second page was loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync found nothing to merge, and gates pass on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-02-audit-undo.md`: the five answers (changed since, undo is logged, which types, who, collisions)
- [ ] `README.md` still accurate — n/a: it does not describe Recent changes or undo
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for admins describing Undo
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the actor, the INSERT/UPDATE rows, the 23505/23503 refusals and the missing chip number are harness output. "Timestamps would cause a false refusal under PostgREST's comparison" is a reason for skipping them in the race guard and was not measured

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic is added
- [ ] Boundary assertions cover both edges — n/a: the boundary is "newest change to the row", checked by equality of ids, and the slot-taken case is asserted both ways in C
- [ ] Evidence pasted is the tool's actual output — n/a: the harness line in section 3 and the gates in section 2 are pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; no schema, so nothing to undo in the database. An undo that was performed stays in the data and in `audit_log`, as any edit would

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An undone delete reads as "Added" and an undone edit as "Edited" in the list; there is no "Undone" label | accepted: needs a marker column, no schema in this part; the order of lines shows it |
| 2 | low | Deleting a resident needs every child row gone first, so residents are not undoable here | accepted: reasoned in the decision record |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As an admin, edit a contact's phone, open Recent changes, tap Undo this change → Yes, undo it: the phone is back and the list gains an Edited line by you | `/admin/recent-changes` on dev |
| 2 | Edit the same contact twice: the older line says it cannot be undone, the newer one can; undo the newer, then the older offers it | same |
| 3 | Delete a weight, then enter a new weight for that day and try Undo on the delete: the message says something else holds its place | same |
| 4 | An archived line points at Restore; a resident delete and file lines explain why there is no button; the Thai text reads sensibly | same |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (audit-undo session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items are listed and none has been checked yet; a person signs below

Manual verification by: pending: Undo button, the changed-since refusal and the slot-taken message have not been driven in a browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; follows the PR

Result: pass with accepted defects

Release manager acknowledgement: pending
