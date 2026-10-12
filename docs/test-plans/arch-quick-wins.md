# Feature test plan — arch-quick-wins

## Header

| | |
|---|---|
| Feature | Lint fence on the service-role client, four stale comments, seven stale README/template rows |
| Backlog item | `docs/backlog.md` → the three architecture-review items (S6, N1/N4, §1.9), all ticked |
| Branch / worktree | `claude/arch-quick-wins` @ `C:\Development\Animal_Shelter_arch-quick-wins` |
| Dev server | not started — no UI surface |
| PR | see the PR |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — a `no-restricted-imports` allow-list for `@/lib/supabase/admin`, comment fixes, and README/template corrections
- [x] Files/areas touched listed — `eslint.config.mjs`, `src/lib/supabase/{admin,server}.ts` (comments), `worker/index.mjs` (unused constant), `scripts/backup-schedule.ps1` (comment), `README.md`, `docs/test-plan-template.md` §4, `docs/backlog.md`, the decision, this plan
- [x] Roles affected identified — none; no runtime behaviour changes
- [x] Anything explicitly **out of scope** written down — `src/proxy.ts`, `worker/origin.mjs`, `scripts/check-test-plan.mjs`, other imports

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR
- [x] `node scripts/gates.mjs` — typecheck, lint, build; exit codes recorded in the PR
- [x] CI green on the PR — read from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the rule fires: a scratch file outside the list importing `@/lib/supabase/admin` fails `eslint` with the rule's message; the 12 listed files pass
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role` was dropped by `0181`). The live ones are admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is retired (`0173`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing new | unchanged | n/a — comments, lint and docs only |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles all 12 importers; only comments changed in them
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file changed behaviour
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — all three; searched `admin.ts`, `README`, `test-plan-template`, `backup-schedule`, `app_role`: no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-12-service-role-fence.md` (12 importers, not 13)
- [x] `README.md` still accurate — Roles, Stack and Project structure corrected
- [ ] **Release notes.** — n/a: comments, a lint rule and documentation; no shelter user would notice. This PR touches `README.md` and `docs/`, not `src/app/`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — importers counted by grep and read; the rule proved by a failing scratch import

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: none touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration

### Rollback

- [x] Rollback position stated — nothing to roll back at runtime; a revert restores the comments

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The backlog said 13 importers; there are 12 | fixed — recorded in the decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
