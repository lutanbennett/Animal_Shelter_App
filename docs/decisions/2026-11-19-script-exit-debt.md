# Script exit debt: the nine converted, worktree.mjs fixed, the check widened (2026-11-19, #scimp)

**Step zero.** Both checks passed on a clean tree; the gap was still there (nine `exit-debt` files, `worktree.mjs`
unmarked because it has no `fetch(`). Carried on.

## The mechanism used

`#1738`'s `exitWith` only helps a script whose exits are at its end. These nine call `fail()` from helpers, so a plain
`return code` cannot reach them. `scripts/lib/exit.mjs` gained two functions:

- `bail(code)` throws an `ExitRequest` carrying the code (it replaces `process.exit(code)`, every site, mechanically).
- `runMain(main)` runs the script's body, turns an `ExitRequest` back into its code, prints any other error's stack and
  exits 1 (what node did for an uncaught error), then `await exitWith(code)`.

Each script's top-level body was wrapped as `async function main() { … }` (imports stay above it; indentation was not
touched, so the diff is the wrapper plus `process.exit` → `bail`).

**The one hazard:** a `bail` inside a `try` whose `catch` swallows would be swallowed. Every `try` in the nine was read.
Only `shelter-export.mjs`'s `proveIt` catch could see one (its helpers call `fail()`); it now rethrows `ExitRequest`, so
`fail()`'s own message stands and its `finally` still stops the throwaway server and deletes the folder.
`restore-grants.mjs` has a `try/finally` around the whole replay: the `finally` (temp dir removal) now **runs on a
failing exit**, where `process.exit` used to skip it. That is an improvement, not a change of verdict.

## The nine, and what each exit code means (unchanged)

Every `process.exit(n)` became `bail(n)` with the same `n`; nothing was merged, split or renumbered.

| script | codes before and after |
|---|---|
| `apply-migrations` | 0 success, nothing pending, or "applied" / "no drift"; 1 a migration failed, "not applied", or drift found; 2 refused (usage, missing token, environment, guard) |
| `deploy` | 0 finished or plan printed; 2 refused before the step (missing variable, tree problem, guard); a failing `wrangler`/build step exits with its own status, or 1 |
| `backup` | 0 dumped (and uploaded, pruned) or the `--local` early finish; 1 any `fail()` (arguments, pg_dump, upload mismatch) |
| `restore-grants` | 0 target matches the backup; 1 differs, or any `fail()` |
| `shelter-export` | 0 exported or proof passed; 1 PROOF FAILED or any `fail()` |
| `reset-test-data` | 2 for wrong usage and for every refusal (`fail()` also exits 2); 0 done |
| `add-product-admin`, `fix-panda-placements`, `check-resident-sections` | as before: 0 ok, 1 failure, 2 usage where they had it |

None of the nine was **run** (production-touching, brief forbids it): verified by reading each diff, `node --check`, and the
checks.

## worktree.mjs

It is **fully synchronous** (`execFileSync`/`spawnSync`, no `fetch`, no `await`), so the fetch mechanism does not
explain its crash and I did not re-diagnose it. Its two exits (`fail()` and the usage branch) now go through
`bail`/`runMain`, so it ends the way the other scripts do. Exit codes measured after the change: unknown command 1, no
command 0, `done` with no argument 1 (via `fail()`). **Not established:** that this removes the crash; the one occurrence
was not reproduced. If `worktree.mjs done` dies again, the cause is something other than the exit call.

## The widened check

A pattern cannot know which exits follow an open handle. The widened population is **`process.exit(` plus any `await`,
`.then(` or child process call** in a file with no `exitWith` import and no marker. On this tree that is **46 scripts**.
They are **listed and counted but do not fail the check** (`--list` names them; `--strict-widened` fails on them). A blocking
widening would have turned CI red for every stream over scripts nobody has read; converting or marking them is the
follow-up, **for the planner to file**. The original population (`fetch(` + `process.exit(`) still blocks, and is now
clean: 15 use `exitWith`, 8 exit-ok, the nine are converted (they no longer contain `process.exit(`), 1 exempt.
Proven with planted cases: an unmarked fetch+exit fails; a spawn+exit is counted as unreviewed; a helper user is ignored.

**`#scimp` is NOT ticked**: deliverables 3 and 5 are done, 6 is done only as a non-blocking list.
