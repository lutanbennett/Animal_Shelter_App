# How many database refusal sentences are English-only, and what shape fixes them (2026-11-03)

Stream `sql-refusal-english-count`. Report only: no SQL, migration, dictionary key or app code changed.
Backlog item: *Refusal sentences that come from the database are English only* (`## Architecture`).

## The count

**Source: the migration files in this checkout (`supabase/migrations/*.sql`, 304 files), at `02ccdd5e`. Not the live
database** — the live database was not read, so a function applied by hand or a migration not yet applied would not show.
Re-take it with `node scripts/measure-sql-refusals.mjs` (`--list` prints every function and every sentence). It reads
files only, takes about a second, and always exits 0.

| Step | Figure |
|---|---|
| Raw `raise exception` hits in every migration file (the planner's grep, 2026-11-03) | **575** |
| inside one-off `do $$` blocks (test harnesses, data fixes; never live) | 38 |
| inside the body of some `create function` | 537 (575 − 38, checked: the two readings agree exactly) |
| of those, in a definition later superseded or dropped | 347 |
| **Live messages** (last definition of each function, by name and argument count, not dropped) | **190** |
| Live functions containing a refusal | 76 of 186 live functions |
| Live messages inside `security definer` functions | 119 (the other 71 are `invoker` functions and triggers) |

So the real number is **190, about a third of the grep's 575**, in 76 functions. The item's wording ("every
`security definer` function") is narrower than the class: 71 of the 190 are in functions that are not definer.

## Classification (0 unclassified)

Rules live in `scripts/lib/sql-refusal-classes.mjs`, by reason, first match wins, per FUNCTION (messages inherit).

| Class | Reads | Functions | Messages |
|---|---|---|---|
| `called-and-forwarded` | **user** | 20 | 57 |
| `trigger` | maybe | 39 | 73 |
| `called-forwarded-and-masked` | maybe | 6 | 25 |
| `sql-only-caller` | maybe | 2 | 3 |
| `called-and-masked` | masked (log only) | 8 | 27 |
| `uncalled` | developer | 1 | 5 |

- **user (57):** a `src/` file names the function and hands an error's `.message` to the screen.
- **maybe (101):** reachable, not settled. Triggers (73) fire on any write to their table; which writers hit which guard
  was not traced. Most are defence in depth (e.g. `audit_log_refuse_change`, `roles_guard_fixed`) that a normal screen
  never trips. 25 are in functions whose calling file both forwards and masks.
- **masked (27):** the caller uses `databaseFailure()`/`unexpectedFailure()` (`src/lib/action-result.ts:56`), so English reaches
  the server log and the person sees dictionary words.
- **developer (5):** `merge_vet_doctors`, which nothing in `src/` or `worker/` names.

**Limits, stated so no one reads them as proof:** (1) "caller" means a quoted function name in a `.ts`, `.tsx` or `.mjs`
file under `src/` or `worker/` (not `*.test.*`); an rpc whose name is built in a variable is invisible. (2) "forwards" is a
regex on the calling FILE, not on the call, so a file with five rpcs counts for all of them; **the 57 is an upper bound
for what a person meets, and the 25 "maybe" sit above or below it.** (3) A raise whose message is a variable, or SQL built
with `execute format`, is not parsed: the parser found 0 such shapes among the live raises (190 of 190 read). (4) Two
live overloads with the same name and the same argument count would merge into one; none occurs (the script prints that
check). (5) Which of a function's 8 sentences a person can actually trigger is not settled; counts are of sentences, not of
likelihood.

## Does the app show these raw as a general pattern? Both, deliberately mixed

- **A central rule says no:** `databaseFailure()` (`src/lib/action-result.ts:53-67`) maps only unique, check and
  privilege codes to dictionary words and sends everything else to the log, "so the raw message … never reaches the
  browser". 16 files use it.
- **92 files still forward `error.message`** by a quick pattern (`error: x.message`, `refuse(x.message)`,
  `return { error: x.message }`; grep 2026-11-03, a count of files, not calls). So raw passthrough is a very common
  pattern, not one page's choice. Examples: `src/app/management/recurring-jobs/actions.ts:64,107,333,368`;
  `src/lib/placements/deceased.ts:74-76,112,156`; `src/app/stocktake/actions.ts:168-172`.
- **#1221's page is a deliberate allow-list:** `src/app/admin/intake-date/actions.ts:39-40` passes `error.message` only for
  SQLSTATE `P0001` (a function's own `raise exception`) and `23001`; every other code goes through `unexpectedFailure`.
- **Shape 2 already exists, in 9 files, and shows its flaw:** `src/app/stocktake/actions.ts:169-172` matches
  `/not authorized/i`, `/were found/i`, `/negative|needs an id and a number|do not add up/i` against the English text and
  maps to dictionary strings, falling back to the raw message. Rewording the migration silently drops Thai for that
  sentence and nothing fails.

## Recommendation: shape 1 — the function raises a stable key, the app looks up the wording

Convention: `raise exception 'intake_date.blocked_by' using errcode = 'P0001', detail = '{"date":"…","record":"…"}'`.
The app reads `error.message` as a key, `error.details` as parameters, and finds the Thai and English in the dictionaries.
`databaseFailure()` is the one place that changes, so the 92 forwarding files can move over one at a time. An unknown
key falls back to the generic "something went wrong + reference" message, so a missed key is safe, which is the
widen-never-narrow direction. **It needs no new table, trigger or function** (the key rides in the message the function
already raises), so this is not blocked on a schema object. The parameters-in-`detail` shape is the part to confirm when the
first function is converted.

**Why the other two lose:**
- *Shape 2 (app rewords known English):* duplicates every condition in two places, and the stocktake file shows it fails
  silently on a reword. Sentences carrying a `%` parameter would each need a pattern as well as a key.
- *Shape 3 (English is diagnostics, never shown raw):* honest, and cheapest in SQL, but it means changing the 92 forwarding
  sites, and it throws away the information a worker needs ("cannot move to 2025-01-04 because of a placement, remove that
  record first" is the point of #1221's function). A generic "something went wrong" there is a worse screen, not a neutral one.
- *Shape 3 is still right for part of the count:* the 73 trigger sentences and the 27 masked ones are developer-facing guards.
  Those need no conversion; recommend leaving them English and recording them as diagnostics.

## What it would cost, in the counts above

- **Convert first: 20 "user" functions, 57 sentences**, plus the 6 "maybe" functions with callers (25) once their callers are
  looked at: about **26 functions, 82 sentences**. Each needs a new migration redefining the function, dictionary keys in
  both languages, and its calling file moved to the key lookup.
- **Leave as diagnostics: the 27 masked and the 5 developer-only sentences**, and the 73 trigger sentences until a trigger is
  seen to be tripped by a normal screen.
- That is a programme, not an afternoon: roughly 26 functions across ~20 calling files, each its own small change. Migrations
  must not edit applied files, so every conversion is a new `or replace`.
- Re-running `measure-sql-refusals.mjs` after each conversion shows the "user" figure fall; that is the progress meter.

## Worst offenders (where a shelter worker most likely meets one)

Daily-use screens, mostly forwarded raw: `record_recurring_job` (7 sentences, e.g. "This job does not fall on %." —
`recurring-jobs/actions.ts`), `reassign_recurring_job` (5), `record_stocktake` (8; partly mapped by regex), `record_stock_correction`
(4, diets and medications), `correct_intake_date` (8, the intake-date page), `set_resident_profile_photo` (3),
`undo_deceased_placement` (4, forwarded in `src/lib/placements/deceased.ts`), the three `merge_*` admin screens (medication,
procedure type, blood-test type), and `delete_resident_photo`. Per-function sentences: `node scripts/measure-sql-refusals.mjs --list`.

## Could not settle

- The live database was not read; a drift between files and what is applied would change the 190.
- Which trigger sentences a normal screen can trip (73) and which of a function's sentences are reachable.
- Whether the 25 "maybe" with callers forward or mask per call.
- Whether Lutan wants shape 1 (a programme) before other work; recommended, not started.
- `raise` forms other than `raise exception` (`raise notice`: 25 hits) are not user-facing and were left out.

## Release note: n/a — nothing a user can see changes in this PR.
