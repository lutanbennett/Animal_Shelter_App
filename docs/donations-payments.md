# Donations that record themselves: options paper

Written 2026-10-21 for Lutan and the Director. Backlog item: *A unique QR code per donation that records itself*.
**This paper recommends; it does not choose.** Nothing is signed up for, and no decision is recorded in
`docs/decisions/` until you both choose. All prices below were read on 2026-10-21 from the pages linked; prices
change, so each one needs a recheck on the day you apply.

## The one-page summary

**What we want:** a donor enters an amount, sees a QR made just for that gift, pays in their banking app, and the
app turns to "Thank you, received" and records the gift on its own, with no one typing it in.

**Why a plain PromptPay QR cannot do it:** a QR to a phone number or tax ID has no reference number and tells
nobody the money arrived. A person must match the bank statement to the donor afterwards.

| | 1. Payment gateway (Opn Payments, formerly Omise) | 2. The shelter's own bank (e.g. Bangkok Bank QR API, KBank QR) | 3. No integration (today's static QR + statement) |
|---|---|---|---|
| Fee per donation | **1.65% + 7% VAT on that fee** for PromptPay (1,000 baht gift costs about 17.65 baht). Cards 3.65%. | Not published. Bangkok Bank's shop-counter QR is listed at 0.35% or 5 baht (legal entity); the API fee is "subject to terms" | **Nothing** |
| Monthly or setup fee | None shown on the pricing page (not confirmed in writing) | Unknown until the bank quotes | None |
| Breaks "zero ongoing cost"? | No: a percentage of money that arrives, not a subscription. Confirm no monthly minimum. | Possibly: ask the bank for any monthly fee | No |
| Foundation must provide | Company-style papers: registration certificate, signatory IDs, a bank book in the foundation's name, signed and stamped copies. Foundation list **not confirmed** (see below) | A corporate (juristic-person) account, signed service agreement, and technical onboarding with the bank | Nothing new |
| Who signs | The foundation's authorised signatories, on paper, no e-signatures | Same, plus the bank | Nobody |
| Money goes to | The foundation's own bank account (gateway pays out to it) | Straight into the foundation's own account | Straight into the account |
| Tells the app it was paid | Yes, a webhook (`charge.complete`) | Yes, to a URL we register; Bangkok Bank retries up to 3 times | No |
| Test mode before real money | Yes, a test dashboard where a charge is marked paid by hand | Sandbox exists but sits behind a bank login | n/a |
| Overseas donors | Yes: same account also takes cards (3.65%) | Thai QR only, no cards | Thai bank apps only |
| Realistic time to start | Probably days to weeks once papers are right | Probably weeks to months | Now |

**My recommendation, for you to overrule:** start with **option 1, Opn Payments**, because the foundation does
not need a special bank arrangement and it takes cards from overseas donors. Keep **option 3** running until
the first live QR pays out. Treat option 2 as the cheaper later move if donation volume grows, since 1.65% is
roughly 18 baht on every 1,000 baht. **Before anyone applies, answer the three questions at the end.**

## What is and is not settled

Settled by reading the pages: Opn's PromptPay and card fees; that PromptPay charges are **not refundable
through Opn**; the 24-hour QR life; the 20–150,000 baht limits per QR; that test mode exists; that Bangkok
Bank's API is corporate-only.

**Not settled, and I will not guess:**
- Opn's papers list for a *foundation* (their page covers limited companies, and points other entities to a
  separate list I could not open).
- GB Prime Pay: its address now redirects to Xendit's Thailand site, which refused my request. I could not read
  any GB Prime Pay or Xendit fee. Treat it as "ask them" until someone reads their current rate card.
- 2C2P: no published PromptPay rate; their fees are quoted per merchant.
- Any bank's real fee for the notification API, and KBank's own documents.
- Settlement time (how many days from the donor paying to money in the account) for Opn.

## Option 1: a payment gateway (Opn Payments)

**In practice:** the app asks Opn for a QR for 500 baht; Opn returns a QR with a reference; the donor pays in
any Thai banking app; Opn calls our webhook; the app reads back the charge from Opn and only then records the
amount **Opn confirms**, never the amount the page asked for.

- **Fees** ([Opn pricing, Thailand](https://www.omise.co/pricing/thailand), read 2026-10-21): PromptPay 1.65% per
  successful payment; cards 3.65%; "Transfers" from the Opn balance to the shelter's bank are 20 baht each (up to
  2 million). All "subject to 7% VAT". No setup or monthly fee appears on the page; **ask in writing**.
- **Sign-up:** accounts start in test mode; live mode needs documents submitted in the dashboard, with the bank
  account name matching the registered name, documents signed by the authorised directors and stamped as certified
  copies ([Opn help](https://docs.opn.ooo/how-do-i-enable-live-account), surfaced by search 2026-10-21; the
  foundation version of the list is the unknown above). PromptPay is switched on by emailing Opn's support
  ([PromptPay docs](https://docs.omise.co/promptpay)).
- **Limits and quirks** (same docs): a QR lives 24 hours by default; a charge must be 20–150,000 baht; **no
  refunds or voids** for PromptPay, so a wrong payment is refunded by bank transfer, by hand.
- **If the Pi is down:** the webhook must reach the Worker fallback; Opn lets you register the endpoint in its
  dashboard. The "retry" behaviour of Opn's webhooks was not established, so the build must also have the app
  *ask Opn* about open charges when it is next up. That check is the safety net and should be in the build.
- **Effort to build:** a new route under `src/app/api` verifying the provider's call and reading the charge back,
  an idempotent insert into the `donations` table (`0168`), Worker secrets for the keys. Small, but money code:
  a schema PR first, then test mode end to end before any real baht.

## Option 2: the shelter's own bank

**In practice:** the bank gives the foundation a biller ID and a way to make a QR with a reference; the bank posts
"paid" to a web address we register. No middleman fee, no middleman holding money.

- **Bangkok Bank's QR Payment API** ([page](https://apiportal.bangkokbank.com/en/api/qr-payment)): corporate
  users only; we must prepare and send a public certificate and exchange connection details; a service agreement
  is signed after tests; payment results go to our endpoint immediately and are re-sent up to 3 times; fees
  "subject to terms". Sandbox documentation needs a login.
- **KBank's QR Payment** ([a third-party guide](https://flowaccount.com/en/help-center/category/kbank/shop-quantification)):
  consent form, signatory ID and registration papers; starting limits of 20,000 baht per payment and
  300,000 baht a month. This is the *shop* QR, not proof that the notification API is open to a small foundation.
- **Honest read:** this is the best long-term shape and the slowest. It depends on which bank the foundation
  already uses, and a branch or business-banking officer must be asked directly. I could not find a published
  fee for any bank's notification API.

## Option 3: no integration (what exists now)

The `/donate` page already shows the PromptPay QR and bank details from `donation_channels` (`0191`). Staff
record gifts under Management → Donations (`0168`). Free, no paperwork, and fragile exactly as the backlog says:
two 500-baht gifts on the same morning cannot be told apart. It remains the fallback when 1 and 2 are not yet
open.

## Coupling to the merch shop

The backlog says to choose together with the merch shop's checkout, which is waiting on the Director. A gateway
that takes PromptPay *and* cards would serve donations and merch with one sign-up; a bank QR API serves
donations only and would leave merch needing a second provider. That tilts toward option 1 — but I have not
researched merch suppliers (the B2B item says not to), so the merch shop's needs are unknown to this paper.

## Tax receipts and e-Donation

- Individuals and companies who give to a foundation on the Revenue Department's list can deduct **twice** the gift
  (200%, capped at 10% of net income or profit), **but only if the gift goes through e-Donation**; a plain
  receipt gets the ordinary deduction only ([Forvis Mazars, 2026](https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/e-donation-system);
  [Deloitte, Dec 2022](https://www2.deloitte.com/content/dam/Deloitte/th/Documents/tax/th-tax-newsletter-Dec2022-en.pdf)).
  One report says donations to foundations from 1 January 2026 must go through e-Donation
  ([Orbitax](https://orbitax.com/news/country/article/Thai-Notice-on-Donation-Deduct-59715)); I could not read
  the notice itself. Nine more foundations were being added to the list in 2026.
- **Whether Lanna Care for Animals Foundation is registered for e-Donation is not in the repo. That is a question
  for Lutan (and the accountant), not something to assume either way.**
- I could not establish from official sources whether the donor's 13-digit ID is needed; assume it is.
- **PDPA recommendation (not a decision):** ask for the ID only when the donor asks for a tax receipt; keep it in
  its own restricted table, never in the donor list or on any public page; delete it once it has been sent to the
  Revenue Department and a tax-record period has passed. Suggested period: **keep until the end of the tax year
  after the gift, then delete**, because a donor's claim and any query on it normally arise within that window.
  The accountant should confirm this against the foundation's own record-keeping duty. A longer period means
  holding sensitive data longer than the receipt needs. This feeds the separate e-Donation item.

## Questions only you can answer, before anyone applies

1. **Is the foundation registered for e-Donation?** This also decides whether donors can get the double
   deduction, and may be a stronger reason to move than the fee.
2. **Which bank holds the foundation's account, and who are its authorised signatories?** Option 1 needs those
   signatories to sign and stamp papers; option 2 needs a business officer at that bank.
3. **Is a 1.65% fee (about 18 baht on 1,000) acceptable on QR donations, with cards at 3.65%?** If not, the
   path is option 2 and a longer wait.

## For the supporters-list stream (not its files; noted here)

The donors list will want a column for *how the gift arrived* (staff-entered, QR with confirmed reference) and the
provider's own reference on each row, so a payment can be matched twice-safe. Nothing in its design needs to wait
for the provider choice.
