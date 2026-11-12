# The manual PromptPay path was already built; what was missing was working down a statement

**2026-11-12** · stream `claude/donate-promptpay-qr` · backlog item `#kxksr` (Fundraising)

## What the item said was left

`#kxksr` is the automatic, self-recording QR. Lutan decided on **2026-11-10**, asked directly with all
three options and their costs in front of him, to take **option (3): no integration for now** — a plain
PromptPay QR and matching the bank statement by hand. He was shown the fragility in the same sentence
(a static QR carries no reference, so two people giving 500 baht the same morning cannot be told apart)
and chose it anyway. The item then said what remained was *"a static PromptPay QR on `/donate` and a way
for staff to record what arrived against the bank statement"*.

This stream's first job was to test that sentence rather than build from it. Five items offered as
workstreams on 2026-10-21 had all already shipped, because their prose was trusted over the commits.

## What was looked at, and what was found

**Both halves were already built, by two other pieces of work, which is why nobody noticed.**

| Claim | How it was checked | Result |
|---|---|---|
| A static PromptPay QR on `/donate` | read `src/app/donate/DonateWays.tsx`; opened `/donate` in a browser by clicking through from the home page | **Shipped 2026-10-13** with `donation_channels` (`0191`). `DetailsWay` offers `bank_name`, `account_name`, `account_number` and `promptpay_id` (the last two with a copy button) and renders `qr_drive_file_id` as an image through `driveImageUrl()`. `/admin/website`'s `DonationChannels.tsx` manages the rows |
| A way for staff to record what arrived | signed in with a login holding **exactly** the `donations_receipts` card and recorded a gift end to end | **Shipped 2026-10-09** with the `donations` table (`0168`). Management → Donations lists a window with its baht total and each gift's receipt state; the form records donor, date, method, designation, note and receipt lines, issues the receipt with the next LCA number and files it on Drive. **PromptPay is already one of the methods** |

**So the answer to "is there any part of either that a person cannot do today?" is: no — except
reconciling.** Recording a gift one at a time is not the same as working down a bank statement, and the
item's own words are *"importing the bank statement and matching by amount and time"*.

Two things made statement work unsafe, and both are exactly the fragility Lutan accepted:

1. **Nothing showed what was already on record for the date being entered.** A static PromptPay transfer
   carries no reference, so a gift entered twice could not be spotted from the gift itself. The list has a
   date window that would answer it, but leaving the half-filled form to look loses the typing.
2. **After saving you were taken to the receipt.** Measured: the save takes about 25 seconds (it issues
   the receipt and files it on Drive), and the only way back to a fresh form was the gift's page → the
   list → *Record a donation*, re-picking the date each time.

## What was built, and what was deliberately not

**Built** — the smallest honest thing, both on the screen that already exists:

- The donation form asks what is already recorded for the chosen date and shows it beside the date
  (donor, method, amount), re-asking whenever the date changes. A failed ask says so rather than showing
  an empty list: *"nothing recorded that day"* is the one answer that would invite the duplicate the
  panel exists to prevent.
- A gift's page offers **Record another gift**, which opens an empty form with that gift's date and
  method already set — the next line on the same statement.

**Not built, deliberately:**

- **Any part of the automatic path** — webhook, signature check, idempotency, countdown page, a payment
  provider. Decided against for now; the item says they are superseded, and this stream did not re-open it.
- **A bank-statement file import.** Out of scope: a new surface people submit data through, in a format
  nobody has specified, and the item does not ask for it. **Reported rather than built** — if hand
  matching grows into a real chore, the import and option (1) are the two answers, and the trigger below
  is when to weigh them.
- **`#ss2s0`'s remaining work** (online card payment, step (d), *"only if the shelter asks for it"*) and
  anything in `#cjxq0`, the merch shop, which still waits on the Director and was explicitly decoupled
  from this item on 2026-11-10.
- **Any ID-number or card-detail field.** Forbidden outright: no card or bank detail ever touches the app
  or the Pi, and a Thai tax receipt's ID number is sensitive personal data under the PDPA, to be collected
  only when a donor asks for a receipt and stored apart (`#99zuk`, which is with the Director).

## The card

Everything added asks **`donation.receipt`** — the activity `recordDonation()` itself asks, read from the
action rather than guessed from a label — so the panel shows nothing a login could not already see on the
list, and a control is drawn only where it can act. The card that carries that activity is
`donations_receipts`. Admin is unaffected: it sits outside the card system, through the `perms.isAdmin`
short-circuit in `src/lib/permissions/can.ts`. No new card was needed, and no role is named anywhere in
the change.

## What is still open, and it is not code

**On the dev database `/donate` lists only DonorBox.** There is no `donation_channels` row carrying the
bank details or the PromptPay id and QR, so the page's own prose still reads `(bank name)` and
`(PromptPay id)`. The code renders them; the rows do not exist.

**Whether production has such a row is NOT ESTABLISHED.** Production's public site is locked
(`src/lib/public-site.ts`): `/donate`, `/adopt` and `/volunteer` all redirect to `/login` there, so it
cannot be read from outside, and an ad-hoc production read is not this stream's to make. **Read it in
Settings → Website → Ways to give.** If it is empty, the remaining work on `#kxksr` is the shelter
entering its own PromptPay id and uploading its QR image — a Settings job, not a build. The item has been
retitled to say exactly that, and left open.

## The trigger for revisiting the automatic path

Quoted from the item, so it lives somewhere a future session will read it:

> **THE TRIGGER FOR REVISITING, so nobody has to guess when "for now" ends:** the hand-matching is the
> cost, and it grows with the number of gifts. When matching the statement becomes a real chore, or when a
> donation genuinely cannot be told from another, that is the moment to put option (1) to him again — with
> the fee per donation and the number of gifts a month, not as an open question.

Nothing here is blocked on Lutan or on the Director, and this item must stop being listed as one of hers.

## One thing worth not re-deriving

The panel first shipped broken in development and sat on *"Checking…"* for ever. React runs an effect
twice on mount in development; the first run asked, its cleanup cleared the `live` flag, and the second
run returned early because that date had already been asked for — so the cleanup of the run that started
the only request in flight threw its answer away. The date ref alone is the right guard: apply a reply
unless the person has since moved to another date. It was found by driving the page, not by reading it,
and nothing in typecheck, lint or the tests would have caught it.
