# Feature test plan — gates-command

## Header

| | |
|---|---|
| Feature | `scripts/gates.mjs`: one command running typecheck, lint and build, printing each exit code |
| Backlog item | `docs/backlog.md` → Architecture → "One command to run the three gates, printing each exit code" |
| Branch / worktree | `claude/gates-command` @ `C:\Development\Animal_Shelter_gates-command` |
| Dev server | not used — no UI surface |
| PR | #78 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `6c94a5c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a script that runs all three gates via `spawnSync`, each even after a failure, prints `typecheck=N lint=N build=N`, exits non-zero if any failed, and refuses to run when `node_modules/.bin/next` is missing
- [x] Files/areas touched listed: `scripts/gates.mjs` (new), `CLAUDE.md` (one line, merge-train step), `README.md` (one line), `docs/test-plan-template.md` (section 2), `docs/backlog.md`, `docs/decisions.md`. Nothing under `src/`, `worker/` or `supabase/`
- [x] Roles affected identified: none. This is developer tooling, and no app role reaches it
- [x] Out of scope: CI itself is unchanged. `ci.yml` still runs the three `npm run` steps separately, which already report each step's own status. Local runs differ from CI in two ways, both recorded in `docs/decisions.md`: `.env.local` instead of placeholder Supabase values, and whatever Node version is installed locally (24 here) instead of Node 22

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`, which is the command this PR adds.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — exit 0

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 108s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 192s
=== gates: build — npm run build
=== gates: build exited 0 after 194s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three): `check` passed in 1m33s on #78 (run 35906325161), and the `test-plan` log says `check-test-plan: ok`, not merely a green job, since that job is `continue-on-error`

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

- [x] Happy path works end to end: the clean run in section 2, exit 0
- [ ] Data persists — n/a: the script stores nothing
- [ ] Create / edit / delete all exercised — n/a: no records involved
- [x] Empty state renders sensibly: with `node_modules/.bin/next.cmd` temporarily renamed, the script printed `gates: node_modules/.bin has no next — nothing was run.` and an explanation, then exited 2 without running any gate. The shim was restored and checked
- [x] Invalid input is rejected with a readable message, not a crash: `--bogus` printed `gates: unknown argument --bogus — see --help` and exited 2. `--help` exited 0
- [x] Boundary cases checked. **A failing gate does not stop the ones after it.** With a throwaway `src/gates-probe.ts` holding a type error, all three still ran, and the summary and exit code were right. The file was deleted afterwards and `git status` confirmed no `src/` change remained:

```
=== gates: typecheck exited 2 after 91s
=== gates: lint exited 0 after 352s
=== gates: build exited 1 after 471s
gates: FAILED — typecheck, build
gates: typecheck=2 lint=0 build=1
exit=1
```

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | developer script, not part of the app | n/a |
| management | n/a | developer script, not part of the app | n/a |
| staff | n/a | developer script, not part of the app | n/a |
| vet | n/a | developer script, not part of the app | n/a |
| volunteer | n/a | developer script, not part of the app | n/a |
| signed out | n/a | developer script, not part of the app | n/a |

- [ ] Every role above tested — n/a: no app surface; the script runs on a developer machine only
- [ ] A role that should not have access is blocked server-side — n/a: no route or RPC added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: developer tooling, not a shelter feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no `src/` file changed; the clean `build=0` covers the app compiling
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared files touched are docs (`CLAUDE.md`, `README.md`, the template); no runtime file
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync was "Already up to date", and the clean gates ran at that merged tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (moved to Completed → Architecture)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why every gate runs, why `npm run` rather than direct binaries, why `--plan` is opt-in, the known local-vs-CI differences
- [x] `README.md` still accurate (workflow summary now names `node scripts/gates.mjs`)
- [ ] **Release notes.** n/a: a developer script; no shelter user sees any change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each claim was checked by a run: all gates run after a failure (the probe run), the refusal happens before anything runs (the renamed-shim run), and the exit codes (above). The claim that the placeholder env is equivalent at build time comes from `ci.yml`'s own comment, and the decisions entry says so rather than asserting it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the next production release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the next production release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed bundle changes; `scripts/gates.mjs` is not imported by the app or Worker
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: the script handles no dates
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or banding logic; the pass/fail boundary (any non-zero code) was exercised both ways in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The fenced blocks are the `grep -E "^(=== gates|gates:)"` of each run's log. The failure block keeps only the `exited` lines and the summary; nothing was retyped
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

- [x] Rollback position stated: revert the PR. Nothing is deployed or migrated. After a revert, the docs would again name the `&&` chain

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

Empty. The change has no screen to look at, and every behaviour above was
exercised by a scripted run whose output is pasted here.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: developer script with no screen; every behaviour was exercised by a scripted run recorded above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed

Result: pass

Release manager acknowledgement: n/a: nothing deployed
