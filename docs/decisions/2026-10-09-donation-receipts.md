# Donation receipts: numbering, voiding, what a receipt keeps, and the hard-coded issuer

2026-10-09. Backlog: *Donation receipts: a form for the Director to issue a receipt*. Schema in `0168`
(folded into the community-dogs schema PR by Lutan's choice, so only one branch carries a migration);
the form and PDF on `claude/donation-receipts`.

## The number never skips and never repeats

Receipts are numbered `LCA` + seven digits, first `LCA0009000` (Lutan, 2026-10-09), one series for both
the Thai and the US receipt. The next number is a row in `receipt_counters`, **not a Postgres sequence**:
a sequence hands out a value even when the transaction that took it rolls back, so a receipt that failed
to save would leave a hole in the register, and a register with holes is the first thing an accountant or
the Revenue Department asks about. `issue_donation_receipt()` takes the row for update, so two receipts
issued at once queue, and the increment and the insert commit or roll back together. `number` is unique.

## A receipt is never deleted or rewritten

A receipt is a document that has been sent. A mistake is corrected by **voiding** it (it keeps its number,
stays in the register marked void with who, when and a reason) and issuing a new one. The table has no
delete grant and a trigger refuses delete and any change to the number, the donation, the country, the
date, the issuer or the content, for every caller including the service role. A void cannot be undone.

## The receipt keeps what it said

`content` (donor name, lines, total) and `issuer` (the issuer block as printed) are stored on the receipt
row. Re-printing a receipt must give the page the donor received, so it must not re-read the donation
(which stays editable) or the issuer constant (which changes when the address does, and per shelter at
multi-tenancy).

## The issuer address is hard-coded, deliberately

The issuer block (Lanna Care for Animals Foundation, 291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao, Mae Wang
District, Chiang Mai 50360, Thailand) is a constant in code, read only through `receiptIssuer(country)`.
It does **not** read `site_content.contact_address`. Lutan, 2026-10-09: sharing the website's field means a
harmless public-copy edit silently changes every receipt issued afterwards, and no screen would report it.
Changing the address needs a developer and a deploy; for an address that changes about once a decade,
the deploy is the review step.

**Do not move it into Settings as a convenience, and never onto `site_content`.** It does move when
multi-tenancy makes the issuer per-shelter data, and then it keeps the protections: its own field, Admin
only, the screen saying it appears on receipts, and an `audit_log` row. Only `receiptIssuer()` changes;
the layout never reads the constant.

The constant is shaped per country: Thailand filled in, the US entry present and empty, so US tax status
later is a value, not a refactor. Neither has a tax number today. The US receipt does **not** carry the
usual "no goods or services were provided" line: the status does not exist yet, and a receipt claiming it
would be worse than one omitting it. The US date is month-first, the one place in this app where that is
correct.

## Who

A new activity, `donation.receipt` (yes/no), with no cells: Admin only until an Admin delegates it in the
Settings matrix, which needs no migration.
