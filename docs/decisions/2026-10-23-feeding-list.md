# Operations → Feeding list (the kitchen batch sheet)

Lutan, 2026-10-22: *"the food is made in batches for a zone and then plated up"*, and *"Fractions are not a problem…
a 3/4 egg would never be an issue at those volumes."* Nothing on `main` totalled diets by zone; whoever cooked added
it up by hand. App only: no migration, no schema, no new permission.

## Shape

- `/operations/feeding-list?round=morning|evening&view=batch|dogs`. Food has no lunch (`roundsFor("food")`).
- **The meal is asked, not inferred**, as on the medication list: `?round=` is the person's choice and
  `suggestRound("food")` only pre-selects (the lunch window suggests evening).
- **Batch for each zone** (cook): one block per zone, and in it one block per diet, Standard first then the special
  diets by name, each with its dog count. A special diet is never merged into the Standard pile; a dog on a special
  diet counts only in its own diet's block. A collapsed "By enclosure" repeats the same blocks per enclosure.
- **Plate by dog** (plater): zone, then enclosure, then each dog with its photo and exactly its share of one meal.
- **It records nothing.** No form, no action, no client component, like the medication list. Deliberate: the app
  does not know a meal was fed.
- Dogs with no enclosure, or not a current Resident (hospital, foster, outreach), are fed but not from a zone's
  batch, so they are totalled in their own "Not in a zone today" block rather than dropped. Deceased and Adopted
  are dropped, as on the special-diet list. A diet with no meal ticked is in both meals and flagged, never dropped.

## The arithmetic, and why it rounds once

Per dog, per ingredient, per meal = `qty_per_serving` x the diet's servings for the dog's size x `portion_factor`
/ `meals_per_day`, using `servings.ts` (`dayAmount`, `perMealAmount`) unchanged. A zone's total is the **sum of the
unrounded per-dog amounts**, and `formatAmount` rounds once, when printed. Rounding each dog first would make a
batch wrong (0.375 cup x 3 dogs is 1.125, not 3 x 0.4). The sums live in `src/lib/diets/feeding-build.ts`, apart from
the database so they are tested on their own (`feeding-build.test.mjs`, including the item's acceptance case:
Small + Medium + Large on Standard = 4.5 servings a day, 2.25 a meal, kibble 1.125 cup, eggs 2.25, rice 1.125 cup,
chicken 112.5 g).

Checked against the database on dev: an independent SQL sum of the same formula for every zone and diet in the
morning meal matched the page figure for figure. The database `diet_forecast()` still reads the old `qty_*`
columns; the app keeps them equal to the per-serving figures on every save, and nothing here touches either function.

## Who sees it

The route is `medical.diet` at Read with all-clinic scope, the same activity and scope as `/medical/diets` (the
`feed_special_diets` card), and it is a tile on the Operations landing for those who hold it. The home card is
unchanged. Placement is read from `medication_list_residents` (0136), falling back to `resident_current_state`:
`resident_current_state` returns **no rows** for the Head of Medical, who cannot open resident records, so reading
it alone would have put every dog under "Not in a zone". The other tables the page reads (diets, ingredients,
`resident_diets`, `resident_diet_rounds`, `residents` for size) were checked to be readable by that audience.

## Not built: the ingredient's picture

The item asks for the ingredient's picture "if it has one". `diet_types.label_drive_file_id` exists (0129) but
nothing can set it (no editor), and nothing serves it (`/api/photos` does not ask `diet_types`; the picker view
`picker_diet_types` omits the column, and the table is closed to a login without the price cell). Showing it needs
a view column (schema) and a proxy path, so it is left for its own item rather than half-built.
