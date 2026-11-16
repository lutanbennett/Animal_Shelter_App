# e-Donation submission format: researched 2026-11-16, NOT established (#k2vd9)

## What the app says today
- `src/app/management/donations/e-donation/export/route.ts` serves `e-donation-to-record.csv`
  (columns: Gift date, Donor, Tax ID, Kind, Amount (THB)). Its comment says it is NOT the Revenue
  Department's import format. The reminder string `donations.taxId.reminder` (en.ts) carries no link.
- Untouched by this change: no label removed, no button, no URL added.

## What was searched (2026-11-16, public pages only, nothing signed up for or entered)
- English: Forvis Mazars, Bangkok Post, Sherrings and similar summaries. All describe the duty to
  record donations, none gives a file layout. They are second-hand, not the specification.
- Thai: the Revenue Department's e-Donation manual v2 for recipients (a copy hosted by Chulalongkorn
  University, `web-cdn.chula.ac.th/web-dev/2026/04/ManualeDonationV2.pdf`), an rd.go.th regional
  leaflet (2018), and the recipient manual V1.1 on epayapp.rd.go.th.

## What is established (with the limits)
- An Excel upload exists. It is built from a **template downloaded from inside the e-Donation
  system** (logged-in recipients only), and the manual has a section on preparing the upload file.
- Per a search-tool summary of the manual (NOT read by us): donor type is a one-digit code
  (1 individual, 2 juristic person) and the donor tax ID is 13 digits.
- That is a Thai-language document and nobody here reads Thai with authority, so even those two
  facts are unverified. The summary is not a specification.

## What is NOT established
- The column list, order, types, header wording and file type of the template. The template is behind a
  login, and no public copy was found. Any shape we wrote now would be a guess.

## Outcome
Neither of the item's two "done" branches is met. #k2vd9 stays open. The CSV and its label stay as shipped.
Next step: the accountant is asked what she uploads today (question in the PR body), and a Thai
speaker reads manual v2's "how to prepare the upload file" section, ideally with the real template to hand.
