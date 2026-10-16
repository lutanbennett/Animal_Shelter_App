# Shared exit helper for scripts that fetch (2026-10-16)

**Problem.** On Windows, `process.exit()` right after a `fetch` can die in libuv
(`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c`) and exit 127, after the
script already printed its verdict. For `facility-map-holders.mjs` non-zero means "do not apply".

**Measured, not reasoned.** Before: exit 127 reproduced twice against test. Closing the undici
dispatcher and then calling `process.exit` still gave 127. Not calling `process.exit` gave 0. So
the trigger is `process.exit` itself with the socket open.

**Contract of `scripts/lib/exit.mjs` `exitWith(code)`.** Sets `process.exitCode`, closes the shared
dispatcher if one exists, flushes stdout/stderr, returns. Node exits when the loop empties. It must
be the last thing a script does and does not stop the script. It never changes the code: a probe
script ending `exitWith(1)` exited 1 three times; fixed `facility-map-holders` exited 0 twice.

**Scope.** The 15 scripts that `fetch` and end in a top-level `process.exit(...)`. Early
`process.exit(2)` usage errors before any fetch stay as they are.

**CI exposure.** None. The assertion is in `src\win`; CI runs on ubuntu-latest. The bare
`node scripts/check-*.mjs` steps (script-integrity, actions-key, site-hosts, public-paths,
cards-count, public-views and the `--base` ones) could not hit it. Interim rule stands for local
Windows runs of scripts not yet converted: non-zero with an `async.c` line is noise, without one is real.
