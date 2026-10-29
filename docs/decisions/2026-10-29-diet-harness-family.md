# The diet harness family: seven checks, all green

**Branch** `claude/diet-harness-family`. Closes the "six on the diet model" line of batch-7 triage
(`2026-10-28-harness-sweep-batch-7-triage.md`) and adjudicates the seventh, `diets-servings-app`.
No migration, no change under `src/`, nothing in `scripts/lib/`.

## Fair count (dev server up on :3001, each run with `timeout 60`, 2026-10-29)

All seven were red, and for the reasons the triage gave. Cross-check of #1063, #1069 and #1074: none touched
these seven files.

| harness | before | verdict | what was done |
|---|---|---|---|
| `diets-servings-app` | forecast delta 1181.25 g, hand calculation 1531.25 g | **Stale fixture. The app is right.** | see below |
| `diets-app` | `diet_types.daily_qty_small` does not exist | Removed mechanism, **restated** | ingredients are inserted with name and unit only; the split writes `diet_ingredients.qty_per_serving`; the 0239 bridge it used to clean up after is gone |
| `diets-recipes-schema` | `dt.is_standard` does not exist | Removed mechanism, **restated; part retired** | see below |
| `medical-jobs` | `diet_types.is_standard` does not exist | Removed mechanism, **restated** | diets are recipes (`diets`, `diet_ingredients`, `resident_diets.diet_id`, `portion_factor`); principals restated by card; see below |
| `medication-rounds` | `resident_diets.diet_type_id` does not exist | Removed mechanism, **restated** | the two diet inserts name a recipe (`diet_id`); role principals restated by card; one apply-day claim retired |
| `order-and-units` | `diet_types.daily_qty_small` does not exist | Removed mechanism, **repaired** | one line: a new ingredient needs no per-size quantity |
| `price-free-pickers` | `daily_qty_small` does not exist | Removed mechanism + stale fixture, **restated** | see below |

## `diets-servings-app`: how it was adjudicated

The gap was **exactly 350 g**, which is the Small dog's week (50 g x 1 serving x 7 days). `diet_forecast()`
(0254) skips residents whose status is Deceased, **Adopted or Fostered**; the harness picked its Small and
Medium dogs with `current_status <> 'Deceased'` only, so on dev it picked an adopted or fostered Small dog
whose week the forecast rightly left out. The arithmetic itself (`qty_per_serving x servings for the size x
portion_factor x unit conversion`) matches the hand calculation once the fixture picks residents the forecast counts.

Fix: the harness now excludes the same three statuses; it prints 1531.25 g exactly. The header comment also
said the app writes `qty_* = amount x servings`, which stopped being true at 0260; it now says
`qty_per_serving x diets.servings_*`. **No app fault, so nothing was filed as a backlog item.**

## Retirements, each with its reason

- **`diets-recipes-schema`: the before/after proof of 0239's back-fill, and the old-app bridge checks.** The
  harness used to apply 0239's own text inside a transaction and compare forecasts before and after. That
  proved a one-time migration that has long run everywhere; the bridge triggers it also tested were dropped
  in 0243. It cannot run now (the text reads dropped columns) and could never fail for a live reason. **Kept:**
  recipe expansion (cups converted to the ingredient's base unit, in both forecasts), the unknown-unit refusal,
  and "every `resident_diets` row points at a recipe".
- **`medical-jobs`: the "role row" and "cells" checks** (the head_of_medical role's `role_permissions` equal to
  a `jobs.ts` fixture). They compared a copy of one role's cards with the database; which cards a role holds is
  data being rebuilt, and `set_role_cards` deriving cells from cards belongs to `check-card-grants`.
  Also retired: the `attachments` floor probe (attachment rows follow the photo cards, 0276/0279, as
  `medical-jobs-app` already ruled).
- **`medical-jobs`: "a first photo becomes the profile photo" is restated, not retired.** 0267 made
  `record_attachment()` never set a Medical photo as the profile photo; the check now asserts the profile photo
  stays unset.
- **`medication-rounds`: "no existing prescription with a schedule is left in no round".** An apply-day claim
  about live rows (dev held one such prescription). Dropped beside the sibling claims the file already dropped
  on 2026-10-21 (`2026-10-02-replay-or-assert-live.md`, rule 4); what the defaults do stays asserted on rows the
  harness makes.
- **`price-free-pickers`: the management, volunteer and doctor principals.** They were roles; their expectations
  moved with the roles. What remains is per cell: Admin plus six principals each holding exactly the cells they name.

## Card-shaped principals

`medical-jobs` and `medication-rounds` now build throwaway roles in their rolled-back transaction with
`set_role_cards()` (the way `dev-signin.mjs --cards` does): a login holding exactly the four medical-job cards,
one holding `medical_records` (it edits `medical.prescriptions`), one holding only `view_residents`, one holding
nothing. Admin stays outside the cards. Where a result differed from the old role answer it was checked against
the policy, never adjusted to pass: `rounds` are read only by cards whose forms list them (0263), and a login
holding `administer_medication` reads but cannot edit prescription rounds (it holds `medical.prescriptions` at
read), so the write is the `medical_records` login's.

## Found, not fixed

- **`price-free-pickers` `med_add` probe is confounded by the units trigger.** A medication `INSERT` meets
  `check_unit_in_units()` (0252, not `security definer`) before its policy, and `units` is readable only by the
  cards whose forms list them (0263). A login that cannot read units therefore errors at the trigger, not at the
  policy. The probe treats that as "refused" and says so in a comment. The `add_while_recording` card includes
  `view_medical`, so a real holder reads units; only a bare cell (the old `c_add` fixture) could not. Not an app
  fault, but the policy half of that probe is no longer isolated.
- **Dev has no `tablet` unit available to a login without a units card**: medicine inserts that rely on the
  column default (`dose_unit = 'tablet'`) fail for such a login. Same cause as above.

## A view on the diet-model rewrite (a proposal; not built)

Reading six harnesses against the model as it stands, the awkward part is that **`diet_types` still carries the
name of the old model but now means "ingredient"**. Every fixture I had to repair inserted a "diet type" meaning
an ingredient, then needed a `diets` row for the recipe. Renaming `diet_types` to `ingredients` (with a view or
alias for a release) would remove the whole class of mistakes where a fixture, a policy or a column says
`diet_type_id` and means an ingredient, and would let the picker view be `picker_ingredients`. The second
candidate is `resident_diets.diet_id` still being nullable: the `diets-recipes-schema` live check holds on dev
today (0 rows without a recipe), so the column could be made `not null` once production is confirmed the same.
Neither is a harness change, and neither needs doing for these checks to tell the truth.
