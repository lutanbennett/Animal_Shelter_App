# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `/residents`: no ID column on phones, search by R-code, an Adopted chip, and a pointer to adopted matches a filter hides |
| Backlog item | `docs/backlog.md` → Residents list on a phone: drop the Resident ID column; Low priority: check the residents list's filter and search logic for adopted residents |
| Branch / worktree | `claude/residents-list-fixes` @ `C:\Development\Animal_Shelter_residents-list-fixes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | linked from the PR itself |
| Tested by / date | Claude (residents-list-fixes session), 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | `9e03410` (gates) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the ID column is hidden below `md`; search also matches the R-code; an "N adopted residents match — show" line appears when a place, zone or enclosure filter hides adopted matches; and an Adopted chip lists only adopted residents. The adopted-search disappearance itself was **not reproduced**
- [x] Files/areas touched listed: `src/app/residents/page.tsx`, `ResidentsTable.tsx`, `src/lib/residents/status.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, docs. No schema, no `worker/`
- [x] Roles affected identified: everyone who can open `/residents` (admin, management, staff, volunteer, vet — a vet still sees only their clinic's residents through RLS); signed-out is redirected to login
- [x] Out of scope written down: no fix is claimed for the 2026-09-26 miss; cause (d) (the row's data or RLS on the live site) was not checked; no Thai manual exists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date." at `9e03410`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 27s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The list needs a signed-in session and this session does not enter credentials,
so **no browser check was driven**; the dev server reached the login page only.
Everything below that needs the page is either `n/a` with that reason or in the
manual handover.

- [ ] Happy path works end to end — n/a: not driven in a browser (login required); typecheck, lint and build pass, the rest is in the manual list
- [ ] Data persists — n/a: read-only list, nothing is written
- [ ] Create / edit / delete all exercised — n/a: the list has no writes
- [ ] Empty state renders sensibly — n/a: unchanged code path; the no-matches row's colSpan still spans all eight columns
- [ ] Invalid input is rejected with a readable message — n/a: search text goes through the same character stripping as before; resident_code is added to the same or() filter
- [ ] Boundary cases checked — n/a: not driven; long bilingual name at 375px is in the manual list

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | not driven, see below | n/a |
| management | n/a | not driven, see below | n/a |
| staff | n/a | not driven, see below | n/a |
| vet | n/a | not driven, see below | n/a |
| volunteer | n/a | not driven, see below | n/a |
| signed out | `/residents` | redirected to login | seen on the dev server at :3004 |

- [ ] Every role above tested — n/a: no query gained access to anything new; the same view and RLS as before, and the added count query reads `resident_list_view`, which RLS already scopes
- [ ] A role that should not have access is blocked server-side — n/a: unchanged; signed-out redirect seen above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: it was updated (phone caption, search step, an adopted-residents step) but `/manual` was not loaded, and a tick would claim that it was
- [ ] Translatable strings go through the translation path — n/a: static dictionary strings added to both `en.ts` and `th.ts`, not management-translated ones
- [ ] Mobile viewport (375px) — n/a: not driven, login required; in the manual list
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven; build compiles `/residents` and its neighbours
- [ ] Shared file checked from a second page — n/a: `manual/en.ts` and `releases.ts` were edited by adding text only; not loaded at `/manual` (login)
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged, and gates pass

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (both, the adopted one with a note that it was hardened and not reproduced)
- [x] Non-obvious design choices added as `docs/decisions/2026-09-30-residents-list-adopted-search.md`, including which of (a)–(d) the code explains and that (d) was not checked
- [ ] `README.md` still accurate — n/a: it does not describe the residents list's columns or filters
- [x] **Release notes.** A shelter user would notice this: `unreleased` in `src/lib/releases.ts` gained a line
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the causes in the decision are labelled as read from code, none as reproduced

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold or banding change
- [ ] Evidence pasted is the tool's actual output — n/a: the gates lines in section 2 are pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

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

- [x] Rollback position: revert the PR, or `wrangler rollback`. No schema was touched, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found; none looked for beyond the gates | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At 375px the Residents list shows only the name (and copy-link / edit icons); a long name with Thai and other names wraps less; tapping a row opens the resident; desktop still shows the ID | `/residents` |
| 2 | Searching an R-code finds the resident; with On-site, then a zone chip, a search for an adopted animal (Panda) shows "1 adopted resident matches — show", and that link lists them | `/residents?q=Panda&place=internal` |
| 3 | Adopted chip lists only adopted residents, is absent under On-site / Off-site or with a zone chosen, and Clear removes it | `/residents` |
| 4 | Cause (d): Panda's row on the live site has current_status Adopted and is visible to the role that missed it | dev / production data |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (residents-list-fixes session)  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked; only the person who looked may tick it, and nobody has yet

Manual verification by: pending: rows 1-4 above, none looked at yet

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: PR not open yet
- [ ] Handed to the production release manager — n/a: nothing to hand over until the manual rows are checked

Result: pass

Release manager acknowledgement: pending
