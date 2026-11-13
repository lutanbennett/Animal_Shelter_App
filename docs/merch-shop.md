# The merchandise shop: specification

**Backlog item `#cjxq0`. Schema, card and this specification landed in migration `0369_merch_shop_schema.sql`
(stream `shop-schema`, 2026-11-14). Two later streams build the screens from this file:
`shop-public` (the public catalogue, cart and checkout) and `shop-staff` (the staff screens).**
Decisions behind it: `docs/decisions/2026-11-13-merch-shop-schema.md`.

## Read this first: what this is NOT, and one caveat

- **It is not the affiliate-links page.** `/shop` ("Shop for the shelter", migration `0285`, table `shop_links`,
  card `manage_shop_page`, strings `t.shop.*`) is a page of links to other shops. **It is untouched and stays as
  it is.** The merchandise shop is the shelter's own goods (T-shirts and the like) sold from the website.
- **No payment integration, in any form.** Payment is manual (below). Do not add a gateway, a payment-provider
  column or a webhook. A card processor would break the zero-ongoing-cost rule through per-sale fees and is a
  separate, later decision.
- **THE ANSWERS BEHIND THIS WERE GIVEN BY LUTAN IN CHAT ON 2026-11-13, NOT READ FROM THE DIRECTOR IN WRITING**
  (`docs/decisions/2026-11-13-answers-receipts-shop-payments.md` says so itself). He is with her in Chiang Mai
  through mid-November 2026. Treat the shape as what those answers support, **not as her signature**, and expect
  corrections.

### Two points that are UNDECIDED, and neither blocks the build

1. **Who answers "where is my order".** Not decided. **Do not model an owner for it.** The order page shows the
   status and tracking; a buyer who needs more uses the shelter's ordinary contact details. Whoever is named later
   needs no schema change.
2. **Print-quality logo files.** The Director does not have them; Lutan is to supply them. They are needed only
   before a supplier can start printing, not before the shop can be built or an empty catalogue shown.

Also **not decided and not blockers**: the products, their prices, the margin and the first supplier. The
catalogue is entered later through the staff catalogue screen. **Every screen must work with an empty catalogue.**

## The route (recommendation)

**Recommend `/shop/merch`**, a sub-path under the existing shop, with the checkout at `/shop/merch/checkout` and an
order status page at `/shop/merch/order/<id>`. Checked, not assumed:

- **No SEO or link cost.** The live `/shop` page, its share metadata and its `public_pages` key `page:shop`
  (`0290`) do not change, so nothing that links to it breaks. Renaming it was the alternative and would break
  every existing link and the page's search standing for no gain.
- **It is public and localised with no new plumbing.** `PUBLIC_PAGE_PREFIXES` in `src/lib/public-paths.ts`
  already holds `/shop`, and `underPrefix` matches at a segment boundary, so `/shop/merch` is already a public
  page, with its Thai twin `/th/shop/merch` and the `publicAlternates` entries following the same rule as `/shop`.
  A new top-level route such as `/merch` would instead need a new prefix, a Worker cache entry and sitemap work.
- **Two things `shop-public` must do about it:**
  1. **Cache.** The Worker edge-caches every public page except `NOT_EDGE_CACHED_PAGE_PREFIXES`, and that list is
     compared by exact prefix, so `/shop/merch/checkout` and `/shop/merch/order` (per-buyer, must never be cached)
     must be added to it as their own entries. The catalogue page may stay cached; a ten-minute-old
     "available" flag is acceptable, and the checkout re-checks it.
  2. **Hiding it.** `site_content.hidden_public_pages` accepts only keys listed in its check constraint (`0256`,
     widened by `0290`). Hiding `page:shop` would hide both shops. If the Director should be able to switch the
     merchandise shop off alone, `shop-public` adds `page:shop-merch` by a new additive migration that restates
     the constraint with the whole list, exactly as `0290` did.
- **Keep the two shops apart in the dictionaries.** `t.shop.*` belongs to the affiliate page. The merchandise
  shop uses its own namespace, **`t.merchShop.*`** (public) and **`t.merchStaff.*`** (staff), and the public
  menu label is "Merchandise" (not "Shop"), so a supporter and a developer both see two different things. The
  staff route is `/management/merch-shop`, already in `routes.ts` (activity `merch.manage`, read).
- A later, optional step, **not for these streams**: make `/shop` a landing page linking to both. It would be a
  user-visible change to a live page and is the Director's call.

## The card

**One card: `run_merch_shop`** ("Run the merchandise shop"), granting one level activity,
**`merch.manage`**, at edit. Opens `/management/merch-shop`. Given to no role: Lutan assigns it in Settings → Who
does what. Admin holds no cards and sees everything through the Admin short-circuit.

**Why one and not two.** Splitting catalogue from orders would be right only if different people did them. The
answers name no such split, and a second card that nobody can say who holds is exactly the "card that does nothing"
state the card checks forbid. If the shelter later wants an order-packer who must not change prices, **add a
second activity and card then**: the policies below ask one activity per table, so narrowing one table later is a
small migration.

**What `merch.manage` does, at the database:**

| Level | Every one of the six `merch_*` tables | `suppliers` |
|---|---|---|
| read | select | select (to read a supplier's delivery method) |
| edit | insert, update, delete | update (to set `delivery_method`); the supplier screen's other writes stay with the cards that already hold `contacts.*` |

**Controls follow the card.** Per `CLAUDE.md` ("A button is shown only if the login's cards let it do that
action"): every button on the staff screens asks `can(perms, "merch.manage", "edit")`; reading asks `"read"`. The
database refuses the rest. **Card-derived only: never a role name.**

**The public side holds no card.** Anonymous visitors read the two `public_merch_*` views; a checkout is written by
the server with the service role (see "Checkout" below).

## Tables

All in baht unless stated. All six have row level security on and **every policy asks `merch.manage`** and nothing
else. `anon` has no grant on any of them.

### `merch_products`: what is sold

| Column | Meaning |
|---|---|
| `id`, `name`, `description` | Name and text. Thai comes through the translations queue (`translatable_fields`), as `shop_links` does; the public view returns `translations`. |
| `price_thb` | Price of one, in baht, `>= 0`. |
| `postage_thailand_thb`, `postage_overseas_thb` | **Set per product, both entered when the product is added** (answer of 2026-11-13). Postage for ONE of this product. |
| `supplier_id` | Optional, `suppliers.id`. **Null = no supplier chosen yet**, so only shelter stock can be sold. This is how "no supplier yet" is modelled without removing the per-supplier model. |
| `photo_drive_file_id` | A Drive file id. Upload plumbing exists in `src/lib/shop/upload.ts`; reuse it. |
| `sort_order`, `shown` | `shown` defaults **false**: a new product is hidden until the staff choose to show it. |
| `archived_at` | Retired product. Archived products are hidden and kept for past orders. |
| `created_by/at`, `updated_by/at` | Stamped by a trigger from the session, never from the request. |

### `merch_variants`: size and colour, and the shelter's own stock

`product_id`, `size`, `colour` (both optional; a one-size, one-colour product has one row with both null; unique
per product), `shelter_stock` (`>= 0`: **how many the shelter itself holds on its shelf**; what a supplier could
make is not counted), `shown`, `sort_order`.

### `merch_orders`: one customer order

`order_no` (`M-00001`, from a sequence, unique, the number the buyer is given), `buyer_name`, `buyer_email`,
`buyer_phone`, `ship_country` (ISO two letters), `ship_address`, `region` (`thailand` | `overseas`),
`currency` (ISO three letters, `THB` default), `exchange_rate` (baht per one unit of `currency`, required unless
`THB`), `subtotal_thb`, `postage_thb`, `total_thb`, **`total_charged`** (the amount in `currency`),
`payment_method` (`promptpay` | `wise_transfer` | `wise_link`; a Thailand order can only be `promptpay`),
`payment_state` (`awaiting` | `paid` | `cancelled`), `paid_at`, `paid_by` (both required when `paid`),
`payment_reference` (the bank or Wise reference staff matched), `buyer_note`, `staff_note`.

**Returns are exchange only**, so there is no refunded state and no refund amount. An exchange is a new order
with a note, handled by the staff off the shop.

### `merch_order_parts`: one order is split by source

**This is the answer to "some stock is at the shelter, so one order can be split".** When an order is placed,
its lines are grouped into parts: **one part per supplier, plus one part for the shelter's own shelf.** Each part
has its own life.

`order_id`, `fulfilment` (`supplier` | `shelter`), `supplier_id` (**set if and only if** `fulfilment = 'supplier'`, enforced),
`status` (`new` → `sent_to_supplier` → `shipped` → `delivered`, or `cancelled`; a shelter part skips
`sent_to_supplier`, enforced), `supplier_email_id` and `sent_to_supplier_at` (the mark that stops a repeat),
`carrier`, `tracking_number`, `shipped_at`, `delivered_at`, `note`.

### `merch_order_items`: the lines

`part_id`, `variant_id` (kept for stock; becomes null if the variant is deleted), and **copies taken at the time
of sale**: `product_name`, `size`, `colour`, `unit_price_thb`, plus `quantity` (`> 0`). Later catalogue edits never
rewrite a past order.

### `merch_supplier_emails`: the log of what was sent

One row per email **actually sent**: `supplier_id`, `sent_to` (the address used), `part_count`, `body` (the exact
text), `sent_at`.

### `suppliers.delivery_method` (the existing table, one new column)

`text not null default 'daily_email'`, checked against a list (`suppliers_delivery_method_known`) that today holds
only `daily_email`. It is **a value with room to grow, not a boolean**. A later method (a file, a link, a supplier's
own system) is added by a migration that widens that check and by a new sender, **with no change to any shop
table.** **Do not create a second suppliers table.**

### What anon reads

- **`public_merch_products`**: `id, name, description, price_thb, postage_thailand_thb, postage_overseas_thb,
  photo_drive_file_id, sort_order, translations`, for `shown and archived_at is null`.
- **`public_merch_variants`**: `id, product_id, size, colour, sort_order, available`, for a shown variant of a shown
  product. **`available` = the product has a supplier, or the shelter holds at least one.** The stock number and the
  supplier are never exposed.
- `is_public_drive_file()` was restated with one more branch so the photo proxy serves a shown product's photo.

## Checkout (for `shop-public`)

No base table is open to anon, so **the server writes the order** with the service role, in one transaction. This
is a service-role call site: **record it in `docs/hard-coded-security-registry.json` the way existing ones are, or
the `hard-coded-security` job fails.** Steps, all inside the transaction:

1. Re-read each requested variant through the real tables (never trust prices from the browser).
2. Per line, decide the source: **shelter if `shelter_stock >= quantity`, else the product's supplier**; if there
   is neither stock nor a supplier, refuse the line (it was shown `available = false`).
3. Decrement `shelter_stock` for shelter lines (the `>= 0` check refuses an oversell under a race).
4. Create the order, one part per supplier and one `shelter` part if any, and the items with their copies.
5. Compute `postage_thb` as the sum over lines of `quantity × the product's postage for the order's region`.
6. For an overseas buyer, quote **`total_charged` in the buyer's currency** using an `exchange_rate` set from the
   staff-maintained rate (no paid rate service: the rule is zero ongoing cost; the rate and its date are shown to
   the buyer). If staff must confirm the rate, the order waits as `awaiting` until they reply.

The order status page reads by an unguessable id in the URL, shows status and tracking only, and exposes no
address or name beyond what the buyer typed.

## Manual payment

There is no processor. The state machine is `awaiting` → `paid` (or `cancelled`).

**A Thai buyer (`region = thailand`, `payment_method = promptpay`):**
1. Checkout shows the order number, the baht total and the shelter's PromptPay details (the shelter's static
   PromptPay QR, as on the donate page: `public_donation_channels`).
2. The buyer pays and keeps the slip. The order stays `awaiting`.
3. Staff match the payment to the order number or amount in the bank statement, open the order and press
   **Mark paid**, entering the bank reference. That sets `payment_state = 'paid'`, `paid_at`, `paid_by`.

**An overseas buyer (`region = overseas`, `payment_method` `wise_transfer` or `wise_link`):**
1. Checkout shows the order number and `total_charged` **in the buyer's own currency**, with either the shelter's
   Wise account details (transfer) or a Wise payment link the staff create and paste into the order (link).
2. The buyer pays. The order stays `awaiting`.
3. Staff see the money in Wise, match it, and press **Mark paid** with the Wise reference. Same fields set.

An unpaid order older than a period the staff choose can be marked `cancelled`, which returns shelter stock. **Only
paid orders reach a supplier.**

## The daily supplier email

**Today the only delivery method is `daily_email`.** One email a day **per supplier** lists every order part not yet
sent to that supplier.

**Which parts.** `merch_order_parts` with `fulfilment = 'supplier'`, `supplier_id` = that supplier,
`status = 'new'`, `sent_to_supplier_at is null`, **and its order's `payment_state = 'paid'`**, oldest first. (This is
what `merch_order_parts_unsent_idx` serves.)

**What one email contains.** Addressed to `suppliers.email`; subject "Orders for <date>"; a table with one row per
item: the shelter's order number, quantity, product name, size, colour, and the delivery name, address and country
(the supplier ships direct to the buyer); a line saying how many parts and items there are. No prices to the
buyer, no payment details, no buyer email or phone unless a later supplier needs one.

**How a part is marked sent, so nothing repeats and nothing is missed.** In **one transaction**: insert the
`merch_supplier_emails` row (with the exact body), update every listed part to `status = 'sent_to_supplier'`,
`sent_to_supplier_at = now()`, `supplier_email_id = <that row>`; **only after the email provider accepts the
message** does the transaction commit. If sending fails, nothing is marked, so the next run lists the same parts
again (**nothing missed**). Because the list requires `sent_to_supplier_at is null`, a part already marked can
never be listed again (**nothing repeats**). A supplier with no unsent parts gets no email. A supplier with no
`email` is reported on the staff screen, not skipped silently.

**Who runs it.** A scheduled job on the existing routine mechanism, once a day. It writes with the service role
(record it in the registry). The staff screen also shows "not yet sent" parts and the log from
`merch_supplier_emails`, and can re-send nothing by itself: a lost email is handled by the staff reading the log.

## What `shop-staff` builds (`/management/merch-shop`, card `run_merch_shop`)

Catalogue (products, variants, stock counts, both postage prices, photos, show/hide, archive); orders list (by state,
search by number or name); the order page (items by part, **Mark paid**, per-part status and tracking, notes,
cancel); the supplier screen's delivery-method control (an existing supplier screen, `Management → Suppliers`, gains
one field); the "not yet sent" list and the sent-email log. **Delete the `run_merch_shop` record in
`docs/cards-without-topic.json` and write the manual topic in the same PR.** **Add audit triggers** (the
`record_audit()` pattern and the labels `check-audited-tables.mjs` wants) to `merch_orders`, `merch_order_parts` and
`merch_products`: this PR stamps `paid_by`/`paid_at`, but a full change log was left to the PR that adds the
screens and the labels they need (see the decision file).

## What this PR deliberately did not do

No screen, no page, no dictionary beyond the card's label and description and one nav label, no payment
integration, no enquiry owner, no supplier email sender, no change to `/shop` or `shop_links`. No rows are inserted:
the catalogue starts empty.
