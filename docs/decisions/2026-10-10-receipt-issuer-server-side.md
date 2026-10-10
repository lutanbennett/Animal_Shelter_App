# The receipt issuer is built by the database, not passed in by the caller

2026-10-10, `claude/receipt-issuer-server-side`, migration `0176`.

## What was wrong

`issue_donation_receipt()` (0168) is `security definer` and stored whatever `p_issuer` it was handed. The app
always passed `receiptIssuer(country)`, so every receipt anyone could see looked right. But anyone holding
`donation.receipt` (Admin, Management) could call `/rest/v1/rpc/issue_donation_receipt` directly with any
name and address and get a correctly numbered LCA receipt in that organisation's name, stored in the
register as if it were real. That undid the hard-coding in `src/lib/donations/issuer.ts`, which exists
because Lutan ruled on 2026-10-09 that a receipt must not read a field anyone can edit. An RPC parameter is
a field anyone with the permission can edit. Found by the multi-tenancy spike
(`2026-10-09-multi-tenancy-spike.md`, *What fought back* §6).

Measured before the fix: `check-donation-receipts-schema.mjs`, issuing as a real Management login with a
forged issuer, stored `"name": "Forged Org Ltd"` on both a TH and a US receipt.

## A SQL function, not a `receipt_issuers` table

`receipt_issuer(country)` returns the same JSON as `receiptIssuer()` and the RPC stores that. A table would
be another place someone could edit, which is the problem this fix exists to remove. A function changes
only through a migration, and that migration is the review step, the same way a deploy is for `issuer.ts`.

The cost is two copies, one in TypeScript and one in SQL. To stop them drifting apart, the receipts
harness imports `issuer.ts` and fails if `receipt_issuer('TH')` or `('US')` differs from it. Change both
copies in the same PR. The SQL copy is the one that reaches the receipt. The TypeScript copy is still
what the app sends, and the next migration can drop it (below).

At multi-tenancy the function becomes a per-shelter lookup with its own protections: its own field,
Admin only, the screen warning that it appears on receipts, and an audit row. The rule that the RPC never
takes the issuer from the caller stays. This was the same work either way, done once.

## Keep the parameter and ignore it, rather than dropping it

Dropping `p_issuer` changes the function signature. An app deployed before the migration would then call a
function that no longer exists, and one deployed after the migration but against the old signature would
fail in the same way. Receipt issuing would break for whichever window the release order opens. Keeping
the argument and discarding it means the deploy order does not matter. The parameter carries a comment in
the SQL and the app call carries one in `actions.ts`: it is accepted for compatibility and must never be
read again.

Removing it later is a small follow-up migration plus the app change, in either order once no deployed app
passes it. That is not tracked as its own item, because leaving it in place costs nothing.

## The same hole, still open, for what the receipt says

`p_content` (donor name, lines, total) is also stored as given, so the API can issue a receipt for an
amount nobody gave. That was out of scope here (this branch held the issuer item and one migration slot)
and went on the backlog branch as its own item, with the same fix shape.
