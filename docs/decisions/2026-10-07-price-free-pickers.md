# 2026-10-07 — A price-free view for the medicine and diet pickers (`0151`, closes N1 and N2)

The follow-up `2026-10-06-perm-convert-stock-and-lists.md` filed: staff read `medication.cost_per_unit` and the diet prices
only because the forms read the two tables directly, so `reference.add_while_recording` and `resident.register` had to stay
in the two read policies. App first, then the policies. This file records what the app change turned out to involve, which
was wider than "the pickers".

## The views

| View | Columns | Rows for a login holding |
|---|---|---|
| `picker_medications` | `id, name, dose_unit` | `stock.medications` Read, `reference.add_while_recording` or `medical.prescriptions` Read |
| `picker_diet_types` | `id, name, unit, daily_qty_small, daily_qty_medium, daily_qty_large, is_standard` | `stock.diets` Read, `resident.register` or `medical.diet` Read |

Owner-rights fixed-column views in the `0136`/`0140`/`0143` shape, each carrying the comment "a new column is private until
it is added here". **The audience of each is the old table audience plus the medical cell for the same list** (`medical.prescriptions`,
`medical.diet`), added after the first draft: without it a vet's resident page, which reads names by embed, would lose them.
The extra cells see names and units only, which the 2IC and Head of Medical already read through their own views. The diet view carries the three daily quantities and the standard flag as well as id/name/unit: the diet form
defaults a resident's quantity from them and intake hides the standard type by the flag. They are quantities, not prices.

## Readers that moved

The brief named the two `options.ts` files. There were more, and **the embeds were the ones that mattered**: a PostgREST
embed (`medication(name)`, `diet_types(name)`) is a read of the table under the caller's RLS, so once staff lose the select,
every embed silently returns `null` and the screen falls back to "unknown medication" with no error anywhere.

- `src/lib/prescriptions/options.ts`, `src/lib/diets/options.ts`, `src/app/residents/new/page.tsx`: `from("picker_…")`.
- Embeds, re-pointed under the same alias so the row types do not change (`medication:picker_medications(name, dose_unit)`,
  `diet_types:picker_diet_types(…)`): the resident page's prescription and diet lists, the prescriptions and diets sections,
  `src/lib/archive/resident-record.ts` and `src/lib/residents/export.ts`. A view embeds when its columns trace to the base
  table's key (checked against dev's PostgREST: relationship found, 200).
- `src/lib/diets/special.ts` used `diet_types!inner(name)` with a filter on `is_standard`; an inner join over an invisible
  table would have dropped every row. It now reads the type names from the view and filters `resident_diets` by id.
- **`src/app/prescriptions/actions.ts` inserted a medication and read its id back with `.select("id")`.** `INSERT … RETURNING`
  needs the new row to pass the *select* policy, which a login holding only the add cell no longer does. The form now makes the
  uuid itself and inserts without `RETURNING`. The insert policy (`0148`) is unchanged.

Left on the table on purpose: Management → Medications and Diets, stock usage and the label-photo route read the table
through `stock.medications` / `stock.diets`, the cells that are meant to see prices.

## The policies afterwards

`medication_select_perm`: `stock.medications` Read. `diet_types_select_perm`: `stock.diets` Read. Insert, update and delete
are `0148`'s, unchanged. The `admin_all_*` and `vet_*` policies are untouched, so **the vet still reads both tables (the vet
half of the Security item, C10 and N1's vet column)**.

## Which known entries closed

N1 and N2 for **staff**. N1 also lists the vet and N2 only staff; the vet column of N1 stays, because the vet's own policy is
the parked clinics work.

## The Security item, precisely

`medication` and `diet_types`: the volunteer already could not read either after `0134`/`0148`; what `0151` closes is
**staff** reading their price columns (and any login holding only the add or register cell). `stock_receipts` and
`stock_counts` are **not touched and did not need to be**: `0143`/`0145` already replaced their role-named reads with cell
reads (`stock.delivery`, `stock.count`, `stock.purchasing`), so a volunteer reads neither; the Deliveries page selects
`stock_receipts.cost` directly because that is its job for a login holding `stock.delivery`. A fixed-column view would not
close anything there. The vet half of the Security item and the C-numbered tail stay open.

## A known gap: the vet on dev

The vet keeps both tables through `vet_read_*`, but the vet's **embeds** now read the views, which admit by cell. The seeded
matrix (`0132`) gives the vet both medical cells, so names show. **Dev holds the Director's draft matrix, where the vet has
no medical cells, so on dev a vet's resident page shows "unknown medication" and no diet name.** I did not name the vet in
the views: a role in a view contradicts the cell model, and which cells the vet holds is the Director's open question. If the
draft is applied to production as it stands, this surfaces there; the fix is a cell, not a view change.

## Measured

- `scripts/check-price-free-pickers.mjs` (new): 65 checks, GREEN.
- `check-permission-parity`: **1,910 match / 24 known / 21 mismatch.** Known fell 26 → 24: the two staff entries of N1 and N2
  were reported stale and removed from `scripts/lib/permission-probes.mjs` (N1 keeps the vet, N2 goes; C10 stays). The 21
  mismatches are the vet's, as before. (The brief's 1,913 match baseline did not reproduce; the total is 1,955 here against
  its 1,960, and I did not chase the five.)
- `check-policy-role-names` GREEN, `check-permission-catalogue` exit 0, `check-permission-tables` ends HARNESS-KNOWN-RED
  with the same vet lines.
- Driven as a throwaway staff and management login: staff read names through both views and both embeds, read no price
  directly, and insert a medication without a read-back; management reads prices.
- `gates` after syncing `main`: typecheck=0 lint=0 build=0.

**Production apply is Lutan's**, before the deploy (the app reads the views): `--dry-run` then apply `0151`.
