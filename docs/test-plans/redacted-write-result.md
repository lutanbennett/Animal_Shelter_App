# Feature test plan — redacted-write-result

## Header

| | |
|---|---|
| Feature | `runWriteAction()` gains an optional `storedAs` so a secret is never kept in `write_requests.result`; `/admin/security` and `/admin/security/verify` wrapped and listed |
| Backlog item | `docs/backlog.md` → **`/admin/security` AND `/admin/security/verify` CANNOT GO ON `WRAPPED_WRITE_PATHS` UNTIL THE WRAPPER CAN STORE A REDACTED RESULT** (ticked) |
| Branch / worktree | `claude/redacted-write-result` @ `C:\Development\Animal_Shelter_redacted-write-result` |
| Dev server | not driven — both screens need the second step and `dev-signin.mjs` is aal1 only |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `__SHA__` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an optional `storedAs` argument stores a redacted answer instead of a secret-bearing success; the three secret-returning writes use it; the other writes are claimed as they were; both addresses are listed
- [x] Files/areas touched listed — `src/lib/action-result.ts` (+ test), `src/lib/write-requests.ts` (two list lines), `src/app/admin/security/{actions.ts,verify/actions.ts,use-security-write.ts,UsersTable.tsx,AccessRequests.tsx,DoctorLoginLink.tsx,CreateUserForm.tsx,verify/TwoStepForm.tsx}`, `en.ts`/`th.ts` (two refusal strings), `docs/`
- [x] Roles affected identified — Admin only reaches these screens (aal2); no access check moved or changed, all run inside the wrapped body as before
- [x] Anything explicitly **out of scope** written down — no migration, no retention change, no change to `claim_write_request` / `finish_write_request`, streams 32 and 33's files untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `main`; `origin/main` merged before the PR was opened (see PR)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output redirected to a file:

```
__GATES__
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change; the stored shape is the existing `result jsonb`
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: none written, none needed
- [ ] Production apply plan — n/a: nothing to apply (0292 is already the prerequisite for the whole programme)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: aal2 required, no authenticator (the redacted path is proven by harness, below)
- [ ] Data persists — n/a: aal2 required, no authenticator
- [ ] Create / edit / delete all exercised — n/a: aal2 required, no authenticator
- [ ] Empty state renders sensibly — n/a: no new empty state
- [ ] Invalid input is rejected with a readable message — n/a: aal2 required, no authenticator; refusals are stored and replayed unchanged (unit test)
- [ ] Boundary cases checked — n/a: aal2 required, no authenticator

Harness evidence (`src/lib/action-result.test.mjs`, 17 pass): the secret never appears in any rpc call when `storedAs` is given; the caller still receives the real result; a refusal is not passed through `storedAs`; a replay returns the stored refusal and never runs the body; without `storedAs` the stored result is the whole result exactly as before. The list test asserts both addresses are wrapped. `check-wrapped-write-paths.mjs --all` on this branch: every one of 149 listed addresses complete (147 listed before, at HEAD `47bc71d6`).

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | both screens | unchanged | n/a: aal2 required, no authenticator |
| management | refused | unchanged | n/a: no access check changed |
| staff | retired | unchanged | n/a: retired role |
| doctor | refused | unchanged | n/a: no access check changed |
| volunteer | refused | unchanged | n/a: no access check changed |
| signed out | refused | unchanged | n/a: no access check changed |

- [ ] Every role above tested — n/a: no permission, card or policy was touched; the admin and two-step checks run inside the body exactly where they did
- [ ] A role that should not have access is blocked server-side — n/a: server checks unchanged, not weakened

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no visible behaviour change except two refusal sentences on a replay
- [x] Translatable strings go through the translation path — `secretShownOnce` and `setupAlreadyStarted` added to both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: aal2 required, no authenticator
- [ ] Network clean — n/a: aal2 required, no authenticator

## 6. Regression

- [x] The pages nearest the change still work — an ordinary wrapped write elsewhere is unchanged: the pre-existing wrapper tests (fresh claim, replay, in_flight, stored refusal, finish failure, redirect pass-through) pass untouched, and the build compiles every other caller
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared file is `action-result.ts`, covered by its unchanged tests and the typecheck rather than a page load; `useSecurityWrite` is new and used only here
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, and its title reads as done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-redacted-write-result.md` (what is stored, what was rejected, the replay decision)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a shelter user would notice nothing unless the first answer is lost in transit
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the claim that the secret never reaches an rpc is an assertion in the test; the 147 to 149 count is the check script's plus `git grep` of HEAD

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, with an authenticator (list below)
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is the tool's actual output, unedited** — deferred: release manager for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] production `--dry-run` — n/a: no migration
- [ ] destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — code rollback is safe: rows already stored hold only what the old code would also have stored, and no schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The existing list test asserted the two addresses were NOT wrapped | fixed — it now asserts they are |

## Left for manual verification

A person with an authenticator, signed in as an admin with the second step passed, on the dev or test site:

| # | What to check | Where |
|---|---|---|
| 1 | Add user: the temporary password shows once and works. Then in the database, the newest `write_requests.result` shows the refusal sentence, NOT the password | `/admin/security` |
| 2 | Issue temporary password on another login: password shows; the newest `write_requests.result` holds the sentence, not the password | `/admin/security` |
| 3 | With the network off, press Issue temporary password: the row says it could not tell, and pressing again does not issue twice | `/admin/security` |
| 4 | Change a role, add and remove a cover role, set a name, link/unlink a doctor, archive/restore: each still works once and shows its message | `/admin/security` |
| 5 | Allow set-up, Reset 2-step, Approve and Deny an access request: each still works | `/admin/security` |
| 6 | On a login with no authenticator and set-up open, press Start: the QR and key show, and the newest `write_requests.result` has no key. Enter the 6-digit code: it lands back on Security with 2-step on | `/admin/security/verify` |
| 7 | Reload the verify page after Start and press Start again: a new key shows (the old one is gone) | `/admin/security/verify` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: seven presses by a person holding an authenticator

Manual verification by: pending: seven presses by a person holding an authenticator

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
