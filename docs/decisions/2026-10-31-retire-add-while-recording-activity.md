# Retire the `reference.add_while_recording` activity (0291)

`0287` retired the card (`docs/decisions/2026-10-30-add-while-recording-retire.md`); this retires the activity it granted. Lutan,
2026-10-30: *"Missing medication added by admin only as part of system configuration."*

## What actually asked it: read from dev, not from the files
`grep -l` over `supabase/migrations/` names it in eight files (`0132`, `0148`, `0151`, `0166`, `0182`, `0230`, `0281`, `0287`). Most
of those are seeds, comments, the card's own rows, or policies long since replaced. What is **live** was read from `pg_policies`,
`pg_views` and `pg_proc` on dev on 2026-10-31:

| object | what it asked |
|---|---|
| `medication_insert_perm` | `stock.medications` Edit **or** the activity |
| `frequency_insert_perm` | the activity **or** `reference.types` Edit |
| `procedure_types_select_perm` | `medical.procedures` Read **or** `reference.types` Read **or** the activity |
| `procedure_types_insert_perm` | the activity **or** `reference.types` Edit |
| view `picker_medications` (last written by `0166`) | `stock.medications` Read **or** the activity **or** `medical.prescriptions` Read |

No function asked it. No `card_grants` or `role_permissions` row held it. The backlog item's "`0148`/`0151`" was right about the
policies and missed the view, which `0166` restated.

## Decision: option (a), rewrite and retire. Not (b), keep as an Admin-only marker
`has_permission(a)` is true when the login is Admin or its role holds a cell for `a`. No role holds this cell, so each term was true
for **Admin and nobody else**. Every one of the five objects keeps another term that is already true for Admin, because
`has_permission` answers yes to Admin for any activity. So removing the term changes **no login's answer**, Admin included, and the
reference screens stay where Lutan put them: outside the card system, Admin's alone.

(b) would have left five objects asking a question whose answer is "is this Admin?" by a roundabout route, plus a catalogue row and a
Settings label for an activity no card can carry. That is exactly the shape the card rule forbids (a box that does nothing), and a
comment saying "this is deliberate" is one more thing for the next reader to trust. (a) leaves nothing to explain.

**Nothing was put on a card and nothing was given to Admin.** `reference.types` is still granted by no card.

## Proof
`scripts/check-retire-add-while-recording.mjs` replays `0291` inside a rolled-back transaction and asks all five statements before
and after as Admin, as a login holding nothing, and as one login per remaining cell (`stock.medications` Read/Edit, `reference.types`
Read/Edit, `medical.procedures` Read, `medical.prescriptions` Read). Every answer is the same before and after, Admin is allowed all
five, and nothing live names the activity afterwards. It cannot include a login holding the retired cell after the file, by
construction: the file refuses to run if any role or card holds it (the guard at its top), and the foreign key from `role_permissions`
would refuse the cell anyway.

## What moved with it
- `catalogue.ts`, both dictionary labels: removed.
- `roles-draft/draft-1.json` / `draft-2.json` row 53: `keys` emptied, the same shape as the drafts' other non-cell row. No role ticks
  row 53, so the draft resolves exactly as before; a future tick fails loudly ("not a cell") rather than naming a key that no longer
  exists. `0212` (`facility.map`) edited the drafts the same way.
- `scripts/check-permission-catalogue.mjs` B: a migration may name a retired activity in `has_permission()` **only if it is numbered
  before the file that retires it** (those policies were replaced). Naming it in that file or after still fails. Applied files are never
  edited, so without this B would go red on `0148`/`0151`/`0166` for ever.
- The four probe references (`permission-probes.mjs`, `readonly-checks.mjs`):
  - the **medication insert** probe now asks `stock.medications` Edit, and loses its `sharedWith` (nothing else opens it now);
  - the **frequency** and **procedure_types insert** probes now ask `reference.types` Edit, which is what their policies ask;
  - **`doctor-cells`** asks the 12 of `0230`'s 13 cells that still exist. Without this it would report the retired cell missing for
    ever, and could never go green even if the Doctor were given back every card. This does **not** clear its red: the Doctor is
    Lutan's one-card-at-a-time test role (`2026-10-25-doctor-is-the-test-role.md`), and its count stays his.
- `check-perm-convert-stock-and-lists.mjs` (0148) and `check-price-free-pickers.mjs` (0151) seeded a principal holding the cell. The
  first loses it (and the known fault it counted, below) and gains a sweep that no policy on its tables names the activity. The second
  keeps the principal as `c_rx_read`, the `medical.prescriptions` Read that actually opened its picker read, now refused the insert;
  it gains a sweep that `picker_medications` no longer names it.

## Closed by this
`docs/card-access-faults.md` (2026-10-26): *a role whose only cell is `reference.add_while_recording` is stopped by the units trigger*.
The cell no longer exists, so the outcome cannot happen.

## Folded in: `shop.manage` read probe
`#1123` gave `shop.manage` an edit probe and left the read for want of a `shop_links` row on dev. `check-who-does-what.mjs` now makes a
hidden `shop_links` row (`$SHOP`) in its rolled-back setup, and `permission-probes.mjs` reads it under `shop.manage` Read. Box counts
before and after are in the PR.

## Applied
Dev, 2026-10-31. Production: with the release, migrations first. Old app code against it is harmless: its catalogue lists one activity
the database no longer has, which no card grants and no screen offers.
