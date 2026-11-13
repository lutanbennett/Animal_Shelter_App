# Feature test plan — drive-lockdown-confirmation

## Header

| | |
|---|---|
| Feature | Friday's Drive "lockdown" confirmation: production re-measured, identity caveat written down, UAT rehearsal as far as it goes |
| Backlog item | `docs/backlog.md` → #yy9fz (ticked in this PR) |
| Branch / worktree | `claude/drive-lockdown-confirmation` @ `C:\Development\Animal_Shelter_drive-lockdown-confirmation` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not used: no UI surface) |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 74ae6443c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a decision file, a backlog tick and this plan record that production's Drive tree measured 0 `anyone` permissions on 2026-11-13; no code changed
- [x] Files/areas touched listed — `docs/decisions/2026-11-13-drive-lockdown-confirmation.md`, `docs/backlog.md` (#yy9fz only), `docs/test-plans/drive-lockdown-confirmation.md`. No routes, `worker/`, migrations or shared libs
- [ ] Cards affected identified — n/a: no card, page, activity or permission changed; Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — any write to production (refused by the script), `--restore` on anything, the Worker deploy, `#98se8`'s residue (batch 3's), `#52y56`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge commit `74ae6443c`)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`. Closing lines as printed by my run:

```
=== gates: typecheck exited 0 after 41s
=== gates: lint exited 0 after 117s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 123s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no schema or data change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The functional check of this change is the measurement itself, run bare and in the foreground on 2026-11-13:
`node scripts/drive-sharing.mjs --env production` → `357 folders, 988 files, 0 shortcuts / anyone-shared 0 / failed 0`, exit 0;
`--env uat` → `347 folders, 916 files / anyone-shared 0 / failed 0`, exit 0; `--env uat --remove` → `changed 0, skipped 1263, failed 0`, exit 0.
Full text is in the decision file. No production write was made (the script refuses them); `--restore` was not run on anything.

- [x] Happy path works end to end — the production report ran to completion and reported 0 shared, exit 0
- [ ] Data persists — n/a: no data written anywhere; the three runs were report-only or a no-op `--remove`
- [ ] Create / edit / delete all exercised — n/a: no feature with those operations; the one delete path (`permissions.delete`) is not exercised and the decision file says so
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; the missing `.env.deploy.production` case did stop with a readable message, which is how the worktree gap was found
- [ ] Boundary cases checked — n/a: no new code; walk coverage limits (trashed items, shortcuts, items outside the identity's reach) are written up in the decision file

### Role access matrix

No page, route or permission changed.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | n/a | n/a |
| signed out | nothing changed | n/a | n/a |

- [ ] Every login above tested — n/a: no access surface changed
- [ ] A login that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code or page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched (docs only)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge (above)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #yy9fz retitled, ticked, old title marked SUPERSEDED in place
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-drive-lockdown-confirmation.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** — n/a: a confirmation that nothing changed is not something a shelter user would notice; no code or user-facing text changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The figures are the scripts' own output. The identity paragraph separates what the code and config show from what could not be established (the Worker's token value; items outside the identity's reach)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time (docs only, nothing to deploy)
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: release manager (no code to deploy)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (no code to deploy)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic touched
- [ ] Boundary or banding change assertions — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Gates block above is the run's own output; the Drive figures are copied from the scripts' summaries
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive or rewriting migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: docs only; reverting the PR restores the previous wording. Nothing in Drive or production was changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `worktree.mjs new` copies only `.env.local`, so `drive-sharing.mjs --env production` or `--env uat` (any `loadEnv` script) stops in a fresh worktree with ".env.deploy.production is missing or empty" | accepted: worked around by copying the gitignored files in; named found-not-fixed in the decision file, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: no UI surface and no behaviour change | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: nothing for a person to look at

Manual verification by: n/a: no UI surface and no behaviour change, so nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the release manager's pre-deploy pass; nothing here needs a deploy

Result: pass

Release manager acknowledgement: pending: release manager's pre-deploy pass
