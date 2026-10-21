# Diets made of ingredients — design note

Status: **proposal, for Lutan to answer in a line or two** (2026-10-21). Nothing is built.
Next: a schema PR, then the app PR (backlog item *Diets made of ingredients*).

## The problem in one paragraph

Today a diet **is** one product (`diet_types`, `0051`): one name, one unit, one cost, one daily
amount per size. "Standard" is a single 4-cup product, so Purchasing orders all 4 cups as kibble
(40 × 20 kg bags when about 10 are needed). The Diabetic diet is home-cooked from several things
and cannot be ordered at all. The fix is to split **what we buy** from **what a dog eats**.

## The proposal

1. **Ingredients are the stock items.** `diet_types` stays exactly as it is — same table, same
   ids — and is what Purchasing, stocktake, deliveries, bills, pack sizes (`0118`) and prices
   already hang off. In the UI it is renamed **Ingredients**. Kibble, chicken, rice, and each
   raw Diabetic ingredient are rows here. No stock history moves.
2. **A diet is a recipe.** New table `diets` (name, Thai name, `is_standard`, notes) and
   `diet_ingredients` (diet, ingredient, amount per day for small / medium / large, serving unit).
3. **A resident's diet points at a recipe.** `resident_diets` gains `diet_id`. Staff choosing a
   diet see recipe names, as now.
4. **Anything that forecasts, buys or counts expands the recipe into ingredients.**

### Schema sketch (for the schema PR; not a file to ship)

```sql
create table diets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_th text,
  is_standard boolean not null default false,   -- moves here from diet_types (0087)
  notes text,
  created_at timestamptz not null default now()
);
create unique index diets_one_standard on diets (is_standard) where is_standard;

create table diet_ingredients (
  diet_id uuid not null references diets(id) on delete cascade,
  diet_type_id uuid not null references diet_types(id),   -- the ingredient
  serving_unit text,            -- null = the ingredient's own unit; else a name from item_unit_conversions
  qty_small numeric not null check (qty_small > 0),
  qty_medium numeric not null check (qty_medium > 0),
  qty_large numeric not null check (qty_large > 0),
  primary key (diet_id, diet_type_id)
);

alter table resident_diets add column diet_id uuid references diets(id);
-- back-fill, then NOT NULL; diet_type_id kept (nullable) until the app stops reading it
```

RLS copies `diet_types` (admin and management write; staff, vet and volunteer read). Prices stay
off the picker views as `0151` does.

### Cups to kilograms: reuse the conversions table

`item_unit_conversions` (`0118`) already holds "1 cup of kibble = 0.1 kg" as a row for the
ingredient. A recipe line says "1.5 cups"; the forecast multiplies by that row's
`base_units_per` to get the ingredient's base unit (the unit it is bought and counted in). If the
serving unit is null, the amount is already in the base unit and nothing is converted. **No new
conversion table.** A recipe line whose serving unit has no conversion row is refused by the
form, so the forecast never meets one.

### Expansion lives in the two forecast functions

`diet_forecast()` and `stock_diet_forecast()` keep their **signatures and return shapes** (one row
per `diet_type_id`, which now means per ingredient). Each swaps its join from
`resident_diets → diet_types` to `resident_diets → diet_ingredients → diet_types`, with the
amount converted to base units. Because the output shape does not change:

- `cashflow_forecast()` (calls `diet_forecast`), **Purchasing**, **Diet stock cards** and the
  **Diets forecast page** need no logic change, and they read ingredients, which is what they
  should.
- **Stocktake, deliveries, bills, the cupboard order** are untouched: they only ever saw
  `diet_types`.
- Changed in the app PR: **stock usage against plan** (`src/lib/management/stock-usage.ts`, which
  finds "a resident on a diet for this item" itself in TypeScript and needs the same expansion),
  the **Diet section / hub** and **archive PDF** (`resident-record.ts`), the **resident export**,
  **Feed Special Diets / diet sheet** (shows the recipe, not the stock items), the enclosure-card
  "special diet" test (`src/lib/diets/special.ts`, keyed on `is_standard`, which moves), intake
  (`record_intake`, `set_standard_diet`, both take a `diet_id`), and Settings → Diets.

### Per-resident quantity override (`resident_diets.daily_quantity`)

Today a single number replaces the size default. With several ingredients one number is
ambiguous. **Proposal: it becomes a multiplier on the whole recipe** — new column
`portion_factor numeric` (1.0 = normal, 0.75 = three-quarter portion, 1.25 = more), replacing
`daily_quantity` in the form. Back-fill: for each row with a `daily_quantity`, the factor is
`daily_quantity / size default` so today's amount is exactly preserved. (Alternative: let the
override name one ingredient. Rejected as fiddly for a rare case.)

## Migration and the "nothing moves on the day" guarantee

One back-fill, in the schema PR:

- For **every existing `diet_types` row**, create a `diets` recipe of the same name with **one**
  ingredient (that row), amounts copied from `daily_qty_small/medium/large`, no serving unit.
  `is_standard` is copied.
- Every `resident_diets` row gets the `diet_id` of its type's recipe; `daily_quantity` becomes
  `portion_factor` as above.
- A single-ingredient recipe expands to exactly today's formula, so **both forecasts return the
  same numbers**. The schema PR proves this with a before/after of `diet_forecast` and
  `stock_diet_forecast` over a month (a rollback-wrapped query, per `CLAUDE.md`), and the
  app PR repeats it.
- `diet_types.daily_qty_*` and `is_standard` stay in place, unread, until the app PR is live;
  a later cleanup migration drops them. The old columns are not edited.

The schema PR carries code that ignores the new tables, so it is harmless to the live app. Per the
rules it must be applied to dev the same day and shipped together with the app PR to production
(`--status --env production` first: production may be several migrations behind).

## Then the data, not the code

After the app PR, the Director (or Lutan) edits **Standard** in Settings → Diets: adds kibble,
chicken, rice, with cups per size, and sets a "1 cup" conversion on each. The Diabetic recipe is
entered the same way. **The real amounts are the Director's** (the example of 1 + 1.5 + 1.5 cups
is only an illustration). Until she does, Standard still shows as one product and buys the same
as today.

## What stays the same for staff

Choosing a resident's diet, the dates, meals per day and notes work as now. Only the picker's
list is now recipes. Stock people keep counting and receiving ingredients exactly as they count
products today.

## Decisions I need from Lutan

1. **Override as a multiplier** (above) — OK? *Recommended: yes.*
2. **Name in the menus:** "Diets" for recipes and "Ingredients" for stock items. *Recommended: yes.*
3. **Does the diet sheet list every ingredient at the dog's size?** (e.g. "Medium: 1 cup kibble,
   1.5 cups chicken…"). *Recommended: yes, with meals per day shown beside it.*

Not needed from him: a cost per recipe. It falls out as the sum of ingredient costs and can show
on the Settings page.

## Risks worth naming

- **Cup conversions are approximations.** A cup of kibble is not exactly 0.1 kg. The 40 → 10
  figure rests on it, so the first real week should be compared with the stock usage page, which
  will now show per-ingredient variance.
- **An ingredient priced at 0** reads as "missing price" in the cashflow (`0183`), which is the
  right behaviour for newly-split ingredients.
- **Two places to look** for the same expansion (SQL and `stock-usage.ts`). The app PR should
  share one definition of "a recipe line's daily need in base units" and test the two agree.
- **Meals per day** only affects how a day's amount is split at the bowl; as today, it does not
  change the daily total.

## Order of work

1. This note → Lutan's answer.
2. Schema PR (own small PR, the only one carrying a migration that day): tables, back-fill,
   updated forecast functions, `record_intake` / `set_standard_diet`; before/after proof.
3. App PR: Settings → Diets (recipes and ingredients), resident Diet section, diet sheet,
   stock usage, archive and export, enclosure cards; manual topic, both dictionaries,
   release line (only once the data step above is not outstanding), decision file
   *a diet is a recipe of ingredients; supersedes `0051`'s one-product diet*.
4. Data entry by the Director. Check: after Standard is split, kibble need falls to about a
   quarter and chicken and rice appear.
