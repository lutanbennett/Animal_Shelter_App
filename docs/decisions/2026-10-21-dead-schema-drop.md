# Dead diet schema and `role_home_tiles` dropped (`0243`)

2026-10-21, `claude/dead-schema-drop`. Part (3) of the diets-as-recipes backlog item, plus the Home screen table left by #812.

## What the brief got wrong, and what was true

The brief said `diet_forecast` (`0211`) still read `diet_type_id`, `daily_quantity` and `daily_qty_*`, and was the expensive half. **It
was not.** `0239` restated it (and `stock_diet_forecast`) over `resident_diets.diet_id` → `diet_ingredients`, keeping signature and
columns; `0211` is an older body that `0239` replaced. A search of `src/` cannot see this, so the proof is the live function bodies:
a scan of `pg_proc` and `pg_get_viewdef` on dev for the legacy columns found only the objects below. `diet_forecast` is untouched.

## What reads the legacy columns, and what was done

| object | decision |
|---|---|
| `diet_types_mirror_recipe`, `resident_diets_fill_recipe` (0239 bridge) | dropped with their functions |
| `set_standard_diet(uuid)` (0090/0178) | **dropped, not restated.** No caller anywhere in `src/`; it wrote `diet_types.is_standard`. The standard diet is `diets.is_standard`, moved from Settings → Diets. Restating it would keep a second, unused way to do that. Its probes are removed from `scripts/check-perm-functions.mjs`, and the old one-off harness `check-standard-diet-functions.mjs` is deleted (it tests the dropped function). |
| `picker_diet_types` view (0166) | **restated without the legacy columns, not dropped.** Its one caller (`src/lib/diets/recipes.ts`) reads only `id, name, name_th, unit`, so keeping the view means no app change; moving the caller onto `picker_diets` would have been wrong anyway, since that view lists recipes and the caller needs ingredients. |
| `stock_diet_types` view (0161) | restated without `is_standard`. Nothing read it from this view (`management/diets` hard-codes `false`). |
| `admin/diets/page.tsx`, `actions.ts` | `record_count` per ingredient is now residents on a recipe that uses it, instead of the legacy column; `deleteDietType` drops its `resident_diets.diet_type_id` check (a resident can only reach an ingredient through a recipe, and "in a recipe" is already refused); `createDietType` no longer sends `daily_qty_* = 1`; `dropBridgeRecipe` removed. |

Then the columns (`diet_types.daily_qty_*`, `is_standard`; `resident_diets.diet_type_id`, `daily_quantity`), with their checks and
indexes, and `role_home_tiles` with its guard.

## Kept on purpose

The audit label ("Home screen tile") and the `undo.ts` mapping for `role_home_tiles` stay in code: audit rows written before the drop
still name the table, and deleting the label would damage history to tidy schema.

## Order of release

The new app stops sending `daily_qty_*` on a new ingredient. Until `0243` is applied, the old columns are `not null`, so a new
ingredient would fail on a database that has not got the file yet. Apply `0243` with the release that carries this app, not before the
previous app is gone, and not long after (an older app inserting an ingredient after the columns are dropped fails the other way).

## `role_home_tiles` rows on dev

The table was seeded from role cards by `0225`. Four audit rows show Lutan editing it on dev on 2026-10-21: `management` gained
`/enclosures` and `/management/dashboard` (and two reorders). Those two are the only rows the cards do not explain; they are dev test
edits and are dropped with the table. Production was not read.
