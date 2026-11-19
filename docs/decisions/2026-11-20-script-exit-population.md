# The 46 widened-population scripts, and unknown flags refused (2026-11-20, #scimp and #sflag)

**Step zero.** `check-script-exits.mjs` showed 46 unreviewed, `--strict-widened` exited 1, no script refused an unknown
argument. The gap was there; carried on.

## #scimp: how each of the 46 was settled

The widened condition (`process.exit(` plus an `await`, `.then(` or a child-process call) over-matches: `.exec(` on a regex
counts as a child process, and an `await import()` counts as an await. The question that matters is whether any socket or
async handle can be open when `process.exit` runs (the Windows libuv crash). Each file was read for that.

- **39 marked `// exit-ok: <reason>`**: 36 in the first batch (sync-only child processes, regex `.exec(`, local dynamic
  imports, in-memory work) and `acceptance-matrix`, `gates` (every exit is before any child starts or after all have
  closed), `dev-assistant-model` (its child-exit exit deliberately stops the stand-in server; no `fetch`).
- **7 converted** to `bail(n)` inside `main()` run by `runMain`, because they do network work (Supabase, Drive, Google) and
  their exits can follow it: `assert-schema`, `bootstrap-admin`, `dev-adopter-signin`, `dev-signin`, `google-oauth-setup`,
  `sync-home-icons`, `restore-rehearsal`. Plus `manual-screenshots`, which already had a `main()` and now ends `await runMain(main)`.
- **`dev-signin.mjs` converted and its exemption removed** (#1736 and #1748 both merged; the reason had expired). `EXEMPT` is
  now empty on purpose.
- **`restore-rehearsal`'s `catch` now rethrows `ExitRequest`**, as `shelter-export` does: its `fail()` is called from
  `exe()` inside the `try`, and a swallowed bail would turn into "Stopped: exit 1" and `failures++`. The `finally` (stop the
  throwaway server, delete the folder) now runs on that exit, which `process.exit` used to skip.

**Exit codes are unchanged** for each converted script: every `process.exit(n)` became `bail(n)` with the same `n`; the
fall-through paths still end 0. `apply-migrations`, `deploy` and `backup` were not in this population and were not touched.
None of the converted scripts was run (they write to the shared dev database or need credentials); verified by reading, `node
--check`, and `check-script-exits.mjs`.

**`--strict-widened` is now in `npm run lint`** (the list is empty, so it is blocking and green).

## #sflag: one shared guard, not four

`scripts/lib/args.mjs`: `unknownArgs(args, { flags, valued })` and `unknownArgsMessage`. A shared helper, because the fault
is a habit (`args.includes("--apply")` reads only what it expects) and the next onboarding script is safe by default only if
the safe way is one import away; four local guards would repeat the habit. The risk the planner named, one change breaking
three scripts, is covered by `scripts/args.test.mjs` (4 tests, run by `npm test`).

A bare token that is nobody's value is refused too (a forgotten `--`). A valued flag swallows the next token as its value
without judging it; the script's own value check still applies.

**Scope, listed rather than assumed:** the four scripts on the onboarding path that write or can write through the service
role: `populate-shelter-settings`, `connect-shelter-drive`, `connect-shelter-calendar`, `shelter-export`. The guard is the
first statement of each, before `loadEnv` and before any request. Exit 2 (1 in `shelter-export`, whose `fail()` always exits 1).
Not in scope: scripts outside onboarding, which are listed by `grep -ln "args.includes" scripts/*.mjs` for anyone who wants
the same treatment.

**How nothing-written was proved:** each script was run with a mistyped flag (`--dryrun`, `--aply`, `--foldr`, `--dry-run`,
`--provee`); each printed the argument's name and "nothing was done" and exited non-zero without reading the environment or
making a request (the guard sits above `loadEnv`). Then `populate-shelter-settings.mjs --env test` with valid flags ran its
read-only path unchanged ("already set; nothing to do", exit 0).
