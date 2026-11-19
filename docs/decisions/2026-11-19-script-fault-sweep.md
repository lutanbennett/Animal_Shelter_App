# Script fault sweep: two checks, and which scripts are at risk (2026-11-19, #scimp)

**Step zero.** Still open on `main`: 26 `.mjs` import a `.ts` module (31 counting the `lib/` and `pi/` ones the planner's
grep missed), 103 contain `process.exit(`, 33 had `fetch(` and `process.exit(` without `lib/exit.mjs`; no check existed.

## Fault one: a script reaching a TS module with extensionless imports

`scripts/check-script-ts-imports.mjs` lists every script importing `.ts` (`--list`) and follows each reached `.ts` file's
relative imports. Result on this tree: **31 scripts, all safe.** Four look unsafe to a plain walk and are not:
`assistant-eval-replay.test.mjs`, `connect-shelter-calendar.test.mjs`, `connect-shelter-drive.test.mjs` run under
`npm test`, which loads `scripts/test-support/register.mjs` (a resolver that adds extensions), and
`assistant-eval-replay.mjs` registers `resolve-hooks.mjs` itself. The check exempts exactly those two shapes (a `*.test.mjs`,
or a script naming `resolve-hooks.mjs`). A test run directly with `node`, without `--import`, would still fail; nobody does.
Proven against a planted extensionless import (fails) and its fix (passes). No script needed changing.

## Fault two: `process.exit` after a `fetch`

**How I decided which can crash.** Textual order is not enough: `backup.mjs`, `restore-grants.mjs` and `pi/check-assets.mjs`
define a `fail()` helper above their fetch and call it after. So each file's exit sites were read. A top-level exit before
any fetch has run is safe (no socket exists yet); an exit in a helper, or after an `await fetch`, is at risk.

- **Converted (15 files use `exitWith`):** `check-public-heads`, `check-scheduled-writers`, `check-status-health`,
  `check-tenancy-shared-tables`, `count-sara-am-archives`, `drive-sharing`, `connect-shelter-calendar`,
  `connect-shelter-drive`, `populate-shelter-settings`, `throwaway-utc-date-audit`, `load-role-draft`,
  `regress-tenancy-reown`, `correct-calendar-cancelled`, `pi/check-assets`, `pi/drive-mirror`. Linear scripts were wrapped as
  `async function main()` where each `process.exit(n)` became `return n`, ending `await exitWith(await main())`; this keeps
  "stop here" semantics, which a bare `exitWith` (it returns) would lose. Exits before the first fetch were left.
  Only the two connect scripts were run (no arguments, so they stop at validation with exit 2, as before); the rest are
  syntax-checked and read, not run, because they write to databases or need credentials.
- **`exit-ok` (8 files, read and verified):** every exit runs before any fetch.
- **`exit-debt` (9 files, at risk, not converted):** `add-product-admin`, `apply-migrations`, `backup`,
  `check-resident-sections`, `deploy`, `fix-panda-placements`, `reset-test-data`, `restore-grants`, `shelter-export`.
  Their exits sit in helpers or mid-flow and need a restructure, not a swap; doing that blind in files I cannot run is how a
  release script gets broken. **For the planner to file.**
- **Not mine, reported:** `scripts/dev-signin.mjs` has fetch + exit without the helper; exempted by name in the check.

## The checks

`scripts/check-script-exits.mjs`: a file with both calls in code (comments ignored) must import `lib/exit.mjs`, or carry
`// exit-ok: <reason>` or `// exit-debt: <reason>`; otherwise it fails. The marker is the human judgement (a pattern cannot
decide it) and the check is its guard, so a new script cannot add the fault silently. Debt is listed on every run.
Proven against a planted unmarked script (fails), a marked one and a helper-importing one (pass).

**One check or two: two.** Different mechanisms, different fixes, and a combined run would bury a one-line import fault under
exit-debt output. They share a shape and a place.

**Where they run:** appended to `npm run lint`, so CI's lint job and `gates.mjs` run them. **This makes both blocking in CI**
(a red lint blocks the merge). Both read only `scripts/`, take about a second, and are green on the whole tree today, so the
product-admin stream's PR passes unless it adds a script with fetch + exit and no marker.

**Not covered:** a fetch made inside an imported lib, and a `.ts` file imported by a computed path.

`#scimp` is **not ticked**: fault one is closed (listed, safe, guarded); fault two is guarded and 15 fixed, but 9 are at risk.
