# A lock file between `npm ci` and the build (`#tugyn`)

## Evidence of cause (npm logs, `%LOCALAPPDATA%\npm-cache\_logs\`, UTC, 2026-11-03)
- 06:54:03 `npm run opennext:build` starts in the main checkout (the 0.41.3 test deploy).
- 06:57:54 `npm ci` starts in the same checkout (the daily sync) and dies `EPERM … unlink
  node_modules\@ast-grep\napi-win32-x64-msvc\ast-grep-napi.win32-x64-msvc.node`, exit -4048: the file
  the running build held open.
- The build then fails with the ENOENT storm; 07:03:10 `npm ci` exits 0; 07:04:56 the retry succeeds.
- `npm ci` deletes `node_modules` first, and the damage (directories present but empty, no reparse
  points) is what an interrupted delete leaves. Not what a copy step leaves.

## The Windows junction preload is ruled out
`scripts/win-junction-symlinks.cjs` was the earlier suspect. The failing syscall was `unlink` by npm, the
damage is a half-removed tree with no reparse points, and the worktree-teardown suspect started at
14:01:38 against damage at 13:57–13:58 local. Nobody should read the preload against this failure again.
I found no reason to doubt the log reading.

## What was built
- `scripts/lib/tree-lock.mjs`: `.tree.lock` (gitignored) in the checkout root, created with `wx` so two
  starters cannot both win. Holds `{kind, pid, since}`. A live holder makes the second taker **throw with
  who holds it and what to do**. A lock whose pid is gone is taken over with a warning. An unreadable lock
  refuses. Released on process exit.
- `scripts/guarded-install.mjs`: `npm ci` under the lock, exit 1 on refusal. `/plan-day` step 1 and the
  `CLAUDE.md` "main checkout" line now run it instead of bare `npm ci`.
- `scripts/deploy.mjs` takes the lock as `build` before `opennext:build` (not under `--skip-build` or
  `--plan`, which do not read the tree), and `treeProblems()` checks six packages' `package.json`
  first. That check is **a clearer error, not a cure**.

## Why this and not the alternatives
- **Process sniffing in the sync** (look for a live `node`/`workerd`): rejected, it is a guess about
  names, silently wrong on a renamed process, and a dev server would false-positive.
- **Prose only in `/plan-day`**: it is what already existed and it failed, because the planner ran the
  install while a release session, which it cannot see, was building.
- **Lock file**: both sides name each other in the refusal, and the refusal is the loud failure the
  brief asked for. It never skips the install silently.

## Limits (said plainly)
- Only `deploy.mjs` builds and `guarded-install.mjs` installs take the lock. A bare `npm ci`, a bare
  `npm run opennext:build` or `gates.mjs`'s `next build` is not guarded. Stale-lock takeover trusts the pid
  (a reused pid would look alive and refuse, which errs closed).
- The lock is per checkout, so worktrees are independent, which is right: each has its own `node_modules`.
- Release-note: n/a, build tooling.
