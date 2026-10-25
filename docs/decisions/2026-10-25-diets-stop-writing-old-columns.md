# Diets link 3: the app stops writing qty_small / qty_medium / qty_large

2026-10-25, `claude/diets-stop-writing-old-columns`. No migration.

- `src/app/admin/diets/recipe-actions.ts` is the only file that wrote the three columns (`derivedAmounts()`). It is
  gone: `saveRecipeLine` writes `qty_per_serving` directly, and `saveServings` now only updates the diet's
  servings, because no ingredient line holds anything derived from them any more. `grep qty_small|qty_medium|qty_large src/`
  returns nothing.
- Write paths into `diet_ingredients` in `src/`: two, both in `recipe-actions.ts` (the upsert in `saveRecipeLine`, the delete in `removeRecipeLine`); the other files that name the table only read it or count it.
- **The 0250 bridge trigger (`diet_ingredients_fill_serving`, as rewritten in 0258) can no longer fire.** It needs
  `new.qty_small is not null`. A new row now has `qty_small` NULL, so it is skipped; an update leaves `qty_small` as
  it was, so `new.qty_small is distinct from old.qty_small` is false, so it is skipped. Link 4 can drop the trigger
  with the columns and has nothing to re-derive.
- `node scripts/check-diets-readers-per-serving.mjs` stays green (10 checks).
