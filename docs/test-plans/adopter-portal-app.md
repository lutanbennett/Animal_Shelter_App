# Feature test plan

## Header

| | |
|---|---|
| Feature | Adopter / foster-carer portal, app half |
| Backlog item | `docs/backlog.md` → `#d6wxo` |
| Branch / worktree | `claude/adopter-portal-app` @ `C:\Development\Animal_Shelter_adopter-portal-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | db26bc60a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the portal page says "foster" for a fostered animal, and a roleless login on a staff route is sent to the portal instead of being signed out
- [x] Files/areas touched listed: `src/lib/supabase/proxy.ts`, `src/lib/adopter/scope.ts`, `src/app/adopter-update/page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/releases.ts`, a decision file, the backlog tick
- [x] Cards affected identified: none. The portal account sits outside the card system by Lutan's recorded exception (2026-11-13); no card is added or changed; Admin is untouched; the signed-out public is unaffected
- [x] Out of scope written down: no card, no migration, no change to `public_adoption_updates`, no change to the Admin bypass or the registry

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (plain `git merge origin/main`, no conflicts)
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 34s
=== gates: lint exited 0 after 293s
=== gates: test exited 0 after 49s
=== gates: build exited 0 after 84s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration (the existing `scripts/check-portal-account.mjs` harness was run, see section 4)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a disposable roleless login with a live contact and an open Foster placement opened `/adopter-update` and saw "Fostered by you", the foster intro, the form and no staff menu (driven in the built-in browser on dev)
- [ ] Data persists — n/a: this change adds no write; the existing Send action is unchanged
- [ ] Create / edit / delete — n/a: no create/edit/delete changed
- [x] Empty state renders sensibly: unchanged path, the no-animals message now says "adopted or fostered" (read in the dictionary)
- [ ] Invalid input rejected — n/a: no input handling changed
- [ ] Boundary cases — n/a: no boundary logic changed; the only new query is an id-list lookup with the same ids already in scope

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| roleless, live contact with open Foster placement | `/home` (staff route, typed address) | sent to `/adopter-update`, stays signed in, no staff menu | as expected (browser) |
| roleless, no contact | any staff route | unchanged: signed out, `/login?error=no_role` | not re-driven: the branch is untouched and only runs when no adopter scope exists |
| admin | n/a | outside the card system, unchanged | not touched |
| signed out | staff routes | `/login` as before | not touched |

- [x] Every login that matters tested, or reasoned from an untouched branch as stated above
- [x] A login that should not have access is blocked server-side: `node scripts/check-portal-account.mjs` printed HARNESS-OK, 112 tables swept, a roleless login holds no permission and reads no non-reference table

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: the portal is not a manual topic and no staff screen changed
- [ ] Translatable strings through the translation path — n/a: portal strings are dictionary entries, not translated database text
- [ ] Mobile viewport — pending: not driven at 375px; the added line is one text paragraph in an existing card
- [x] Browser console clean — no errors seen during the driven session (only the page text and screenshot were read; console not separately dumped)
- [ ] Network clean — n/a: no new requests from the browser

## 6. Regression

- [x] The pages nearest the change still work: `/adopter-update` loaded and rendered its form
- [ ] Any shared file touched checked from a second page — n/a: `proxy.ts` was exercised by loading `/home` and then `/adopter-update` as the roleless login
- [x] Nothing merged from `main` during sync was broken by this branch (gates above)

## 7. Documentation

- [x] Backlog item `#d6wxo` ticked in `docs/backlog.md` on this branch and its title rewritten to say nothing is left to build
- [x] Design choices recorded in `docs/decisions/2026-11-13-adopter-portal-app.md`
- [ ] `README.md` still accurate — n/a: README does not describe the portal
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a new line for foster wording and the redirect; no manual step is outstanding
- [x] Commit messages say why, not just what
- [x] Claims were measured: the redirect gap was seen in the browser (signed out to `no_role`) before the fix and the portal landing after it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is a pasted run, nothing hand-tabulated
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret or env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production `--dry-run` — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code only, no schema; revert the commit and redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A roleless login with an adopter scope typing a staff address was signed out with "no access" instead of going to the portal | fixed in this PR (`proxy.ts`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai foster wording ("อุปการะชั่วคราว") reads naturally to a Thai speaker | `/adopter-update` in Thai |
| 2 | Decide whether approved foster updates should appear on the website (they already do) | Lutan's call, see the decision file |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Thai wording and Lutan's foster-visibility call

Manual verification by: pending: Thai-speaker review of the foster wording and Lutan's call on foster visibility

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
