# Feature test plan

## Header

| | |
|---|---|
| Feature | release-note-admin-flag |
| Backlog item | `docs/backlog.md` → A RELEASE NOTE GETS AN EXPLICIT `admin: true` FLAG |
| Branch / worktree | `claude/release-note-admin-flag` @ `C:\Development\Animal_Shelter_release-note-admin-flag` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | n/a: PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | f08d1403 |

## 1. Scope and risk

- [x] Change is described in one sentence: a release note can carry `admin: true` and is then listed to Admin and nobody else
- [x] Files touched: `src/lib/releases.ts`, `src/lib/release-audience.ts` (+ test), `src/lib/release-mail.ts` (comment only), `src/app/releases/page.tsx`
- [x] Cards affected: none change behaviour. Admin (outside the card system, via `perms.isAdmin`) sees the note; the signed-out public does not
- [x] Out of scope: cards, can.ts, migrations, removing the history `roles` tag and `ReleaseRole` (live, reported in the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 72s
=== gates: lint exited 0 after 146s
=== gates: test exited 0 after 18s
=== gates: build exited 0 after 182s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: unit test shows Admin is listed the admin note
- [ ] Data persists — n/a: static data file, nothing stored
- [ ] Create / edit / delete — n/a: no records
- [ ] Empty state — n/a: a release with nothing for the reader already says so; unchanged
- [ ] Invalid input — n/a: no input
- [x] Boundary cases: card-tagged, untagged, role-tagged and unknown-card notes keep their old audience (test)

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /releases | sees the admin note | pass (unit test, isNoteListed and isNoteForReader) |
| exactly `record_weight` | /releases | does not see it, even under Show everything | pass (unit test) |
| holding no card | /releases | does not see it | pass (unit test) |
| signed out / no permissions | /releases | does not see it | pass (unit test) |

- [x] Every login above tested (as unit-level permission objects, not a driven browser)
- [x] A login that should not have access is blocked — the filter is applied on the server before render

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no user-facing screen changed
- [ ] Translatable strings — n/a: no new strings; notes are English only
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console — n/a: not driven in a browser
- [ ] Network — n/a: not driven in a browser

## 6. Regression

- [x] Nearest code: release-audience tests (6 pass) and release-mail path read; page filter is an added `.filter` before the old map
- [ ] Shared file touched checked from a second page — n/a: no shared nav/manual file touched
- [x] Nothing merged from main during sync was broken (gates green)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Decision file `docs/decisions/2026-11-03-release-note-admin-flag.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line flagged `admin: true`, the first use of the feature: only an Admin would notice it, so it is addressed to Admin
- [x] Commit messages say why
- [x] Claims were measured: the tests ran and passed; the mail path was read, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary/banding assertions — n/a: no threshold
- [ ] Evidence pasted is unedited tool output — n/a: gates output pasted exactly as printed
- [ ] Public pages re-checked — n/a: /releases is behind sign-in, public pages untouched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Both migration and reader — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: pure code change, revert the commit; no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `ReleaseRole` and `TAGGED_ROLES` still select history notes by role name | deferred to backlog (planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | /releases as Admin shows the new note; as a card-only login it does not | /releases |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: a person to look at /releases as Admin and as a card-only login

Manual verification by: pending: a person to look at /releases as Admin and as a card-only login

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file
- [ ] Handed to the production release manager — n/a: release manager reads it at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
