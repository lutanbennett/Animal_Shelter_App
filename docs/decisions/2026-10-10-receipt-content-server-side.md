# A receipt's content is built by the database from its donation, not passed in by the caller

2026-10-10, `claude/receipt-content-server-side`, migration `0177`. The twin of
`2026-10-10-receipt-issuer-server-side.md` (`0176`), and it copies that fix's shape on purpose.

## What was wrong

After `0176`, `issue_donation_receipt()` built the issuer itself but still stored whatever `p_content`
(donor name, lines, total) it was handed. The app always passed `receiptContentFor(donation.donor_name,
lines)`, so every receipt issued from a screen matched its donation. But anyone holding `donation.receipt`
(Admin, Management) could call `/rest/v1/rpc/issue_donation_receipt` directly and get a correctly numbered
receipt for an amount nobody gave, stored in the register as though printed from the donation.

Measured before the fix: `check-donation-receipts-schema.mjs`, issuing as the real dev Management login
with forged content, stored `"donorName": "Forged donor"` and `"total": 1000000` against a 1,200.50-baht
gift. The run had 22 failures, and all of them were new lines.

## A helper function beside `receipt_issuer()`, not inline SQL

`0176` made `receipt_issuer(country)`, so `0177` makes `receipt_content(donation)` next to it, and the
RPC is left as a short list of checks followed by "take a number, store what the two helpers return".
There were three reasons for a helper rather than inline SQL.

- **The harness can test it without issuing.** It calls `receipt_content()` on every real donation on dev,
  and also on donations that already have a live receipt, which the RPC would refuse. Inline SQL could
  only be checked through a receipt, and a receipt takes a number.
- **The pair reads the same way.** Each helper is the SQL copy of one TypeScript function, has a comment
  naming that function, and is checked against it by the same harness.
- **It is `security invoker`.** Called through the API it reads only what the caller's RLS shows: the 2IC
  gets `null`, and anon is refused. Called from the `security definer` RPC, it reads as the definer, which
  is what the RPC's own existence check already did. So granting it to `authenticated` shows nobody
  anything they could not already read.

## Matching `receiptContentFor()` exactly

This is a tax document, so a mismatch would be worse than the hole. It would silently change every
future receipt, where the hole only allowed forged ones. The rules, and how each one is kept:

| Part | `receiptContentFor()` | `receipt_content()` |
|---|---|---|
| donor | `donation.donor_name` | `donations.donor_name`. Never the linked contact's name (0168: a contact can be renamed) |
| order | lines sorted by `position` in `actions.ts` | `jsonb_agg(… order by position)` |
| amount | `Number(amount)`, `null` for in kind | `trim_scale(amount)`, so `1200.50` is stored as `1200.5`, as JS has it |
| total | `receiptTotal()`, summed in satang | `trim_scale(coalesce(sum(amount), 0))`, an exact numeric sum |
| no lines | `lines: []`, `total: 0` | `coalesce(…, '[]')`, `0` |
| currency | `"THB"` | `'THB'` |

`trim_scale` is the one rule you could not get from reading the TypeScript. Without it the printed receipt
would read the same, but the stored JSON would say `1200.50` where every earlier receipt says `1200.5`.
The harness compares as text so that this cannot pass silently.

**Evidence that they agree.** It was measured on dev, not reasoned:

1. **Every receipt on dev**, all four of them (`LCA0009000`–`0003`, one voided), was stored before `0177`
   with the content its caller built. Each one is **byte-identical as text** to what `receipt_content()`
   builds for its donation now. They cover a Thai company name, two lines with satang, an in-kind gift
   and a single 100-baht line. Which of them were issued from the Donations screen, and which by a test
   calling the RPC, is not recorded. That is why item 2 below does not rely on them: it calls the app's
   function itself.
2. **The harness builds the expected value with `receiptContentFor()` itself.** It imports
   `donations.ts`, the real function rather than a copy. It compares that value with both
   `receipt_content()` and the stored receipt for seven probe donations: lines entered out of position
   order, `0.10 + 0.20`, the largest amount a line takes plus a satang, all in kind, a Thai donor name, a
   linked contact with a different name, and quotes and a backslash. It does the same for every real
   donation on dev.
3. **A deliberate break is caught.** With `receiptTotal()` temporarily summing floats, the harness went
   red on 4 lines (`total 0.30000000000000004`, `1250.1499999999999`), and green again once the change
   was reverted.

Change both copies in the same PR. The harness is what tells you they differ.

## Keep `p_content` and ignore it, as `0176` did with `p_issuer`

The reason is the same. Dropping the parameter changes the signature, and receipt issuing would break
for whichever window the release order opens. The parameter is accepted and discarded, with a comment
on it in the SQL and on the app's call in `actions.ts`. **Never read it again.** A later small migration
can drop both ignored arguments together once no deployed app sends them.

## What the caller still chooses

After `0176` and `0177` the caller still chooses the donation, the country (TH or US, checked) and **the
receipt date**. `p_issued_on` is stored as given, so the API can backdate a receipt into another tax
year. That is the same shape again, but it needs a decision first: does the Director ever issue a
receipt dated before today, for a gift recorded late? So it went on the backlog branch as its own item,
and was not folded into this slot.
