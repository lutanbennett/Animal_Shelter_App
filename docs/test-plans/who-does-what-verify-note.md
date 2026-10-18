# Feature test plan — who-does-what-verify-note

## Header

| | |
|---|---|
| Feature | Who does what: an admin who has not verified with the authenticator is told why the board is locked, on the board |
| Backlog item | `docs/backlog.md` → **Who does what: an admin who has not verified with the authenticator sees a board with no buttons and a "no" cursor** (ticked) |
| Branch / worktree | `claude/who-does-what-verify-note` @ `C:\Development\Animal_Shelter_who-does-what-verify-note` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: number is known only once the PR is opened |
| Tested by / date | Claude / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | c3a5c741 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — when an admin has not verified, the cards board shows a locked note with a Verify link in both columns, disabled + / remove buttons naming the reason, and a locked hint where the drag hint was
- [x] Files/areas touched listed — `src/app/admin/who-does-what/CardBoard.tsx`, `page.tsx` (two props), both dictionaries, `src/lib/releases.ts`, `docs/backlog.md`
- [x] Roles affected identified — only an admin who has not verified sees anything new; verified admin, management and others render exactly as before
- [x] Anything explicitly **out of scope** written down — `guard()` in `actions.ts` is untouched; no prompt, modal or challenge was built; no card was granted to any role

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: build exited 0 after 125s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: pending Lutan, see Left for manual verification; the unverified-admin state needs a real login that has not verified and was not driven here
- [ ] Data persists — n/a: nothing is written; the change is display only
- [ ] Create / edit / delete all exercised — n/a: no writes added; the gate is unchanged
- [ ] Empty state renders sensibly — n/a: the note renders independently of whether the column has cards
- [ ] Invalid input is rejected with a readable message — n/a: no input added
- [ ] Boundary cases checked — n/a: one boolean decides it (`isAdmin && !canEdit`), read from the code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin, unverified | Who does what | note, disabled buttons, locked hint | pending: not driven in a browser |
| admin, verified | Who does what | unchanged | pending: not driven in a browser |
| management | Who does what | unchanged (read-only line) | pending: not driven in a browser |
| staff | n/a: retired role | n/a | n/a: retired role (0173) |
| doctor | n/a: cannot open the page | refused as before | n/a: page code for refusal untouched |
| volunteer | n/a: cannot open the page | refused as before | n/a: page code for refusal untouched |
| signed out | redirected to login | unchanged | n/a: redirect line untouched |

- [ ] Every role above tested — n/a: pending Lutan; by code, `locked` is `isAdmin && !canEdit`, so it is false for every non-admin
- [ ] A role that should not have access is blocked server-side — n/a: access control not changed; `guard()` untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: the manual describes giving cards, not the locked state
- [ ] Translatable strings go through the translation path — n/a: strings are in both dictionaries (`en.ts`, `th.ts`), not in the translations table
- [ ] Mobile viewport (375px) — n/a: pending Lutan, not driven in a browser
- [ ] Browser console clean — n/a: pending Lutan, not driven in a browser
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [ ] The pages nearest the change still work — n/a: pending Lutan; the verified-admin path is the same JSX as before
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched (`NavLinks.tsx`, `manual/en.ts` not edited)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Non-obvious design choices added as a decision file — n/a: the pattern is not app-wide: `canEdit` from `hasTwoStep()` exists only on this page; `/admin/security` redirects to the verify page, so it never shows an unverified admin a locked screen
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` gained a line written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned — the grep for `hasTwoStep` listed five files, each read

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change — n/a: not a threshold change
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates output is pasted, unedited
- [ ] Public pages re-checked — n/a: public pages untouched
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added
- [ ] Migration and reading code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: display-only change, rollback is the previous deploy; nothing in the database changed

## Left for manual verification

| What | Who |
|---|---|
| As an admin who has not verified: open Who does what, see the locked note with Verify now in both columns, greyed + / remove buttons with the reason on hover, and the locked hint | Lutan |
| Follow Verify now, verify, come back: the + buttons work | Lutan |
| As a verified admin and as Management: nothing looks different | Lutan |

## Defects found

None found. The unverified-admin state was not driven in a browser (no unenrolled admin login set up), so it is marked pending, not ticked.

Automated checks by: Claude  Date: 2026-10-18
Manual verification by: pending: Lutan to look at the unverified-admin state

Result: pass
