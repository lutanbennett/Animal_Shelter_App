# A test runner for the pure security modules (2026-10-12)

Backlog item: architecture review C6. Branch `claude/test-runner-node-test`.

## What was decided

- **`npm test` is Node's built-in `node --test`.** No dependency, free, nothing
  to keep patched. It is step three in CI's `check` job and in
  `scripts/gates.mjs` (now `typecheck`, `lint`, `test`, `build`). About a
  second; no network, database or browser, and anything needing one does not
  belong in it.
- **One `*.test.mjs` beside each of the eight modules:** `public-paths.ts`,
  `auth/next-path.ts`, `auth/same-origin.ts`, `permissions/can.ts`,
  `auth/password-change.ts`, `worker/origin.mjs`, `worker/csp-report.mjs`,
  `worker/translations.mjs`.
- **Tests assert the rule with literal values, not the module's own tables.**
  Each one leans on the dangerous direction (a path wrongly public, a
  permission wrongly granted, a write wrongly replayed) and on awkward inputs.

## How the `.ts` modules are loaded

Node 22.18+ strips types itself, so `public-paths.ts`, `next-path.ts` and
`password-change.ts` import with no help. Two did not:

- `can.ts` imports `./catalogue` with no extension, and `same-origin.ts`
  imports `@/lib/site-hosts` (tsconfig alias) and `next/server`.

Rather than change either module to suit the runner, `scripts/test-support/`
registers a small resolve hook (`--import`) that adds `.ts` to extensionless
relative imports, resolves `@/`, and swaps `next/server` for a four-line
`NextResponse.json` stand-in. It is test-only and ships nowhere. The
`MODULE_TYPELESS_PACKAGE_JSON` warning is silenced with
`--disable-warning`, the same as `lint` already does for its `.ts` scripts.
Needs the Node 22 CI uses (`node-version: 22` resolves to a release past 22.18).

## A test failed against today's code: a real bug, fixed

`safeNextPath("/a/..//evil.com")` returned `//evil.com`. The URL parser resolves
the dot-segment and leaves the pathname `//evil.com`, which the origin check
cannot see and a browser reads as another site. `login/actions.ts` redirects to
that value directly after a password sign-in (the OAuth callback prefixes the
site origin, so it stayed on-site). The fix is one fail-closed line in
`next-path.ts` (refuse a result starting with `//`), in its own commit. The
test was not adjusted. `check-next-path.mjs` did not cover this input.

## Deliberately not done

- The four pure `check-*` scripts (`check-public-paths`, `check-worker-origin`,
  `check-csp-report`, `check-translate-worker`) are **not migrated**; they still
  run where they did. Moving them is the "over time" part of the item.
- The thirteen red database-driven harnesses are untouched.
- `runTranslations` is tested only for its not-configured path; its end-to-end
  behaviour (fake `fetch`) is still covered by `check-translate-worker.mjs`.
