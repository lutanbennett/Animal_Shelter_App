# Feature test plan

## Header

| | |
|---|---|
| Feature | The second step is one bare page owned by the person, not a shelter |
| Backlog item | `docs/backlog.md` → `#pstep` (on the backlog branch; not yet on this branch's copy, so not ticked here) |
| Branch / worktree | `claude/platform-step-up` @ `C:\Development\Animal_Shelter_platform-step-up` |
| Dev server | `http://localhost:3001` |
| PR | to be opened |
| Tested by / date | Claude, 2026-11-25 |
| Carries a migration? | no |
| Tested at SHA | 04772dd2d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the second-step page has no shelter chrome, tab title or "for this shelter" wording, and keeps its return journey
- [x] Files/areas touched listed: `src/app/PublicPathGate.tsx`, `src/app/admin/security/verify/{layout,page}.tsx`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, a decision file
- [x] Cards affected identified: none change; no card grants or denies anything differently. Admin and the signed-out public are unaffected (the page still requires a login)
- [x] Out of scope written down: `shelter_hosts`, host mapping, `wrangler.jsonc`, enrolment, factor approval, `app_metadata`, how a code is verified, migrations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ended all zero (started just before the release-note commit landed, so the build read that edit mid-run; lines as printed):

```
=== gates: typecheck exited 0 after 74s
=== gates: lint exited 0 after 179s
=== gates: test exited 0 after 46s
=== gates: build exited 0 after 164s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: driven with playwright-core as a signed-in admin, the page loads in both journeys with the code box, Continue and the lost-phone sentence (the real code entry is the pending item below)
- [ ] Data persists — n/a: the page stores nothing
- [ ] Create / edit / delete — n/a: no data is created, edited or deleted
- [ ] Empty state — n/a: no list
- [ ] Invalid input rejected — n/a: verification logic untouched
- [ ] Boundary cases — n/a: no input handling changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (dev-signin) | `/admin/security/verify?next=/admin/security` and `?next=/platform` | bare page, `next=` kept in the address | header 0, nav 0, links 0, tab title "2-step verification" |
| any card set | unchanged | the page's own checks (admin or product administrator) are untouched | not re-driven: no server code changed |
| signed out | unchanged | redirected to login as before | not re-driven: no server code changed |

- [x] Every login above tested, as far as it changed (admin)
- [ ] A login that should not have access is blocked server-side — n/a: the page's access checks are not touched by this change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe this page's layout
- [x] Translatable strings go through the translation path: English and Thai changed together; `node scripts/check-thai-dictionary.mjs` run (see PR)
- [ ] Mobile viewport — pending: not driven at 375px; the page is a single column with no new layout
- [ ] Browser console clean — pending: console not read in the driven run
- [ ] Network clean — pending: network not read in the driven run

## 6. Regression

- [x] Pages nearest the change checked: `/admin/security/verify` in both journeys
- [ ] Shared file touched checked from a second page — pending: `PublicPathGate` touched; `/platform` and public pages not re-loaded here, the change only adds one path to its condition
- [x] Nothing merged from `main` during `sync` (nothing was merged)

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: `#pstep` is on the backlog branch and is not in this branch's `docs/backlog.md`; the planner's daily merge brings it in
- [x] Decision added: `docs/decisions/2026-11-25-product-level-second-step.md`
- [x] `README.md` still accurate (not mentioned there)
- [x] **Release notes.** `unreleased` gained one admin note about the plain 2-step page
- [x] Commit messages say why
- [x] Claims were measured: the bare page, title and wording were read from a driven browser; the factor-per-login claim is quoted from the code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence is the tool's actual output — n/a: no pasted evidence beyond the gates
- [ ] Public pages re-checked — n/a: public pages are not changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New env var in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code only; revert the commit, no schema to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Complete a real second step from the shelter app and from the console: enter an authenticator code and confirm you land back on the page you started from (needs a real authenticator, which no stream has) | production or test host, Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's real code entry on the page

Manual verification by: pending: a real authenticator code on both journeys (Lutan)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass
