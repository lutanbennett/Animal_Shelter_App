# Refusal keys, group 5: stocktake and stock corrections (#3nuwy)

`record_stocktake` and `record_stock_correction` (both last defined in `0178`) now raise keys. Migration `0356`;
bodies are 0178's with only the raise lines changed, SQLSTATE `P0001` kept, `-- consumer:` names all three callers.

## Prefix: `stock.`
One prefix for both functions: they share a screen's worth of vocabulary (`stock.count_negative` is raised by both).
`stocktake.` would have split the shared sentence across two prefixes.

## Count: 12 sentences, 11 keys (the brief said 7)
`record_stocktake` has **8** sentences, not 3: the brief's list omitted five (list must be an array, row needs an id and
a number, listed twice, units do not add up, plus the shared negative). `record_stock_correction` has 4. "A stock count
cannot be negative." is raised by both, so one key. Keys: `count_not_allowed`, `list_invalid`, `count_row_invalid`,
`count_negative`, `listed_twice`, `units_do_not_add_up`, `medications_not_found`, `diet_types_not_found`,
`correct_not_allowed`, `unknown_kind`, `item_not_found`.

`%` substitutions go in `detail` JSON: `{kind}` (`medication` | `diet_types`, worded per language in the dictionary so Thai
is not an English noun in a Thai sentence) and `{found,total}` for the two stale-count messages.

## The regex at `stocktake/actions.ts:167-173`: deleted, and its third branch was NOT dead
"needs an id and a number" and "do not add up" are both still raised by `record_stocktake` (they are in the `--list`
output; the brief's sentence list had left them out). So the branch was live; the keys replace it. Two other sentences
(`list must be a list`, `listed twice`) never matched any branch and fell through to `"Nothing was saved: <english>"`;
they now have wording. The old `e.notAuthorized` / `e.stale` / `e.countInvalid` dictionary entries in the stocktake
block are no longer read by the action; left in place (removing them is a separate tidy). English wording a user sees:
the stale-count message now names the counts (`3 of 5 medications were found`) where the page used to show its own
"an item has been deleted" paragraph; the not-authorized message for corrections reads "Your access does not include
editing stock." instead of the bare SQL sentence.

## Callers
`stocktake/actions.ts`, `management/diets/actions.ts` (`updateDietTypeStock`) and `management/medications/actions.ts`
(`updateMedicationStock`) use `dbRefusal`. Each file has one call to these functions; the other `refuse(error.message)`
lines are table updates.

## Proof (dev, 2026-11-11)
Direct calls in `do $$` blocks as a chosen `request.jwt.claims` sub, always ending in a raise (nothing persists).
**Seen coming back, 10 of 11:** `count_not_allowed` and `correct_not_allowed` (login with no roles), `list_invalid`,
`count_row_invalid`, `count_negative` (both functions), `listed_twice`, `units_do_not_add_up`, `medications_not_found`,
`diet_types_not_found` (found/total in detail), `item_not_found` (as an admin login).
**Not provoked: `unknown_kind`.** The permission check ahead of it reads `stock.medications`/`stock.diets` by kind, so
any unknown kind is refused as `correct_not_allowed` first; the raise is unreachable through the function today (the
key is kept because the guard is still in the body). `check-sql-refusal-keys.mjs` confirms every key has wording in both
dictionaries. Fallback for an unknown key is `src/lib/db-refusal.test.mjs`.

## Meter (`measure-sql-refusals.mjs`)
Before: 13 functions / 33 keyed, 56 person-read still English. After: **15 / 45, 44** still English (56 − 12; the brief's
49 assumed 7 sentences).

## Thai
My own and unreviewed; for the planner to file onto `#y1dqu`.

## Next group (mechanism file's table): Intake date
`src/app/admin/intake-date/actions.ts`, `correct_intake_date`, 8 sentences; the page passes `P0001` through by an
allow-list, to be moved onto `dbRefusal`.
