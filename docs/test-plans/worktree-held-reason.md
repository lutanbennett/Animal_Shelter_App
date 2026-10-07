# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `worktree.mjs list` says what holds a HELD folder (`HELD by a dev server on port N`); `done` names a dev-server-only holder; `/clean-streams` may offer `--stop-servers` for exactly that case |
| Backlog item | `docs/backlog.md` → Admin: `worktree.mjs list` should say WHY a folder is HELD |
| Branch / worktree | `claude/worktree-held-reason` @ `C:\Development\Animal_Shelter_worktree-held-reason` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (started only as a test fixture) |
| PR | linked from the PR itself |
| Tested by / date | Claude (worktree-held-reason session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `7717aa4f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `holders()` now returns each process's command line, `describeProcs()` classifies a `next` process under the folder as a dev server (with its port), `list`'s `held` column reads `HELD by a dev server on port N` / `HELD by node.exe (pid N)` unless a named session is present, and `done`'s refusal names a dev-server-only holder and the flag. The "should `done` stop it by itself" question is answered **no**, with reasons, in the decision file
- [x] Files/areas touched listed: `scripts/worktree.mjs`, `.claude/skills/clean-streams/SKILL.md`, `docs/backlog.md`, `docs/decisions/2026-10-07-worktree-held-reason.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling only; no app role sees any of it
- [x] Out of scope written down: editing the "Stale streams" paragraph of `CLAUDE.md` (proposed in the decision file and the PR, since it is the user's file), classifying wrangler/workerd as stoppable, and the `HELD` line for husks, which still names a session or "nobody named"

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 172s

gates: typecheck=0 lint=0 build=0
```

`node scripts/check-script-integrity.mjs` → `script-integrity: ok` (144 .mjs files parsed).

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Run against a throwaway worktree (`held-probe`, created with `new`, port 3009, removed by `done` at the end of each run) and against the two live siblings read-only. No sibling's server was stopped.

- [x] Happy path works end to end. `list` from the main checkout, with a `next dev` server running in the throwaway and no session in it:

```
│ 6  │ 'Animal_Shelter_held-probe'  │ 'HELD by a dev server on port 3009'
```

  `done held-probe` with no flag refused, exit 1, and said:

```
worktree: C:\Development\Animal_Shelter_held-probe is held only by a dev server on port 3009 — no Claude session is in it.
Nothing else needs closing: re-run with --stop-servers to end it, which also lets this folder go.
```

  `done held-probe --stop-servers` ended both processes of the pair (`next dev` and its `start-server.js` child) and finished `done — folder removed, worktree unregistered, claude/held-probe gone locally and on origin`.
- [x] Data persists — the state `done` leaves was checked by its own closing check (folder, registry, local branch, `origin` branch all gone)
- [x] Create / edit / delete all exercised: `new held-probe` ×2, `done` ×4 (refused without the flag, then with it, twice)
- [x] Empty state: with no dev server, `list` shows `free` for the other worktrees as before
- [x] Invalid input / the case that must not change — a **named session wins**. With the sibling streams live, the same `list` printed `HELD — Perm-convert admin` and `HELD — Photo routes off predicate`, not a dev-server reason; the main checkout row still read `session: Test Manager, …`. Their servers were not touched
- [x] Boundary cases: the first run **failed** to classify the dev server (the parent runs as `node_modules\.bin\\..\next\dist\bin\next`, which does not contain `node_modules\next\`), so the column read `HELD by node.exe (pid 74380), node.exe (pid 22808)`. That is the "cannot tell" form working as designed, and it was the evidence for the fix (path folding in `describeProcs`). Re-run: `HELD by a dev server on port 3009`. Not exercised: wrangler/workerd holders and a terminal holder, which fall to the `node.exe (pid N)` / bare `HELD` form by construction

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling, no app surface | n/a |
| management | n/a | tooling, no app surface | n/a |
| staff | n/a | tooling, no app surface | n/a |
| vet | n/a | tooling, no app surface | n/a |
| volunteer | n/a | tooling, no app surface | n/a |
| signed out | n/a | tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `list` (full table, all live streams), `new`, `done` on a held worktree with and without the flag, `sync`
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged, and gates pass on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (moved to Completed → Admin)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-worktree-held-reason.md`, including the answer on `done` and the narrow definition of "dev server"
- [ ] `README.md` still accurate — n/a: README does not describe the `held` column or `--stop-servers`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: developer tooling only; no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the classification, the port and the refusal text are from the runs in §4. "Nine folders, 3.2 GB" is the backlog item's figure from 2026-10-06, not re-measured here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/`, `.claude/` and docs are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold or band; the one classification boundary (dev server vs unplaceable) was exercised on both sides in §4
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the `list` and `done` output in §4 and the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Only the developer machine is affected; nothing persistent is written

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First cut did not recognise npm's `.bin\..\next` command-line form, so a real dev server was reported as `node.exe (pid N)` | fixed before commit; re-run in §4 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: every behaviour is a command with output, run above. What only real use will show is the next `/clean-streams` against real leftovers, which is the point of the change, but there is nothing to look at now.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (worktree-held-reason session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; every behaviour is a command with output, all run above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; tooling only

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: —
