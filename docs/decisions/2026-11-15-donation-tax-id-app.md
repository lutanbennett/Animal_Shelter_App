# Donation tax ID, the app half (#99zuk)

Stream `donation-tax-id-app`, 2026-11-15. Nothing here is a decision for Lutan.

**Step zero:** nothing in `src/` read `donation_tax_ids`, no decision or commit had built the app half; gap confirmed, carried on.

## Where things are
- Form tick, holder kind and ID field: `src/app/management/donations/new/DonationForm.tsx`; saved by `recordDonation` (`actions.ts`), which stores the ID right after the lines and **deletes the whole gift** if the ID is refused (same pattern as the lines).
- Accountant's list: `/management/donations/e-donation` (`src/app/management/donations/e-donation/`). Under Donations because the list is a view of gifts and shares their gate; the page links from the Donations header. "Still to record" is a query (`src/lib/donations/tax-id-list.ts`), no view.
- Validation, masking: `src/lib/donations/tax-id.ts`. Person gets the mod-11 check, company only the 13 digits; the database still enforces both.

## Deliverable answers
- **4, pre-fill from an earlier gift: not built.** It would put one donor's full ID on a form about a different gift, and contacts and supporters are not keyed to the ID table. Typing 13 digits per gift is the price of the gift-keyed design.
- **9, ID on the receipt: no.** The donor already holds their own ID; the receipt PDF stays untouched, and the ID is never in `content` jsonb. The gift's page shows the masked ID (nine bullets + last four) read at display time.
- **10, e-Donation import format: not established, deferred.** Nothing in the repo or reachable sources I could cite names an importable format. A plain CSV of the list is offered and labelled as not the Revenue Department's format.
- **11, retention clean-up: not built.** It needs a scheduled job or a migration slot; reported for the planner to file.
- **7, reminder link: written without a link.** No e-Donation URL exists anywhere in the repo, and a wrong link is worse than none.

## Controls and the activity each asks (all `donation.receipt`, yes/no)
Tick, holder-kind select and ID field (page + `recordDonation`); *Gifts to record in e-Donation* link (page); *Recorded in e-Donation* button (`markRecordedInEDonation`); *Download* link (export route checks it); the reminder and masked ID on the gift page (page + RLS).

## Found, not fixed
`donation_tax_ids` rows are not removed if a donation is hard-deleted other than via cascade (cascade covers it); no clean-up job for `retain_until`.
