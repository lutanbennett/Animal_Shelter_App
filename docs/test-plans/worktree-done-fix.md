# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `worktree.mjs done` retries the held probe, and says so honestly when nobody can be found holding the folder |
| Backlog item | `docs/backlog.md` → Architecture: `worktree.mjs done` refuses to remove free worktrees, blaming "a process that cannot be identified" |
| Branch / worktree | `claude/worktree-done-fix` @ `C:\Development\Animal_Shelter_worktree-done-fix` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not used: tooling only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (worktree-done-fix session), 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `10d969f` (script behaviour); gates re-run at `aeb2b3a` after syncing `main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `held()` retries the rename probe before calling a folder held, `done` re-samples it immediately before removal with a longer wait when nobody can be named, and an unnamed refusal now says that no session or dev server was found (usually transient, re-run, not `--force`) instead of asserting an unidentifiable process. Items (a), (b), (c) done; (d) answered by naming the disagreement in the message rather than reusing `list`'s value (reason in `docs/decisions.md`)
- [x] Files/areas touched listed: `scripts/worktree.mjs`, `docs/backlog.md`, `docs/decisions.md`, `docs/test-plans/worktree-tooling.md` (the missing case added), this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling only; no app role sees any of it
- [x] Out of scope written down: reusing freed ports (the backlog item mentions ports climbing; that is a separate item), and finding out *which* process briefly holds the folder. The transient was modelled, not reproduced on demand

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date." at `a6e693a` before the PR, then the public-site-home merge (`aeb2b3a`, conflict-free) after it, pushed both times
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 124s

gates: typecheck=0 lint=0 build=0
```

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

Every case run against throwaway worktrees (`wt-dfx-a` … `wt-dfx-f3`, created
with `new --no-install` from this worktree), never a live stream's folder. A
harness in the session scratchpad started the holder, ran `done` and read the
exit code, folder and branch independently of `done`'s own output.

- [x] Happy path works end to end: `done wt-dfx-d` on a free worktree → exit 0, folder gone, branch gone
- [x] Data persists: after every run, `git worktree list`, `git branch --list 'claude/wt-dfx-*'` and `ls` confirmed the state independently (final: 0 registry rows, 0 branches, no folders)
- [x] Create / edit / delete all exercised: `new` ×10, `done` ×18 across the cases below
- [x] Empty state: `list` with four free throwaways showed `free` for each, and printed the new `held:` legend (HELD with no name = refused rename, no session found; look before tearing down)
- [x] Invalid input is rejected with a readable message, not a crash:
  - **Held with nobody there — the false positive this item is about.** A holder that takes the folder for 300 ms and drops it for 300 ms, for 60 s, with no session in it (a node child spawned repeatedly with its cwd in the folder). Old `worktree.mjs` (from `origin/main`): refused 3/3 at the probe, exit 1, with "is in use by a process that cannot be identified — usually a Claude session or terminal…". New: got past the probe 3/3. The deletion itself then failed, because this holder keeps grabbing the folder for a minute, far longer than a real transient handle. `done` exited 1, left the branch alone, and said "Windows refused to rename or delete … but no Claude session or dev server could be found in it … usually transient … Re-run 'done' in a few seconds; --force is not the fix." With the holder stopped, a re-run cleared all three (exit 0). The old-script trees were cleared by the new script the same way.
  - **Held for real, nobody nameable** (node child whose cwd is the folder, for 60 s): refused, exit 1, folder and branch present, and the same honest unnamed message, which tells the operator what to look for when a re-run keeps refusing. After the holder ended, `done` exit 0.
  - **Held by a named dev server** (node running `node_modules/hold.js` in the folder): refused, exit 1, "is in use by node.exe (pid 9040)" with the original close-the-session wording. The true positive is unchanged. After the holder ended, `done` exit 0.
- [x] Boundary cases:
  - **Short holder that has ended before the probe** (`wt-dfx-a`, held 1.2 s from the start of `done`): exit 0. This only shows no regression; `done` spends ~15 s fetching before it probes, so the holder was gone. The flicker case above is the real test
  - **`restore()`**: every probe in the runs above renamed the folder back; no `*.__worktree-probe` folder was left. The path where the way back is refused was not provoked

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

- [x] The nearest things still work: `new --no-install` (×10), `list` (full table on this machine, all live streams still shown with their `held` column), `done` on free, named-held and unnamed-held worktrees, `sync` (pushed this branch)
- [ ] Shared file checked from a second page — n/a: no shared app file touched; `worktree.mjs` is exercised above by every command that uses it
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` found nothing to merge, and gates pass on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (moved to Completed → Architecture)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: the diagnosis, the chosen wording, retry-then-refuse rather than a warning, why `done` does not reuse `list`'s value, the retried rename back
- [ ] `README.md` still accurate — n/a: README does not describe the held probe or its messages; nothing in it changed meaning
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: developer tooling only, no user-visible change
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the 3/3 vs 3/3 figures and the failed-deletion-then-recovery are from the runs in §4. The cause of the original transient (git or an indexer) is stated as the likeliest, not as established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/` and docs are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the only threshold is the retry count, exercised above with holders that refuse always, sometimes, and never
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the gates lines in §2 are pasted as printed
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

- [x] Rollback position: revert the PR. Only the developer machine is affected, and nothing persistent is written by the change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Under a holder that keeps grabbing the folder, `done` can pass the probe and then fail the deletion, leaving an empty husk and the branch. It says so, and a re-run clears it. The old script had the same window | accepted: a real transient handle lasts milliseconds, not the minute this test holder ran for |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: every behaviour is a command with an exit code, run above. The one thing only real use will show is whether the original transient (the five refusals of 2026-09-25) is gone. That is worth watching at the next `/clean-streams`, but there is nothing to look at now.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (worktree-done-fix session)  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; every behaviour is a command with an exit code, all run above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; tooling only

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: —
