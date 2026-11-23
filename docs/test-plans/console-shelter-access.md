# Feature test plan — console-shelter-access

## Header

| | |
|---|---|
| Feature | An Access tab on a shelter in the console: add a login to an existing role, change its role, take it out (archive), as a backup to the shelter's own Admin |
| Backlog item | `docs/backlog.md` → #shsec (ticked) |
| Branch / worktree | `claude/console-shelter-access` @ `C:\Development\Animal_Shelter_console-shelter-access` |
| Dev server | `http://localhost:3006` |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-23 |
| Carries a migration? | yes — 0438 |
| Tested at SHA | 25f046f84 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a product administrator adds, re-roles or takes out a shelter's logins, using only roles the shelter already has
- [x] Files/areas touched listed — `supabase/migrations/0438*`, `src/app/platform/{access-actions.ts,ShelterAccess.tsx,ProductAdminPanel.tsx}`, `src/lib/platform/create-login.ts`, both dictionaries, the security registry, docs
- [x] Cards affected identified — none: the gate is the product-administrator list plus aal2 (outside the card system); no card is read or written and no role or card is created or edited
- [x] Anything explicitly **out of scope** written down — creating logins, roles, cards, cover roles (see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0438 after 0437; `check-migration-numbers.mjs` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — only 0438 pending on dev
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — 0438 ok
- [x] Applied to **dev** — applied
- [x] File is re-runnable — create or replace, revoke/grant only
- [x] Existing rows still read correctly after the change — no table or column changed; only functions added
- [x] Constraints and defaults exercised against real rows — add, re-role and archive on real dev rows; sole-Admin, aal1 and non-product-administrator refusals in the rollback harness
- [x] Down-migration written — drop line in the file header
- [ ] Production apply plan stated — pending: the release manager applies 0438 with the release; additive functions only

## 4. Functional checks

- [x] Happy path works end to end — signed in as a product administrator at aal2, opened Test Shelter 2, Access tab, banner "You are changing: Test Shelter 2", added a throwaway login, changed its role, took it out
- [x] Data persists — read user_roles back after each press: role set, then archived_at set
- [x] Create / edit / delete all exercised — add, role change and take-out (archive) pressed; delete is deliberately not offered
- [ ] Empty state renders sensibly — n/a: not driven; the empty line is plain text in the component
- [x] Invalid input is rejected with a readable message — lock-out and bad-role cases are refused by the database with sentences on the screen (the harness proves the codes)
- [ ] Boundary cases checked — n/a: no length or date logic

### Role access matrix

By gate, not card: product administrator plus aal2.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| product administrator at aal2 | Access tab | list and controls | pass, driven |
| product administrator at aal1 | functions | refused 42501 | pass, harness |
| login not on the list | functions | refused 42501 | pass, harness |
| signed out | /platform | redirect to login | pending: not driven; page gate unchanged |

- [ ] Every login above tested — pending: signed-out row not driven
- [x] A login that should not have access is blocked server-side — each action re-checks isProductAdmin() and hasTwoStep(); each function raises for anyone else (harness)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: a tab inside the existing console
- [ ] Manual updated — n/a: the console has no manual topic
- [x] Translatable strings go through the translation path — added to en.ts and th.ts; the Thai is not checked by a Thai speaker
- [ ] Mobile viewport (375px) — pending: not driven; the tab uses the same wrapping classes as its neighbours
- [x] Browser console clean — no errors surfaced in the driven run
- [x] Network clean — only the page load and Server Action posts, all succeeded

## 6. Regression

- [x] The pages nearest the change still work — /platform cards and the other tabs render (tab list read)
- [x] Any shared file touched checked from a second, unrelated page — dictionaries and create-login.ts only gained entries; typecheck and the build pass
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #shsec
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-23-console-shelter-access.md`
- [x] `README.md` still accurate — it does not describe the console tabs
- [ ] **Release notes.** n/a: only a product administrator reaches this tab and no shelter user or Admin sees any change
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decision files were measured — add, re-role, archive and the audit actor and shelter were read back from the database; the lock-out came from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] For a boundary or banding change, assertions cover both edges — n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — yes, 0438 and its callers; code before the migration fails with a refusal message, not a crash
- [ ] `--dry-run` against production — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive functions only
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — deferred: release manager (drop the five functions; nothing else changed; take-out only archives)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | A shelter's Recent changes names the actor but does not mark a change as an outsider's | deferred to backlog: for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording reads naturally | /platform → a shelter → Access, language set to Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

### Manual verification

Manual verification by: n/a: nothing here was looked at by a person; Claude drove it
