# Database refusals raise a key, and the app words it: the mechanism, and the first group (2026-11-08)

Stream `db-refusal-keys-mechanism`, the first stream of the programme in backlog item `#3nuwy`. It builds shape 1 of
`docs/decisions/2026-11-03-sql-refusal-english-count.md` end to end and converts one named group. It does **not** close
the item.

## The key format, and how parameters travel

```sql
raise exception 'label.not_translatable' using errcode = '22023',
  detail = json_build_object('table', p_table, 'column', p_column)::text;
```

- **The message is the key**: dotted lower-case words, at least two parts, no spaces, no `%`
  (`/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/`). The first part names the area (`label.`); later groups pick their own
  (`recurring_job.`, `stocktake.`, `intake_date.`).
- **Parameters go in DETAIL as a JSON object**, built with `json_build_object(...)::text`. PostgREST returns it to
  supabase-js as `error.details`. Measured on dev, 2026-11-08: the server log for a real refusal showed
  `details: '{"table" : "diet_types", "column" : "name", "row" : "45fd…"}'` beside `message: 'label.no_proposal_waiting'`.
- **The SQLSTATE stays what it was** (42501 for a missing grant, 22023 for a bad argument). Nothing that tests
  `error.code` changes, and an unconverted caller still gets a sensible `databaseFailure()` answer from the code.
- **Several sentences may share one key.** The old `'not a translatable label: %.%'` was raised by three functions; it
  is now one key, `label.not_translatable`, with one wording.

The `%`-parameter sentences the 2026-11-03 file warned about were the reason this group was chosen first. They needed
nothing special: the `%` arguments become the JSON object's fields, and the dictionary entry is a function of them.

## Where the shared helper lives

**`src/lib/db-refusal.ts` — `dbRefusal(where, error, t)`.** Every later group calls it where a converted rpc's error is
handled: `if (error) return dbRefusal("<where>", error, t);`. It returns an `ActionRefusal`, so it drops into any
`runWriteAction` body. Its three outcomes:

1. **A key the dictionary knows** → that entry of `t.refusals`, with the parameters from `details`.
2. **Something shaped like a key that the dictionary does not know** → `unexpectedFailure()`: the generic
   *"something went wrong … reference"*, with the raw error (key and details) in the server log under the reference.
   **It widens, never narrows:** even a missed key with SQLSTATE 42501 gets the generic message, not a sentence that
   might be wrong for it, and the key itself is never shown. Proved on dev (test plan, section 4): the entry was removed
   from both dictionaries in the working tree, a real refusal was triggered, and the screen read the generic Thai
   message with reference `5212721c`, which the server log carried.
3. **Anything else** (an unconverted English sentence, a constraint error) → `databaseFailure()`'s existing rules.

**Wording lives in one block, `refusals`, directly after `common` in both `en.ts` and `th.ts`**, keyed by the exact
string the SQL raises. Later groups add their keys to that block; they never scatter them.

Why not change `databaseFailure()` itself, as the 2026-11-03 file suggested: it takes four words, not the dictionary,
and its 16 callers would all need the dictionary passed in. `dbRefusal()` wraps it instead, so a caller moves over by
changing one line, and the files that do not move are untouched.

## The check: `scripts/check-sql-refusal-keys.mjs` (CI, the file-only checks job)

It reuses `scripts/lib/sql-refusals.mjs` and the classifier, which now lives in one function,
`classifyLiveRefusals()` in `scripts/lib/sql-refusal-classes.mjs`, shared with `scripts/measure-sql-refusals.mjs`. No
second parser.

**It asserts:**

1. A live function whose live definition is in migration **0339 or later**, and which a person reads (class `user`, or
   `called-forwarded-and-masked`), raises only keys — no English sentence and no raise the parser cannot read.
2. Every key any live function raises has an entry in `refusals` in **both** `en.ts` and `th.ts`.

**It deliberately ignores:** every function last defined before 0339 (about 150 messages today), triggers, functions
only SQL calls, functions whose callers only mask the message, uncalled functions, and `do $$` blocks. Wording no
function raises is reported, never failed.

**Why a cut-off and not a list.** A stored list of the unconverted functions is a ratchet someone has to maintain. With
the cut-off, the rule bites **when a function is next redefined**: any migration that rewrites one of the old
functions must convert its refusals in the same file. That is the moment it is cheapest. The cost: an unrelated change
to an old person-read function (a grant fix, say) now carries the conversion too. That is intended.

Proved red: a copy of 0339 with one key reverted to an English sentence and one key renamed to a key with no wording
failed with three problems naming the function, the file and the sentence. Nine unit tests in
`scripts/check-sql-refusal-keys.test.mjs` pin each rule, including that the check's pattern and the app's agree.

`scripts/check-thai-dictionary.mjs` was left alone, as the brief asked: it reads `.tsx`, and this check covers SQL.

## The group converted: the label-translation functions (0339)

| Function | Was defined in | Keys |
|---|---|---|
| `set_label_th` | 0166 | `label.translate_not_allowed`, `label.not_translatable` |
| `propose_label_th` | 0296 | `label.propose_not_allowed`, `label.not_translatable` |
| `approve_label_th` | 0293 | `label.approve_not_allowed`, `label.not_translatable`, `label.no_proposal_waiting` |
| `discard_label_draft` | 0293 | `label.discard_not_allowed` |

Each is its latest definition with only the raise lines changed. The one caller,
`src/app/management/translations/actions.ts`, now hands each rpc error to `dbRefusal()`. Its other `refuse(error.message)`
lines are table updates, not these functions, and are untouched.

## propose_label_th's Worker caller (the brief's open question): IN the group

`worker/translations.mjs` calls `propose_label_th` from the scheduled label-drafting run. On any non-2xx answer it throws
`supabase rpc propose_label_th → <status>` and logs that; **it never reads the response body**, so neither the old English
nor the new key ever reached a log line, let alone a person. A key cannot be a regression there. Converting it also
removes the one `maybe` function from this file's group, so the next stream does not meet it half-done.

## The count, re-measured, and its drift

`node scripts/measure-sql-refusals.mjs` on `main` at `8c9722aa`, 2026-11-08 (before this change): 86 live functions with
a refusal, **209 live messages**; class `user` **21 functions, 61 messages**; `maybe` 52 / 111; `masked` 12 / 32;
`developer` 1 / 5. The 2026-11-03 reading was 20 functions / 57 messages in `user`: **+1 function and +4 messages in five
days**, the rate at which the problem grows while the programme runs. The cut-off check stops that growth from 0339 on.

The script now prints a progress line. After 0339: **4 functions, 8 messages keyed; 80 person-read messages
(`user` + `called-forwarded-and-masked`) still English.** The classes do not move when a function is keyed, because they
describe who reads a function, not what it says; the keyed line is the meter.

## What is left, by group, and what each costs now

Each later stream: one migration redefining its functions (`or replace`, raises changed only), keys in `refusals` in both
dictionaries, its caller's `refuse(error.message)` changed to `dbRefusal(…)`, and one real refusal driven on dev. No
mechanism, no check, no helper. Roughly half this stream's size. Membership from
`node scripts/measure-sql-refusals.mjs --list`, 2026-11-08; re-read it when you start, it moves.

| Group (caller) | Functions | Notes |
|---|---|---|
| Recurring jobs (`src/app/management/recurring-jobs/actions.ts`) | `record_recurring_job`, `reassign_recurring_job` | 12 sentences, several with `%` dates. Daily screen: the most-met. |
| Stocktake and corrections (`src/app/stocktake/actions.ts`, diets/medications) | `record_stocktake`, `record_stock_correction` | **Also delete the regex rewording** in `stocktake/actions.ts:169-172` (shape 2); it silently loses Thai on a reword. |
| Intake date (`src/app/admin/intake-date/actions.ts`) | `correct_intake_date` | 8 sentences; the page passes `P0001` through by an allow-list. Move the allow-list to `dbRefusal`. |
| Placements (`src/lib/placements/deceased.ts`) | `undo_deceased_placement` and its neighbours | A lib, not an actions file: check every page that calls it. |
| Resident photos | `set_resident_profile_photo`, `delete_resident_photo` | Two callers. |
| The three merge screens | `merge_*` (medication, procedure type, blood-test type) | Admin screens; one group. |
| The rest of the `user` class and the 6 forwarded-and-masked | see `--list` | Size per stream by caller file, not by function count. |

Leave as diagnostics, as the 2026-11-03 file recommended: the 73 trigger sentences until a normal screen is seen to trip
one, the masked ones, and `merge_vet_doctors` (uncalled).

## One thing to know before deploying

The migration lands before the code that reads it. A build without `db-refusal.ts` forwards the raw message, so on
**test.lannacare.org** (dev database, older code) these six refusals now read as a bare key (`label.no_proposal_waiting`)
until the next test deploy. On production the migration and the code ship in the same release; apply then deploy, as for
any migration with a consumer.
