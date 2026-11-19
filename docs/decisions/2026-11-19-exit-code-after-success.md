# A script that exits non-zero after it succeeded (#uvcls), and the build halt, re-measured (2026-11-19)

## What was already known

`docs/decisions/2026-10-16-shared-exit-helper.md` measured this on 2026-10-16 and shipped `scripts/lib/exit.mjs`
(`exitWith`). `#uvcls` was filed without it being found. What was missing was **the 2026-11-19 occurrences**: the
scripts that still end in a bare `process.exit(...)` after a `fetch`.

## The repro (Node v24.19.0, Windows 11). Kept in the session scratchpad, not in `scripts/`

Each variant run three times against `https://example.com`:

| script | exit | libuv assertion |
|---|---|---|
| `await fetch(...)`, print, `process.exit(0)` | **127** x3 | yes |
| `await fetch(...)`, print, no exit call | 0 x3 | no |
| print, `process.exit(0)`, no fetch | 0 x3 | no |
| fetch, close undici global dispatcher, then `process.exit(0)` | **127** x3 | yes |
| fetch only the headers (body unread), print, `process.exit(0)` | **127** x3 | yes |
| same with `node --env-file=<file>`, with and without the `process.exit` | 127 / 0 | tracks `process.exit` only |

**Ruled out: `--env-file`** (changes nothing either way), **`fetch` alone** (exit 0 without `process.exit`),
**`process.exit` alone** (0 without a fetch). **Only the pair** produces it: `process.exit()` while undici's keep-alive
socket is still open. Closing the dispatcher first does not help, as 2026-10-16 also found.

## Can it be stopped? Yes, by not calling `process.exit` after a fetch

Set `process.exitCode` and let the loop empty: `await exitWith(code)` from `scripts/lib/exit.mjs`. It keeps the exit
code exact (2026-10-16: `exitWith(1)` exited 1 three times). Nothing here ignores an exit code.

**Not every run crashes.** `scripts/check-shelter-settings.mjs` ended in `process.exit(...)` after its fetch and exited
**0 on 5 of 5 re-runs today**, with no assertion, so the crash depends on whether the socket is still open at teardown:
a script that passes today can crash tomorrow. It is now converted to `exitWith` (its early `process.exit(2)` became a
`readFailed` flag so the same `exitWith` ends every path); 3 of 3 runs exit 0 and a bad `--env` still exits 2.

**Not converted, found while here (for the planner to file):** 34 `scripts/*.mjs` files contain both `fetch(` and
`process.exit(` and do not import `lib/exit.mjs` (e.g. `check-drive-token`, `connect-shelter-drive`, `deploy`,
`apply-migrations`, `backup`). Some call `process.exit` only before any fetch, so the number needing a change is smaller;
nobody has sorted them.

## The rule for READING it

**A non-zero exit, especially 127, together with a line containing `UV_HANDLE_CLOSING` and `src\win\async.c`, printed
AFTER the script's complete expected output, is teardown noise, not a failed run.** Do not file it as a defect on the
exit code alone, and do not discard exit codes in general. Instead: (1) look for the assertion line; (2) compare the
output with what success looks like for that script; (3) if both match, report the result as passed with the crash noted;
(4) if there is no assertion line, or the output is incomplete, the exit code is real. A script that matters should end
`await exitWith(code)` so the question never arises. CI runs on Linux, where the assertion cannot happen.

## The build halt, measured three more times

`node scripts/gates.mjs`, three runs in a row in this worktree, each to a file:

| run | typecheck | lint | test | build | build time | `SecurityFatalError` seen | retry fired |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 305 s (cold) | no | no |
| 2 | 0 | 0 | 0 | 0 | 63 s | no | no |
| 3 | 0 | 0 | 0 | 0 | 42 s | no | no |

**Result: 0 of 3 halted, so the retry was never exercised.** With #1671's four builds (halt, pass, halt, and its
deliberate-type-error run) the retry still has **one real halt behind it and no measured retry-then-pass**.
These runs **disagree with the old block's expectation** that builds alternate with a halt: three back-to-back runs
never halted. Not established why (the receipt TTL, a cache, or the advisory being shown only on some builds). So the
claim "a single honest run should end `build=0`" held 3 of 3 here, and "the retry is enough" remains **untested**.
