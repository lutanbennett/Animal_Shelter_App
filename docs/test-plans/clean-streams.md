# Feature test plan — clean-streams

## Header

| | |
|---|---|
| Feature | `/clean-streams` project skill: find merged leftover worktrees and husks, confirm, `worktree.mjs done` them |
| Backlog item | `docs/backlog.md` → none: requested directly by Lutan on 2026-09-24 (see `.brief.md`) |
| Branch / worktree | `claude/clean-streams` @ `C:\Development\Animal_Shelter_clean-streams` |
| Dev server | not used — no UI surface |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `14f183f` (synced tip; the plan's own commit follows) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for: a skill that runs `worktree.mjs list`, sorts worktrees into proposals (free, nothing beyond `main`, PR merged; husks) and flagged ones (held, fresh with `.brief.md` or no PR, open PR, squash-merged, unpushed/dirty, folder/branch mismatch), asks, then `done`s each confirmed one and re-lists
- [x] Files/areas touched listed: `.claude/skills/clean-streams/SKILL.md` (new), `CLAUDE.md` (one sentence under "Stale streams"), `docs/decisions.md`, this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Roles affected identified: none. Developer tooling for Claude sessions; no app role reaches it
- [x] Out of scope: `worktree.mjs` is unchanged, so `done`'s safety checks and its folder/branch-name lookup are exactly as before. The skill reports a mismatched folder rather than fixing `done`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 43s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 81s
=== gates: build — npm run build
=== gates: build exited 0 after 189s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, as far as steps 1–3: the skill's sorting was run by hand against the live worktrees on 2026-09-24 (`list`, then `gh pr list --head claude/<slug> --state all` for each `claude/*` branch, then the `.brief.md` check). It produced one proposal, `cut-release-0-2-0` (free, nothing beyond `main`, #84 MERGED); held and not proposed: `cashflow`, `utc-today`, `vet-doctor-name`, `worktree-tooling` (the last also 11 ahead although #58 merged — squash-merged, so flagged); not proposed, PR open: `sync-test-on-release` (#79 OPEN, 1 ahead); never candidates: `Animal_Shelter_App`, `Animal_Shelter_Backlog`, and this checkout. The multi-select was put to Lutan, who chose to skip removal, so step 4 (`done`) was not exercised in this test
- [ ] Data persists — n/a: the skill stores nothing
- [ ] Create / edit / delete all exercised — n/a: the one destructive step is `worktree.mjs done`, unchanged by this PR and not run here (see above and the manual list)
- [x] Empty state renders sensibly: the skill says what to do with no proposals (report clean, list held/flagged, stop)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the skill takes no arguments; `done`'s refusals are passed through verbatim
- [ ] Boundary cases checked — n/a: no husk, no fresh no-PR stream and no folder/branch mismatch existed at test time, so those branches of the skill were read, not run

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | Claude skill, not part of the app | n/a |
| management | n/a | Claude skill, not part of the app | n/a |
| staff | n/a | Claude skill, not part of the app | n/a |
| vet | n/a | Claude skill, not part of the app | n/a |
| volunteer | n/a | Claude skill, not part of the app | n/a |
| signed out | n/a | Claude skill, not part of the app | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no route or RPC added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: developer tooling, not a shelter feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed; the clean `build=0` covers the app compiling
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared files touched are docs (`CLAUDE.md`, `docs/decisions.md`)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates ran at the synced tip

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item; requested directly
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why a skill rather than a `worktree.mjs clean` subcommand
- [ ] `README.md` still accurate — n/a: README does not describe the worktree clean-up round; CLAUDE.md "Stale streams" now names the skill
- [ ] **Release notes.** n/a: a Claude skill for the developer's worktrees; no shelter user sees any change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The squash-merge example was checked: `claude/worktree-tooling` resolves to #58's `headRefOid` (`2006910`) and `git log origin/main..claude/worktree-tooling` is non-empty

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the next production release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the next production release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed bundle changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates handled
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or banding logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block is the `^(=== gates|gates:)` lines of the run's log
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR changes nothing that is deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: this PR changes nothing that is deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Nothing is deployed or migrated

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Invoke `/clean-streams` in a fresh session, confirm its summary and proposals match `worktree.mjs list`, and let it `done` at least one merged leftover (e.g. `cut-release-0-2-0`) end to end | a session on `C:\Development\Animal_Shelter_App` after this PR merges |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is Lutan's

Manual verification by: pending: Lutan to run `/clean-streams` from the main checkout once merged (item 1)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed

Result: pass

Release manager acknowledgement: n/a: nothing deployed
