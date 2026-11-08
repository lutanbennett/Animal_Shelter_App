# Feature test plan — reel-tag-admin-pass

## Header

| | |
|---|---|
| Feature | Verification pass for #r8kq3: a reel carrying tag rows opened as Admin and as a login holding exactly `reel_add`, to see whether the resident names are still visible |
| Backlog item | `docs/backlog.md` → #r8kq3 |
| Branch / worktree | `claude/reel-tag-admin-pass` @ `C:\Development\Animal_Shelter_reel-tag-admin-pass` |
| Dev server | `http://localhost:3008` |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | d1f0c5bf |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — no code change; the reel page was driven in two logins and what was on screen is recorded below
- [x] Files/areas touched listed — this plan and the `#r8kq3` tick in `docs/backlog.md`. No `src/`, no migration
- [x] Cards affected identified — `reel_add` (`social.reels` Edit + `resident.who_and_where` Read), `reel_view` (not re-driven; proved in #1369); Admin outside the card system
- [x] Anything explicitly **out of scope** written down — a login holding `reel_view` only (already proved by #1369), the `#` picker, the library tile

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0` — see PR body for the pasted line; no source file differs from `main`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [x] Existing rows still read correctly — the one dev reel (taken 7 Nov 2026, "doing funny thigs #Test 1") carries one tag row and it reads as "Test 1" in both logins. It was created by an earlier stream through the app; no rows were written by this pass
- [ ] Permissions exercised in a harness — n/a: no migration; the harness belongs to 0330
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the reel opens from the Reels list and "Animals in it" shows the tagged animal
- [ ] Data persists — n/a: read-only pass
- [ ] Create / edit / delete all exercised — n/a: read-only pass
- [ ] Empty state renders sensibly — n/a: not the question; "N animals tagged, you cannot see which" was proved for `reel_view` in #1369
- [ ] Invalid input is rejected — n/a: read-only pass
- [ ] Boundary cases checked — n/a: one reel, one tag row

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (`dev-signin-admin@example.invalid`) | `/reels/617dfad7-…` | resident name visible | pass — page text under "Animals in it" read `Test 1`; Archive, Edit, Download all present |
| exactly `reel_add` (`dev-signin-5d36426c@example.invalid`, header "Dev sign-in: reel_add") | `/reels/617dfad7-…` | resident name visible | pass — page text under "Animals in it" read `Test 1`; Edit present, Archive absent (as the card is meant to be) |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side — n/a: this pass is about names an entitled login must still see; the refused direction was #1369's

**The question the item asks — are the names visible in both? Yes.** Both logins were shown `Test 1`
under "Animals in it", read from the rendered page, not from the function. The card key that carries
`reel_add` is `reel_add` (`src/lib/permissions/cards.ts:337`). Its bundle is `social.reels` Edit plus
`resident.who_and_where` Read, which is the gate `reel_resident_tags()` uses to name animals.

**Limits of this proof, said plainly:** one reel with one tag row; the pages were reached by client-side
navigation (`next.router.push('/reels')` then clicking the reel), because the home page showed no Reels
tile in the pane; page text was read with `javascript_tool`, no screenshot was taken.

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: no UI change
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: not read; the question was only whether names render
- [ ] Network clean — n/a: not read; same reason

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — #r8kq3
- [ ] Non-obvious design choices added to `docs/decisions/` — n/a: a clean pass belongs in this plan, no fault found
- [ ] `README.md` still accurate — n/a: nothing user-facing changed
- [ ] **Release notes.** n/a: verification pass, no change to what a user sees
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the names were read off the rendered page in each login

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change covered at both edges — n/a: not a boundary change
- [ ] Evidence pasted is the tool's actual output — n/a: page text quoted above as read
- [ ] Public pages re-checked — n/a: no public view touched

### Deploy safety

- [ ] `deploy: production` line read — n/a: nothing to deploy
- [ ] `strip-baked-env` seen — n/a: nothing to deploy
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [ ] Migration and reading code in the same PR? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documentation only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|

None found.

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification

Manual verification by: n/a: the only screens were driven by Claude in the browser pane, recorded in section 4

Result: pass
