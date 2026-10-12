# 2026-10-12 — Bills inbox: matching rules, likely matches, Drive folder

`bills-inbox`, the screens half of the bills feature (schema: `bills-schema` #566, `0190` #569, `0191` #574).
"Bills" on screen, never "receipts" (donation receipts, `0168`, are the shelter's own to donors).

## Matching

- A card is `bills_inbox` plus its photos (`attachments` owned by `('bill_inbox', card)`). Matching writes the typed
  cost into the target's own `cost` column (`stock_receipts.cost`, `clinic_visits.cost`; no second amount column),
  moves the photos to the target, then deletes the card. The cost goes first, so a failure after it leaves the card to
  retry. The waiting count is `count(*)` on `bills_inbox`.
- A blank cost on the card leaves the target's cost as it was.
- "Record a new delivery from this bill" opens Record a delivery with `?fromBill=<card>&cost=<typed>`; saving files the
  card's photos on the new delivery through `attachCardToDelivery`. One card, one delivery: a bill covering several
  lines waits for the pack-sizes item (a delivery with several lines).
- `0191` was needed: `stock_receipts` had no update policy since `0143`, so a cost could not be written onto an
  existing delivery. Found by `scripts/check-bills-roles.mjs`.

## Likely matches

One query for deliveries and one for clinic visits, each with no cost yet, in the last 14 days, then one query for
which of them already hold a bill photo; those are dropped. The page sorts them per card by distance in days from the
day the photo was added and shows the nearest four. A role that records deliveries but not visits is shown only
deliveries, because the visits query is not run (and the database would return none).

## Drive

`Bills/<year>/<month>/` under the Drive root, by the day the photo is uploaded (`ensureBillsFolder`). Bill photos are
never public: the public photo proxy and `is_public_drive_file` only know resident and project photos. Deleting a card
removes the photo rows but leaves the files in Drive, as other deletions here do.

## Where it shows

The Home tile (the 2IC's jobs list and derived homes) with a waiting count. Management's curated day (the whiteboard's four tiles, held by check-home-screens.mjs) has none: the Director reaches Bills from Deliveries, and a tile there is Lutan's call (backlog); a Bills link on
Deliveries. `/bills` is not in the route registry because that ties a page to one activity and Bills opens for any of
three; it is pinned in `check-permission-catalogue.mjs` with its own guard (`canUseBills`).

## Not now

Reading the amount off the photo (OCR). The clinic-visit finishing flow has no separate page; the Edit page carries the
bill section. A visiting doctor files no bill: `record_attachment()` fences them out.
