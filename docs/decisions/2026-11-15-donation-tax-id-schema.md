# 2026-11-15 — Donor tax ID for e-Donation: the schema half (#99zuk)

Migration `0381_donation_tax_ids.sql`. Applied to dev only. **Nothing in `src/` reads it yet; the app half follows.**
Does not tick `#99zuk`. Answers already given (2026-11-13, `2026-11-13-answers-receipts-shop-payments.md`): public charitable
organisation, the app prepares the list, IDs kept 7 years. **Caveats for the app half:** those answers are Lutan's account of the
Director's, not hers in writing; and what the accountant needs from shop income was never captured (separate question).

## The four design questions

**(a) Keyed on the GIFT, not the donor.** `donations.contact_id` is nullable (an anonymous or walk-in gift has no contact), e-Donation
wants the ID per gift, and a donor may give as a company one time and personally another. One row per gift makes each record
self-contained, gives each gift its own retention clock, and lets one gift be erased without touching another. Cost: the ID is typed
again per gift; the app half may pre-fill from the same contact's earlier row.

**(b) 7 years from the END OF THE CALENDAR YEAR OF THE GIFT** (31 December of gift year + 7): it is the tax year the deduction belongs
to, so every gift of one year expires together. The clock is `retain_until`, a stored generated column of `gift_received_on`. That
date is copied from `donations.received_on` by a trigger at insert and **locked** afterwards, so neither editing the gift nor
recording it in e-Donation can move it (the `handled_at` trap of `2026-11-14-report-photo-retention.md`). Proved: editing the gift's
date left `retain_until` unchanged. A clean-up job deletes rows where `retain_until < current_date` (not built; app half or later).

**(c) Gated by the existing `donation.receipt`, no read level added.** One policy `for all`, using and with check
`has_permission('donation.receipt')`. The four yes/no money activities are untouched.

**(d) Split.** Database: `tax_id` is exactly 13 digits; for `holder_kind = 'person'` the Thai mod-11 check digit too
(`thai_national_id_ok()`); `'juristic'` gets only length and digits, because a company's number does not follow that checksum. App
form: validate the same on the client for a friendly message, ask whether the donor is a person or a company, and tell the user to
re-check on a database refusal rather than offering to override.

## Recorded in e-Donation

Two nullable columns on the same table, not a new table: `recorded_on date`, `recorded_by uuid`. A row exists only for gifts wanting a
deduction, so the table is already the to-do list. **"Still to record" = `select … from donation_tax_ids where recorded_on is null`,
joined to `donations` for name, amount (`donation_lines`) and date.** An index on unrecorded rows exists. **No view**, so no tenancy
question arises.

## Specification for the app half

| column | type | null | meaning |
|---|---|---|---|
| `donation_id` | uuid PK, FK donations, cascade | no | the gift |
| `tax_id` | text, `^[0-9]{13}$` | no | store digits only, no dashes |
| `holder_kind` | text `person`/`juristic`, default `person` | no | picks the checksum rule |
| `gift_received_on` | date | no | set by trigger; do not send it |
| `retain_until` | date, generated | no | read-only |
| `recorded_on` / `recorded_by` | date / uuid | yes | the e-Donation tick; set both |
| `created_at` / `created_by` | timestamptz / uuid | no / yes | defaults |

- Every read and write asks **`can(perms, "donation.receipt", …)`** (yes/no), matching the policy. Gate the tick box, the field, the
  "Record in e-Donation" button and the list on it.
- Insert/update via the user's client; RLS enforces. `donation_id`, `gift_received_on`, `created_at` cannot be updated.
- **Masked display: `•••••••••` + last four digits** (e.g. `•••••••••0708`). Show it unmasked only on the entry form and the list
  the accountant works from. Never put it in `content` jsonb of a receipt, a log, or an error message.
- **Not audited with `record_audit()` on purpose** (it would copy the ID into the audit log). Do not add it.

## Found, not fixed

Retention clean-up job does not exist. Receipt content/issuer stay as is.
