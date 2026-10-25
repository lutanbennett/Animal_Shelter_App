# Diets link 4: drop qty_small / qty_medium / qty_large and 0250's bridge

2026-10-25, `claude/diets-drop-old-amounts`, migration `0260`. Last step of "Simplify diets to one-serving recipes".

- `0260` drops the `diet_ingredients_fill_serving` trigger and function (0250, rewritten in 0258), then the three columns
  (their `> 0` CHECKs go with them). The trigger goes first because it names `qty_small`.
- Step zero: every hit for the three names in `supabase/migrations/` was read. The live readers were moved by `0254`
  (forecasts) and `0258` (`special_diet_list`); `src/` and `worker/` held one comment, now removed. The `--dry-run`
  on dev passed, which would have failed on any view still depending on a column.
- Harness scripts: `check-diets-proportion.mjs` (and its `diets-proportion` entry in `scripts/lib/readonly-checks.mjs`),
  `check-diets-per-serving-schema.mjs` and `check-diets-readers-per-serving.mjs` proved things that can no longer be
  false or tested (the old amounts being in proportion, the back-fill, the bridge); they are deleted. The forecast and
  servings-app checks now insert `qty_per_serving` and still pass.
- Not touched: older one-shot harnesses (e.g. `check-diets-recipes-schema.mjs`, `check-diets-sheet.mjs`) that already
  failed since 0243 dropped `diet_types.daily_qty_*`.
- Production: applied at the next release, Lutan's step. Production was at 259 applied with 0258 live when this was written.
