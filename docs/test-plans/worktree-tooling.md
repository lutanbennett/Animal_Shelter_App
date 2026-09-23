# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Worktree tooling: `done` tells the truth, `list` shows who is in a folder, `sync` pushes, per-worktree `launch.json` |
| Backlog item | `docs/backlog.md` → Architecture: `done` reports success when it has not removed the folder; `list` should show live sessions / `done` should refuse; `sync` leaves the branch unpushed; `launch.json` hardcodes port 3000 |
| Branch / worktree | `claude/worktree-tooling` @ `C:\Development\Animal_Shelter_worktree-tooling` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | linked from the PR itself |
| Tested by / date | Claude (Tooling updates session), 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | `c3d82c6` (script behaviour); gates re-run at `3986c8d` after syncing `main` to `dfb01c3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `worktree.mjs` refuses teardowns that would lose work or strand a session, reports what it actually did, shows held/unpushed/husks in `list`, pushes on `sync`, and each checkout gets a `launch.json` for its own port
- [x] Files/areas touched listed: `scripts/worktree.mjs`, `.githooks/post-merge` (new), `.gitignore`, `.claude/launch.json` (untracked, now generated), `.claude/skills/plan-day/SKILL.md`, `CLAUDE.md`, `docs/backlog.md`, `docs/decisions.md`. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling only; no app role sees any of it
- [x] Out of scope written down: migration-numbering check, production drift, `decisions.md` union-vs-GitHub, the Fable review. `README.md` still says post-commit alone keeps GitHub in step (line ~90). The backlog-artifact stream owns README this round, so that is a follow-up

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`:

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`83bf4a6`, then again at `dfb01c3` after PRs #56 and #62, no conflicts), and the branch pushed both times
- [x] `npm run typecheck` — clean (exit 0, re-run after the second sync)
- [x] `npm run lint` — clean (exit 0 after the second sync; also `npx eslint scripts/worktree.mjs` exit 0)
- [x] `npm run build` — succeeds (exit 0, re-run after the second sync)
- [ ] CI green on the PR — n/a: not yet run at the time of writing; the PR will show it, and it is not merged without it

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Every case run against real throwaway worktrees (`wt-tool-test`, `wt-broken`,
`wt-hook-test`) created with `new`, plus the real set of worktrees on this
machine for `list`. Exit codes recorded, not inferred from output.

- [x] Happy path works end to end: `new wt-tool-test --no-install` → tree clean (the tracked `launch.json` left alone) → `done --stop-servers` stopped the holding node process, removed the folder, deleted the branch, then verified: folder gone, 0 registry rows, 0 branches, exit 0
- [x] Data persists: after `done`, `ls`, `git worktree list` and `git branch -a` all independently confirm the removal, so nothing depends on `done`'s own message
- [x] Create / edit / delete all exercised:
  - `new` ×4
  - `done` on:
    - a clean worktree (`wt-tool-test`)
    - a dirty one (`wt-probe-a`, with `--force`)
    - a broken one (`.git` deleted: `wt-broken`)
    - an empty husk (`nav-footer-fix`)
    - a `.next`-only husk (`test-plan-template`)
    - a branch pushed to origin (`wt-hook-test`: the origin branch was deleted too)
- [x] Empty state: `list` with husks present and with none tracked; `done` on a name that does not exist → `nothing called wt-broken: no worktree, no branch, no folder`, exit 1
- [x] Invalid input is rejected with a readable message, not a crash:
  - **Held by an unidentifiable process** (a node child whose cwd was the folder, standing in for a Claude session): refused with "cannot be identified — usually a Claude session…", exit 1. Folder, registry entry and branch all still present afterwards.
  - **Held by a dev server**: node running a script in the folder's `node_modules` was named as `node.exe (pid …)`, exit 1.
  - **Unpushed commits**: a commit made with hooks off; `done --force` refused with "1 commit(s) that no branch on origin has … --force does not override this", exit 1.
  - **Dirty tree**: `done` without `--force` listed `?? junk.txt`, exit 1.
  - **Broken worktree with real files**: without `--force`, refused and listed what it would delete, exit 1.
  - **Network drop**: `git fetch` failed mid-test, and `done` printed "could not fetch origin — cannot tell what is merged or pushed", exit 1. It used to print a Node stack trace.
- [x] Boundary cases:
  - **Stale registry row**: `list` with a worktree whose `.git` was deleted showed a `STALE (not a repo)` row and exited 0. It used to exit on `fatal: not a git repository`.
  - **Folder mapping**: `held` read `HELD — <session name>` for the three worktrees with live sessions and `free` for the rest, and matched `ListAgents`. It also exposed a session whose cwd was a different worktree from the one its name implied.
  - **`sync` push**: with a branch 1 ahead of origin (hook-less commit), `sync` exited 0 and left the branch level with origin.
  - **post-merge hook**: after `git merge --ff-only` of an unpushed commit, the branch was level with origin with no manual push.
  - **Browser pane**: `preview_start` with `name: "dev"` in this worktree ran `next dev --port 3002`, and the home page rendered.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling, no app surface | n/a |
| staff | n/a | tooling, no app surface | n/a |
| vet | n/a | tooling, no app surface | n/a |
| volunteer | n/a | tooling, no app surface | n/a |
| resident | n/a | tooling, no app surface | n/a |
| signed out | n/a | tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not an app feature; CLAUDE.md is its manual and is updated
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI change; the home page was only loaded to prove the pane reached the right port
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] Nearest things still work:
  - `new wt-install-test` with a real `npm ci` passed the new `.bin/next.cmd` check (exit 0, clean tree), then `done` removed it, `node_modules` included. The failure branch (`.bin` missing) was not provoked.
  - `dev` via the browser pane, `sync`, `list`, `done`, and the help text (`node scripts/worktree.mjs` with no args prints the header up to the imports)
- [x] Shared files touched: `CLAUDE.md` and `plan-day/SKILL.md` re-read after editing, and the commands they quote were the ones run above
- [x] Nothing merged from `main` during `sync` was broken: `main`'s only new commits were backlog text; typecheck/lint/build all exit 0 after the merge

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (four, moved to Completed → Architecture)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated. Covered: refuse rather than warn on a held folder, the rename check, session names as an addition only, the narrow match for dev servers, per-checkout `launch.json`, and why both the hook and `sync` push
- [ ] `README.md` still accurate — n/a: owned by the backlog-artifact stream this round. Its "post-commit pushes" sentence is now incomplete but not wrong; left as a follow-up rather than a conflict
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/`, hooks and docs are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date logic
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

- [x] Rollback position: revert the PR. Only the developer machine is affected. The one side effect that outlives a revert: after a revert the committed `.claude/launch.json` comes back, while each checkout still holds its generated one. That shows as a local modification until the checkout discards it (`git checkout .claude/launch.json`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | First holder match treated any process whose command line mentioned the folder as a dev server; `--stop-servers` killed this session's own bash tool shells, and would have killed another session's | fixed: only an executable inside the folder, or `node.exe` running a script under its `node_modules` |
| 2 | medium | A network drop during `git fetch` crashed `done` (and would crash `list`) with a Node stack trace | fixed: `done` refuses cleanly; `list` carries on with a warning |
| 3 | medium | `done` on a broken worktree (no `.git`) deleted a file git could no longer report as uncommitted, without `--force` | fixed: anything beyond build output needs `--force` |
| 4 | low | Every `sync` printed Node's DEP0190 warning (git args passed through a shell) | fixed: only `npm` gets a shell |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes. One post-merge step is scripted, not visual, so it is in the PR description instead: after merging, `git pull` in the main checkout should leave a regenerated `.claude/launch.json` (port 3000) behind, via the post-merge hook.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Tooling updates session)  Date: 2026-09-23

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: n/a: no UI or visual surface; every behaviour is a command with an exit code, all run above  Date: 2026-09-23

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; tooling only

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: 2026-09-23
