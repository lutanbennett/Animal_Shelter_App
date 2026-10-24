# Diets link 2: the feeding sheet reads per-serving, the old columns become nullable (0258)

Status: schema only, applied to dev. Link 3 (the app stops writing `qty_small/medium/large`) and link 4 (the drop)
are other streams. Nothing in `src/` changed.

## What 0258 does

1. `special_diet_list` (the only database object still reading the old columns) now returns
   `qty_per_serving x the diet's servings for the resident's size x portion_factor`, the shape `0254` used for the
   forecasts. Columns, order and grants are unchanged.
2. `drop not null` on `diet_ingredients.qty_small/medium/large`.
3. The `0250` bridge `diet_ingredients_fill_serving` is guarded with `new.qty_small is not null`.

## Why the CHECKs stay

`check (qty_x > 0)` fails only when it evaluates to FALSE, and `NULL > 0` is unknown, so the constraints already
accept NULL once NOT NULL is gone. Dropping them would change nothing today and is link 4's job with the columns.
The harness asserts all three are still present.

## Why the bridge needed guarding

As written, an UPDATE that changed `qty_small` while `qty_per_serving` stayed put recomputed
`qty_per_serving = qty_small / servings_small`. With a nullable `qty_small`, blanking it would make that
`NULL / n = NULL` and silently overwrite a good recipe amount. Link 3 is exactly the change that will start
writing NULL there, so the guard has to land before it. The insert path is guarded the same way: a NULL
`qty_small` no longer tries to derive a serving (an insert with neither still fails on `qty_per_serving`'s own
NOT NULL, which is the right refusal). The harness blanks `qty_small`, then all three, and shows
`qty_per_serving` untouched; an edit to a real Small value still re-derives it.

## What the harness proved, and what moved

`scripts/check-diets-readers-per-serving.mjs` captures `special_diet_list` before, runs 0258's text, and compares.
Same rows, every column but `daily_quantity` identical, and no `daily_quantity` moves for a line in the
1 : 1.5 : 2 proportion. **Five rows did move, all one out-of-proportion line ("Renal diet": 22 before, 16.5 now).**
That is the 0250 finding again, not a new fault: `qty_per_serving` was back-filled from Small, so a line whose
Medium/Large were not 1.5x/2x Small now follows its Small amount, exactly as the forecasts already do since 0254.
Whether to correct such lines is Lutan's call; the harness prints them each run.
