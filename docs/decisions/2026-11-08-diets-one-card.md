# Settings → Diets opens on one card (`diets.settings`, 0340)

**Backlog:** `#d3cw7`, Security. **Lutan, 2026-11-08, asked directly:** one card opens diet settings, over splitting the
page. Reported by #1370 (`2026-11-07-control-gates-list-pages.md`): the page asked `reference.types` Edit **and**
`stock.diets` Edit together through `canEditItemSettings(perms, "diet")`, and nothing a person looks at said so.

## Step zero (2026-11-09)

The gap was still there: all six diets call sites (`page.tsx:24`, `[id]/page.tsx:14`, `ingredients/page.tsx:16`,
`ingredients/[id]/page.tsx:14`, `actions.ts:53`, `recipe-actions.ts:44`) asked the pair, and no decision file or commit had
closed it.

## The activity: `diets.settings`, yes/no

The brief left this open. Chosen: a **new yes/no activity**, `diets.settings`, area `settings`, sort 87.

- **One question for the whole page.** Every screen and every save asks it and nothing else, so a control and its action
  can never disagree and a one-card login proves the whole page.
- **Yes/no, not a level**, because nothing on these screens is offered to read that is not also offered to change; a Read
  level would open a page whose every control is refused, which is the fault being fixed.
- **Not `stock.diets` alone** (forbidden by the item: it would widen a cell `/management/diets` uses) and **not
  `reference.types`** (it opens the other setup lists).

The card is `diet_settings`, *Set up diets*, holding exactly `diets.settings`, opening `/admin/diets`, filed under the food
forecast's feature. Card count fifty-four → fifty-five (`check-cards-count.mjs`, `cards.test.mjs`).

## What the card applies (0340)

A card must apply the access that lets its activity be performed. Added, never replacing anything:

| Table | New permissive policies on `diets.settings` |
|---|---|
| `diet_types`, `diets`, `diet_ingredients` | select, insert, update, delete |
| `item_unit_conversions` | the same four, **an ingredient's rows only** (`diet_type_id is not null`) |
| `units` | select (the unit pickers) |

Existing policies are untouched, so nobody who could read or write these rows loses anything. A login with `stock.diets` Edit
can still write these tables in the database as before (that is the stock side's own access, unchanged); it no longer opens the
Settings page, because the app asks `diets.settings`.

**`diet_usage()`** (definer, refuses at the top with the key `diets.settings_not_allowed` unless `diets.settings`): the recipe
book's *residents on it now* and the delete guard's *records naming it*, as **counts**. The page used to read `resident_diets`
directly, which asks `medical.diet`. A card for keeping recipes should not be handed who eats what, and without some read a
one-card login saw every diet as unused and Delete hit the foreign key's raw error. Counts are all the page ever used.

**Nobody is given the card.** On dev no card in the catalogue grants `reference.types` at all or `stock.diets` at Edit, so no
role could open the page through its cards; Admin alone used it and Admin sits outside the card system. Lutan assigns it.

## The shared helper

`canEditItemSettings` is **unchanged** (behaviour and signature). Its comment now says diets left it. Callers re-pointed for the
diet kind only:

- the six `/admin/diets` call sites → `requirePermission("diets.settings")` / `can(perms, "diets.settings")`;
- `management/units/actions.ts` (an item's ways of measuring, asked from the ingredient page): `mayEditMeasures()` asks
  `diets.settings` for an ingredient and `canEditItemSettings` for a medicine, exactly as before;
- `deliveries/promote-actions.ts` and `deliveries/page.tsx` (turning a delivery line into an ingredient): the diet branch asks
  `diets.settings`, still with `stock.delivery`;
- `management/diets/page.tsx`: the link to Settings → Diets is drawn on `diets.settings`.

**The diet kind of `canEditItemSettings` is now asked only by Settings → Units** (`admin/units/page.tsx`,
`admin/units/actions.ts`), which opens for whoever may set up either kind of item. That was left exactly as it was, as the
brief required; whether Units should also open on `diets.settings` is a question for the planner (below).

## Controls on `/admin/diets` and its sub-pages

Every page refuses unless `diets.settings`, and every action below asks `diets.settings` itself, so each control is drawn only
when its action can run.

| Control | Action | Activity asked |
|---|---|---|
| Add a diet | `createRecipe` | `diets.settings` |
| Add an ingredient | `createDietType` | `diets.settings` |
| Diet page: rename / save, Make Standard, Delete, Save servings, Add ingredient, line Edit / Remove | `recipe-actions.ts` | `diets.settings` |
| Ingredient page: Save, Delete | `updateDietDefinition`, `deleteDietType` | `diets.settings` |
| Ingredient page: Add a unit, unit Edit / Delete | `saveConversion` / `deleteConversion` (kind `diet`) | `diets.settings` |
| **Stock** link (to `/management/diets`) | navigation | now drawn only when `canOpen` that route (`stock.diets` Read) |

**Found, not fixed:** none on these pages.

## What was driven (dev, port 3002)

- `dev-signin.mjs --cards diet_settings`: home shows **Set up diets**; clicking it opens the recipe book (counts from
  `diet_usage()`, *2 residents on it*), no Stock link; the Pumpkin ingredient's note saved (*Saved.*, and read back from the
  database). Screenshots in `docs/test-plans/shots/diets-one-card-*.jpg`.
- A rollback harness run as that same login: reads units and the book, inserts an ingredient, a diet, a line and a measure,
  updates and deletes them; reads no `resident_diets` rows and no medicine measures.
- **The half-holding case.** No card grants `reference.types`, so a login holding it without the new card cannot be built.
  The nearest, `--cards food_forecast` (`stock.diets` Read): home shows only *See the food forecast*, no Settings section;
  Diet stock opens and draws no link into Settings → Diets. It gets no diets tile and no dead link.

## For the planner

- **Settings → Units** still opens on `canEditItemSettings(diet) || canEditItemSettings(medication)`, two cells together per
  kind, and no card grants `reference.types`, so only Admin reaches it. A holder of the new card who needs a new unit of
  measure cannot add one.
- **`item_unit_conversions` write policies ask `stock.diets` for every row, medicine rows included** (read on dev
  2026-11-09), while `/admin/medications` asks `stock.medications`. A medicine's ways of measuring are refused to a login with
  the medication cells but without `stock.diets`. Not changed here.
