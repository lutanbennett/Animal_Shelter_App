# Harness guard reads: 25 of the 51, read one by one

2026-10-30, stream `harness-guard-reads`. Follows `2026-10-30-harness-exit-triage.md` (which listed the
51) and `2026-10-30-harness-sweep-finish.md` (which did the 25 safe ones).

## What was done

The first 25 `needs a guard` rows, in the table's order, **skipping `check-can-see-drive-file.mjs`**
(carved out to another stream this batch), so the 25 run from `check-acceptance-pdf` to
`check-migration-numbers`. Each was read, not swept. **26 rows remain** (`check-can-see-drive-file`, and the 25
from `check-no-native-date-input` onward). The table now has a last column, *guard read, 2026-10-30*, with one
entry per row read.

**The rule that sorted them.** `process.exit()` only goes wrong on Windows when a `fetch` has just run
(`scripts/lib/exit.mjs`). So a script that makes no network call cannot hit the libuv crash, and swapping it
gains nothing while a mid-script exit needs the whole remainder re-nested. Those were **left alone with the
reason**. Scripts that do make a call were converted, in one of three shapes:

- the call is last (`check-acceptance-pdf`): plain `await exitWith(n)`;
- the call ends a failure branch with a success line after it (nine scripts): `await exitWith(1);` then
  `} else { console.log(…) }`;
- the call is a bail-out in the middle with the real work after it (`check-diets-app`, `-home-screens-live`,
  `-dead-schema-drop`, `-appeals-schema`, `-community-dogs-schema`, `-donation-receipts-schema`, `-map-rooms`):
  `await exitWith(n);` then `else {` around the remainder. A module cannot `return` at top level.

## The 14 converted, 11 left alone

| verdict | scripts |
|---|---|
| swapped, last statement | acceptance-pdf (its line 42 left: inside the synchronous `pdfText`, no network) |
| swapped, `else` after a failure branch | access-requests-card, chip-scan, contact-address-fields, donate-buttons, medical-jobs-app, diets-forecast-functions, hidden-public-pages-schema, home-cards |
| swapped, remainder wrapped in `else` | appeals-schema, community-dogs-schema, dead-schema-drop, diets-app, donation-receipts-schema (line 214), home-screens-live, map-rooms |
| left alone, no network call | activity-lists, confirm-outside-transition, csp-report, deferred-notes, hard-coded-security, migration-grants |
| left alone, no network call **and** an exit-3 contract | backlog-sections, migration-numbers (3 = the pre-commit hook's refusal, told apart from a crash) |
| nothing to do | drive-token (see below) |

`check-donation-receipts-schema.mjs` line 83 is also left: an error path after a query, a large SQL template
follows it, and a crash there turns exit 1 into 127, red either way. Re-nesting SQL was not worth it.

**The one exit that mattered was an exit 0.** `check-diets-app` and `check-home-screens-live` exit 0 on a
SKIPPED / cleanup path straight after a fetch, which is the case where the crash turns a pass into a failure.
The failure-path `exit(1)`s are red either way; swapping them keeps the number exact and costs nothing.

## What the table got wrong

- **`check-drive-token.mjs`**: the `process.exit(` at line 24 is inside a **comment** ("`process.exitCode`
  rather than `process.exit()`"). The script already ends with `process.exitCode = await main()`. It was never a
  guard read. The triage regex counts comments; the other 25 safe rows were unaffected (read in #1099).
- The "first call with code after it" column is the first *call*, not the one that matters. In
  `check-diets-app` and `check-home-screens-live` it was the `exit(0)`, which is the dangerous one.
- Several "needs a guard" rows are really "last statement plus a success `console.log`": the `console.log` after
  the failure branch is a success line, so the guard is an `else`, not a `return`.

## Exit codes, before and after

Each script run with `timeout 60` (longer ones in the background) from the old file and the new one, same dev
database, dev server on 3002. A red stays red with the same code.

| script | before | after | note |
|---|---|---|---|
| acceptance-pdf | 0 | 0 | |
| access-requests-card | 1 | 1 | red before: 2 expectations fail ("not ours": undiagnosed, left). Runs ~150 s |
| appeals-schema | 0 | 0 | |
| chip-scan | 0 | 0 | |
| community-dogs-schema | 0 | 0 | |
| contact-address-fields | 0 | 0 | |
| dead-schema-drop | 0 | 0 | |
| diets-app | 0 | 0 | |
| diets-forecast-functions | 0 | 0 | |
| donate-buttons | 0 | 0 | |
| donation-receipts-schema | 0 | 0 | |
| hidden-public-pages-schema | 0 | 0 | |
| home-cards | 1 | 1 | red before, left red |
| home-screens-live | 0 | 0 | a 60 s timeout hit the old file once while the dev server compiled; 300 s run is 0 |
| map-rooms | 0 | 0 | |
| medical-jobs-app | 1 | 1 | red before: 1 expectation fails, **undiagnosed, belongs to the later stream, left exactly as it is** |

`check-access-requests-card` took over 60 s (two 61 s waits by design): noted, not characterised.
The 11 left-alone scripts were not edited, so were not re-run.

Not touched: `scripts/lib/`, `src/`, any migration, `check-can-see-drive-file`, `check-shop-links`,
`check-card-walkthrough`, `check-medication-list-due`, `check-who-does-what`.
