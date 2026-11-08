# Suppliers leave Contacts: the app half (#xkfsv), 2026-11-08

Lutan, asked directly on 2026-11-08: *"Leave contacts entirely"*, and *"Shelter Friends could also come from a supplier as well so
need same functionality for Shelter friends on both Contacts and Suppliers"*. The schema half (`0335`, `0336`, `0337`) merged as
#1391 at 07:02Z. This is the app half, with one migration, `0338`. Spec: the schema PR's own "For the app half" and its decision file
`2026-11-08-suppliers-schema.md`.

## Step zero, measured 2026-11-08

`0335`, `0336`, `0337` were on `main`; `grep "from('suppliers')" src/` returned nothing, so no code read the table; the string
`supplierNoVendors` still told a user to add a Vendor in Contacts. The gap was open. Dev held no Vendor contacts, so the back-fill
moved nothing on dev (proved by the harness on rows it makes, see Proof). **Production was not read** (a worktree cannot).

## What was built

1. **The screen: Management → Suppliers** (`/management/suppliers`, with `/new`, and a supplier's page `/suppliers/<id>`).
   **Modelled on Management → Contacts** (`page.tsx`, `ContactsTable.tsx`, `CreateContactForm.tsx`, `actions.ts`, the archive control).
   **What that model does NOT do, and so neither does this screen:** no placements or "in care" figures (a supplier has none); no type
   column or type lock; **no Delete** (Contacts has one for a contact with no placements; a supplier is never deleted, see 4); no Friends
   filter chip (the Friend badge shows, the chip does not); the supplier page has no resident or placement history; editing is in the list
   row, not on the page (the page offers Archive/Restore and the Friend card). It shares the contact forms' field labels and error words
   (`t.management.contacts.createForm`, `.errors`) rather than copying them, and has its own title, subtitle, archive wording and errors.
2. **The activity and the card (`0338`).** One level activity, `suppliers.directory` (Read: the list and a supplier's page; Edit: add,
   change, archive, restore), and one card, `suppliers` ("Manage suppliers"), exactly `suppliers.directory` at edit, filed under the same
   feature as Contacts, opening `/management/suppliers`. `catalogue.ts`, `cards.ts`, `routes.ts`, `permission_activities` and `card_grants`
   agree; `check-cards-count` is 54 (it was 53), `check-card-grants` passes on dev (138 rows).
   **Why a new activity rather than reusing `contacts.directory`:** the schema half said the app half narrows the policies to its own
   activity, and "Contacts holds only people" would be false if the people-card still wrote suppliers.
3. **The policies, narrowed.** Insert and update ask `suppliers.directory`. Select keeps the screens that must *name* a supplier
   (`stock.delivery`, `stock.purchasing`, `bills.general`, `bills.utilities`, `maintenance.bills`, `friends.manage`, `friends.view`) and
   gains `suppliers.directory` at read; it loses `contacts.directory`. **No regression:** every role holding the Contacts card is given
   the Suppliers card in the same file. Nothing is given to Admin.
4. **Archive, not delete.** The delete policy is dropped, no control offers it. `stock_receipts_cost_only` (0235) would refuse the
   delete once a delivery names the supplier, and that matches contacts today.
5. **Readers re-pointed** to `suppliers` / `supplier_id`: `deliveries/page.tsx` (picker and "from X"), `deliveries/actions.ts` (both
   inserts now write `supplier_id`), `lib/management/purchasing.ts` (`usualSuppliers`), `lib/management/receipts-server.ts`,
   `management/purchasing/page.tsx` (names read from `suppliers`, not the `stock_vendors` view). **That is five files, not seven:**
   the brief's seven were a lower bound from a grep that finds files that MENTION a supplier. Of them `FriendWizard.tsx`,
   `friends.ts` and `contacts.ts` are the Friend and Contacts halves, handled under 6 and 7. **`carers.ts` does not read a supplier**
   (`src/lib/**/carers.ts` and its callers read Carer contacts only); there was nothing to re-point and it is untouched.
   `scripts/check-purchasing.mjs` fixtures renamed to match.
6. **Contacts holds only people.** `PEOPLE_CONTACT_TYPES` (Carer, Volunteer, Partner) is what every form offers and accepts
   (`insertContact`, `updateContact`, the create form, the type chips). **`Vendor` stays in the enum and in `ContactType`** (an enum value
   cannot be added and used in one transaction and code still names it; the brief says not to drop it). `/contacts` and
   `/management/contacts` hide Vendor rows (`type <> 'Vendor'`) because each was copied to a supplier. The copy is not deleted: a later
   PR retires the Vendor rows with the old columns.
7. **A Shelter Friend from a supplier, as from a contact.** `createSupplierFriend` (card on the supplier page), the wizard's
   "Pick … you already have" lists suppliers beside Partner contacts, and "Add a new business" offers Partner or Supplier (a new supplier
   goes through the same `insertSupplier` as the Suppliers form, in `lib/suppliers/create.ts`). `ShelterFriendCard` takes a `kind`;
   every action by Friend id (update, publish, logo, delete) was already subject-agnostic and now revalidates either page.
   `FriendsOrder` and the order logic name either subject. **What replaced `FRIEND_CONTACT_TYPES` on the supplier path: nothing.**
   A supplier is a business by definition, so every live supplier is eligible; an archived one is refused. `FRIEND_CONTACT_TYPES` is
   now `["Partner"]` (contacts only). **A Shelter Friend on a Vendor contact** would have lost its card when Vendor rows were hidden,
   so `0338` re-points it: `supplier_id` = the supplier twin, `contact_id` = null. Its profile, translations (keyed by the Friend's own
   id), Shop links and place on `/friends` are untouched (`public_shelter_friends` reads either subject, 0336).
8. **The string.** `supplierNoVendors` (kept as one key) now reads *"No suppliers — add one under Suppliers"*, and *"ไม่มีผู้จำหน่าย —
   เพิ่มได้ที่หน้าผู้จำหน่าย"* in Thai. **Thai is unreviewed by a Thai speaker**, as is every Thai string added here (the Suppliers
   block, the card label and description, the nav label, the audit label, the Management tile, the wizard type, the reworded Friend
   strings). Other copy that said suppliers live in Contacts was corrected (Contacts subtitle and list intro, the manual, the card
   walkthrough, the Friend wizard help). The manual has a new topic, *Managing suppliers*.
9. **`suppliers` is in `AUDITED_TABLES`** with a name entry and a label in both dictionaries, and the `AUDIT_TABLES_NOT_LISTED`
   exemption the schema half added is **removed** (it is now `{}`). `check-audited-tables` passes with 48 audited tables.
10. **`/suppliers/<id>`** exists (the translation queue's link). `/suppliers` itself redirects to the list, behind the same guard.
11. **The catch-up back-fill** is in `0338`: the 0335 insert and the two 0337 history updates, repeated, all safe to run twice. Dev held
    no Vendor contacts, so on dev it moved nothing; the harness makes a late Vendor, runs the insert twice (1 row then 0) and re-points a
    Friend. **Not exercised on production.**

## Controls on the screen, and the activity each one's action asks

Read from the action files, not from the labels.

| Control | Where | Drawn when | Action asks |
|---|---|---|---|
| New supplier (link) | list | `can(suppliers.directory, edit)` | the `/new` page asks `suppliers.directory` at edit |
| Add supplier (submit) | `/new` | page guard | `createSupplier`: `suppliers.directory` edit |
| Edit, Save, Cancel | list row | `canEdit` prop (default false) | `updateSupplier`: `suppliers.directory` edit |
| Archive, Restore | list row, supplier page | `canEdit` / `can(... edit)` | `archiveSupplier`, `restoreSupplier`: `suppliers.directory` edit |
| Make a Shelter Friend and the whole Friend card | supplier page | `can(friends.manage)` | `createSupplierFriend` and the Friend actions: `friends.manage` |
| Show archived (link) | list | always | read only |

**Found, not fixed.** The Management → Shelter Friends order screen (`FriendsOrder.tsx`) draws Publish/Up/Down for anyone the page
guard admits; the page asks `friends.manage`, which is also what its actions ask, so they agree (nothing to fix). The wizard's *Pick* list
reads suppliers the select policy allows through `friends.manage`, so a login with that card sees every supplier name though it lacks
`suppliers.directory`; intended (a Friend must be chosen by name).

## Left for a later PR, and which

**The final PR drops** `supplier_contact_id` on `stock_receipts` and `stock_deliveries`, `suppliers.source_contact_id` (and the unique
index it carries), the `stock_vendors` view, and retires the Vendor contact rows. It must wait until this PR is in production and
nothing reads the old columns, so it cannot be this PR (the brief says not to). It is still the open part of `#xkfsv`.
**Card-shaped read for the planner:** no existing card holds both `suppliers.directory` and `contacts.directory`; the Contacts and
Suppliers cards are separate, so a login that should do both holds both. The Friend's make-from-supplier needs `friends.manage`
(the Publish Shelter Friends card) as well as `suppliers.directory` to *find* the supplier page.

## Proof

- `supabase/harness/0338_suppliers_card_harness.sql` (rollback, dev; HARNESS-OK): the activity and card exist and the card grants
  exactly the one thing; an edit login adds, changes and archives but a delete touches nothing; a read login reads and cannot write; a
  `stock.delivery` login reads a name and cannot write; a Contacts-only login now reads and writes nothing; the back-fill repeats safely;
  a Friend on a Vendor contact re-points and stays on the website.
- Browser, signed in on dev (`dev-signin.mjs --cards suppliers`, and Admin), reaching each page by clicking through: the tile on Home
  opens the list; add, edit, archive and restore a supplier; the supplier page; as Admin, Make a Shelter Friend on a supplier (profile
  created as a draft) and the Shelter Friends list naming it with a link to `/suppliers/<id>`; the delivery form's supplier picker lists the supplier and
  a delivery recorded against it reads "from <supplier>". **Not driven:** the five-step Shelter Friend wizard's save with a supplier (both
  existing and new), and Thai rendering. They type-check and share the code the driven paths use.
