# A deceased resident's intake date can be corrected, under the existing card (0307)

Lutan, 2026-11-03, asked with three options (yes under the same card / leave it locked / yes with its own card): **yes, under the existing `correct_intake_date` card.** No new card.

## Where the lock lives (established, not inferred)

- The refusal is **`enforce_deceased_lock()`**, `supabase/migrations/0026_deceased_workflow.sql:162`, raising "This resident is deceased — their record is read-only." (`restrict_violation`, line 186). Last redefined in `0052_deceased_editable_fields.sql` (the bio/photo opening). Confirmed on dev with `pg_get_functiondef('enforce_deceased_lock'::regproc)`: the live body is 0052's. No later migration redefines it (`grep -rl "enforce_deceased_lock" supabase/migrations/` finds only 0026, 0051, 0052, 0113, and 0113 only mentions it).
- It is attached BEFORE INSERT/UPDATE/DELETE as `residents_deceased_lock` (0026:247), `placement_history_deceased_lock` (0026:255), `weight_deceased_lock` (0026:271) and `resident_diets_deceased_lock` (0051:203), the four tables `correct_intake_date()` writes. Listed from `pg_trigger` on dev. "Deceased" means an open Lifecycle placement (`resident_is_deceased()`).
- It is a trigger, not a policy, so RLS never gets a say: it refused the security-definer function too. No policy was involved (searched `pg_trigger` by table, not by name, so a renamed table cannot hide one).

## What 0307 does

- `enforce_deceased_lock()` gains one opening beside 0052's: an **UPDATE only**, while the transaction-local setting `app.intake_date_correction_lock` is `on`, where stripping `intake_date`/`age_estimated_on` (residents), `start_date` (placement_history, resident_diets) or `date` (weight) from both rows leaves them equal. Any other changed column, any INSERT, any DELETE is still refused.
- `correct_intake_date()` is recreated unchanged except that it raises that setting around its own writes and restores the previous value after. The card check at its top is untouched.
- No role, no role key, nothing given to Admin. The flag is the existing pattern (0026 `deceased_lock_bypass`, 0302 `app.intake_date_correction`): a setting only a definer function raises, not an exemption by who you are. The older `app.intake_date_correction` flag is left as it was, because it opens a different trigger (placement immutability).

## What it does not reach

Every other write on a closed record, including the same five columns when the flag is off, and the same tables' other columns even with it on. A login without the card is refused by the function (42501) before any write.

## Proof (`scripts/check-intake-date-deceased.mjs`, begin … rollback, live functions on dev)

Direction 2, first: 16 representative writes refused with the flag off and 12 with it on (name, other columns, deletes of the resident/placement/diet/weight, inserts of a placement/diet/weight, note/updated_at edits). Direction 1: a login holding the card moves the intake date, Intake placement, diet and weight of a deceased resident; a later weight is untouched; the flag is reset; the lock is shut again in the same transaction. A login without the card gets 42501 and nothing changes. A living resident still works.

## The page

No page change was needed: the action asks `resident.correct_intake_date`, the same activity the function asks, and the control is drawn on `can(perms, "resident.correct_intake_date")` regardless of whether the resident has died. Driven in the browser on 3003 with a card-only login: the deceased resident R-0395 shows Save and the correction saved; a `view_residents`-only login is sent to "You don't have access to this page". Only a comment in `actions.ts` about the 23001 branch was updated.

## Found, not fixed

Nothing out of scope touched. R-0323 and the general deceased-records widening are not touched. Production still needs `0306` and `0307` applied: Lutan's command.
