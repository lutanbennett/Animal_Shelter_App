# The Donors list, and how a gift names who gave (app half of 0244)

Builds on `2026-10-21-supporters-table.md`. Lutan: "keep a separate list", "not in contacts".

**Label: "Donors", not "Supporters".** The table stays `supporters`, but on screen it is **Donors**
(Thai ผู้บริจาค). "Supporters" already means the public well-wishers in the Shelter Friends copy, and the
Contacts descriptions claimed to hold "supporters". Those two Contacts descriptions (tile and nav blurb, both
languages) now say contacts, clinics and doctors only. Shelter Friends is untouched.

**Where.** `/management/donations/donors` (list, `new`, `[id]`), beside the donations it belongs to, with a
Donors button on the donations page. Guarded by `donation.receipt` in the page (`requirePermission`), in every
action, and by `supporters_perm` RLS.

**Who a gift names (the decision the brief asked for).**
- `donations.donor_name` stays required and is **the name as given on that gift**. Picking a donor copies their
  name, email, phone and LINE into the form, where they can still be corrected for this one gift. Later renaming a
  donor does not rewrite old gifts or receipts.
- **A gift has a `contact_id` or a `supporter_id`, never both.** `checkDonation` refuses both (`donorBoth`), and the
  form clears the other when one is picked. Free text with neither is still allowed.
- **The receipt prints `donor_name`**, exactly as before (`receiptContentFor`). The donations list shows `donor_name`.
  The donor link only adds the history; it never changes what a receipt says.
- Archiving is soft: the donor leaves the list and the form's picker, but `supporter_id` stays on their gifts and
  the history page still shows them.

**Not done, on purpose.** No back-fill of old free-text donors (duplicates, nobody asked); no e-Donation or Thai
tax fields; no card payments. Finding for the QR-donations paper: a QR gift has no donor name until someone
records it, so recording it against a Donor is the natural place for a repeat giver to be recognised.
