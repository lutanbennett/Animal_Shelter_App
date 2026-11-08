# Suppliers leave Contacts: the schema half (#xkfsv), 2026-11-08

Lutan, asked directly on 2026-11-08: *"Leave contacts entirely"*, and then *"Shelter Friends could also come from a
supplier as well so need same functionality for Shelter friends on both Contacts and Suppliers"*. This PR is the schema
half only (`0335`, `0336`, `0337`). One line under `src/` changed, a declared crossing (see Found). The app half re-points every reader.

## Step zero, measured 2026-11-08

`grep -rln "create table.*suppliers" supabase/migrations/` returned nothing, and `0334` was the highest migration. The
gap was open. Dev held no Vendor contacts, no Shelter Friend that is a supplier, and no delivery or bill naming one, so
the back-fill and re-key were proved by the harness and have nothing real to move on dev. Production has not been read
(a worktree cannot).

## 1. The `suppliers` table (0335): columns carried and dropped

Carried from `contacts` (0001, 0036, 0037, 0054, 0075, 0164): `name`, `phone`, `email`, `line_id`, `messenger_id`,
`whatsapp`, `address`, `map_url` (with the same form check), `notes`, `archived_at`, `archived_by`, `archive_reason`,
`created_at`. These are the fields a business has and the screens already show for a Vendor.

Dropped: `type`. A supplier is one thing, and Contacts holds only people. Nothing else a business lacks was in
`contacts`. Added: `source_contact_id`, unique, the Vendor contact a row was copied from. It makes the back-fill safe to
run twice and is how 0337 maps history. **The app half drops it with the old columns.**

## 2. Row-level security

Every policy resolves through `has_permission()`. **No activity and no card was added**, for two reasons: a card must
apply the access that lets its activity be performed and a supplier card with no supplier screen would do nothing; and
`claude-md-card-coverage` is counting cards on the shared dev database this batch.

So the policies ask activities that already guard the same data. Read: `stock.delivery`, `stock.purchasing`,
`bills.general`, `bills.utilities`, `maintenance.bills`, `friends.manage`, `friends.view`, `contacts.directory` (read).
Insert: `contacts.add`. Update and delete: `contacts.directory`. Whoever could file a Vendor contact before can write a
supplier now, and whoever's screens read a Vendor can read one. `0076`'s role-named `shelter_friends` policies are not
copied. **THE CARD IS THE APP HALF'S JOB**: it creates a supplier card with the screen it opens, gates every control on
the activity its own server check asks, and narrows these policies to that activity in the same PR.

## 3. Back-fill

Every `contacts` row with `type = 'Vendor'` is copied, `on conflict (source_contact_id) do nothing`. `contacts.type` is
one enum column, so a contact cannot be a Vendor and a Carer or Volunteer at once; no row is ambiguous. A Vendor contact
filed after 0335 has no supplier row until the app half's catch-up (repeat the insert at the foot of `0335`, then the
two updates at the foot of `0337`). Both are safe to repeat.

## 4. Can a Shelter Friend be a supplier? Yes: `supplier_id` beside `contact_id`

`shelter_friends.contact_id` becomes nullable, `supplier_id uuid unique references suppliers (id) on delete cascade` is
added, and `shelter_friends_one_subject` requires exactly one of them. Chosen over a subject-type pair because both
subjects stay real foreign keys (cascade, and one uniqueness each), and every existing row already satisfies the check, so
nothing is back-filled. `public_shelter_friends` keeps its columns, their order and its rows for every existing Friend;
a supplier-subject Friend reads name and contact details from `suppliers` through the same `show_*` boxes and drops out
when the supplier is archived. The website does not change. The translation review queue (`private.translation_queue`,
copied from 0175 with only the two Friend branches edited) names and links either subject; the supplier link is
`/suppliers/<id>`, **a screen the app half builds**. `shop_links.friend_id` references `shelter_friends (id)`, so the
Shop already works for either subject through the view.

## 5. History re-keyed additively (0337)

Exactly two columns reference a supplier contact, as the brief said (grep of `supabase/migrations`, 2026-11-08):
`stock_receipts.supplier_contact_id` (0096) and `stock_deliveries.supplier_contact_id` (0308). No third. Each gains
`supplier_id`. The old columns stay and keep working. Until the app half writes `supplier_id` itself, the two stamp
functions fill it from `supplier_contact_id` through `source_contact_id`. **The app half's final PR drops
`supplier_contact_id` from both tables** (and `suppliers.source_contact_id`, and the `stock_vendors` view that selects
Vendor contacts).

## Found, not fixed

- `stock_receipts_cost_only` (0235) refuses any edit but cost, so the foreign key's `on delete set null` cannot null
  `supplier_id` (or `supplier_contact_id`) on a receipt: deleting a supplier that has receipts will be refused. Suppliers
  are archived rather than deleted, and this matches contacts today; the app half should keep it that way or add the
  column to the trigger's open list.
- `audit_suppliers` records changes, but `AUDITED_TABLES` has no label for `suppliers`. CI's `check-audited-tables` failed on it, so **the one declared crossing into `src/`**: `suppliers` is excused in `AUDIT_TABLES_NOT_LISTED` (`src/lib/audit/recent-changes.ts`) with a reason. The app half lists it in `AUDITED_TABLES` with a label in both dictionaries and removes the excuse.
- The string *"No suppliers — add one as a Vendor in Contacts"* in both delivery forms is user-visible and must change
  with the data. App half.
- `Vendor` stays in the `contact_type` enum. Code still reads it.

## Proof

`supabase/harness/0335_suppliers_harness.sql` (rollback, dev): the back-fill repeats with no new rows; an admin writes;
a login holding only `stock.delivery` reads and cannot insert, update or delete; a login with no supplier cell reads
nothing and cannot write; anon is refused; a Friend from a contact and from a supplier both reach the website, both/
neither/duplicate subjects are refused, and an archived supplier drops off; an old-style delivery write gets its
`supplier_id`.
