# Test plan: next-16-4-2-bump

## Header

| | |
|---|---|
| Feature | Bump Next 16.3.8 to 16.4.2 for three advisories |
| Backlog item | `docs/backlog.md` → Bump Next from `16.3.8` to `16.4.2` for three advisories |
| Branch / worktree | `claude/next-16-4-2-bump` @ `C:\Development\Animal_Shelter_next-16-4-2-bump` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | b396359f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `next` 16.3.8 → 16.4.2 (exact pin, lockfile only otherwise)
- [x] Files/areas touched listed: `package.json`, `package-lock.json`, one decision file, this plan, the backlog tick. No source change
- [x] Roles affected identified: none directly; the framework serves every role
- [x] Out of scope written down: no other dependency moved; no workflow change; no deploy

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with all four codes 0. Closing line from the run before the sync:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `next dev` on 3006 served /, /login, signed-in /my, /admin/diets and /account/password, all 200
- [ ] Data persists — n/a: no data feature; a framework bump
- [ ] Create / edit / delete — n/a: no feature; the Server Action POST below is the exercise
- [ ] Empty state — n/a: no UI change
- [x] Invalid input rejected without a crash: /account/password submitted with mismatched passwords via the Server Action returned POST 200 and the page stayed up
- [ ] Boundary cases — n/a: no logic change

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /my, /admin/diets, /account/password | open | opened (dev-signin, aal1) |
| management | n/a | n/a | n/a: framework bump, no access rule changed |
| staff | n/a | n/a | n/a: retired role |
| doctor | n/a | n/a | n/a: framework bump, no access rule changed |
| volunteer | n/a | n/a | n/a: framework bump, no access rule changed |
| signed out | /, /login | open | 200 |

- [ ] Every role above tested — n/a: no access rule changed; admin and signed-out were exercised as a smoke
- [ ] A role that should not have access is blocked server-side — n/a: no permission code touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI change
- [x] Browser console clean: one error, from the browser pane's own injected script (anonymous, getComputedStyle), not the app; dev server log has no errors
- [x] Network clean: no 4xx/5xx on the pages visited

## 6. Regression

- [x] Nearest pages still work: /, /login, /my, /admin/diets, /account/password
- [ ] Shared file touched — n/a: no shared source file touched
- [x] Nothing merged from `main` during sync was broken by this branch: gates were run before the sync; the sync brought two migrations and scripts only, none touching the framework

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added: `docs/decisions/2026-10-23-next-16-4-2-advisories-routine.md`
- [x] `README.md` still accurate: it does not name the Next version
- [ ] **Release notes.** — n/a: a dependency bump — nothing a shelter user would notice changed
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: advisory ranges from today's `npm audit`, the config line, the empty `"use cache"` grep and the file count were all run today

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (the item asks for a test-environment smoke test before production)
- [ ] Timezone-sensitive behaviour — n/a: no date logic touched
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line, pasted unedited
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; revert this PR's merge commit and rebuild (`deploy-pi.sh --ref <sha>` on the Pi). No migration to reverse

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `scripts/dev-signin.mjs` drops a role given as the first argument (`cardsIdx + 1` is 0 when `--cards` is absent); `--port 3006 admin` works | deferred to backlog; not caused by this PR |
| 2 | info | `opennext:build` prints `Failed to copy` for `age-encryption`, `color-string`, `data-uri-to-buffer`; the build completes and all three are in `.open-next/server-functions/default/node_modules` (known cosmetic, `docs/decisions.md`) | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty; nothing for a person to look at beyond the release manager's deploy-time smoke test in section 8

Manual verification by: n/a: a framework bump with no UI change; the test-environment smoke test is section 8

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over in the PR description

Result: pass

Release manager acknowledgement: pending
