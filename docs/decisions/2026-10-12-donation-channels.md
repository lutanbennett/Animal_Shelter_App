# Ways to give are rows, not text (donation channels)

2026-10-12. Backlog: *Donate page: a button for each way to give*. Migration `0191_donation_channels.sql`.

## The table

`donation_channels`: `way` (paypal, donorbox, wise, bank_transfer, promptpay, other), `label`, `url`, the
details fields (`bank_name`, `account_name`, `account_number`, `promptpay_id`, `qr_drive_file_id`), `note`,
`sort_order`, `shown`. Written with `website.content` Edit (the cell `impact_baselines` uses), read with
`website.content` Read. Anon has no grant on the table. Every change reaches `audit_log`.

## How a hidden row stays out of the public view

`public_donation_channels` is an owner-run view (the shape of `public_impact_figures`), so RLS does not apply to
it and the only thing between anon and a hidden row is the view's `where c.shown`. That is deliberate: the table
holds bank and PromptPay details, and the filter lives in the database, never in the app. The view names its
columns, so `created_by` / `updated_by` are not exposed. `check-public-views.mjs` lists the view (read allowed,
write refused) and, because it also demands that anon be refused everything unlisted, it fails if the *table*
ever becomes readable. `scripts/check-donation-channels-schema.mjs` proves it with a hidden row: absent from the
view, present once shown, absent again once hidden, and its QR file not served by the photo proxy
(`is_public_drive_file` gained one branch reading the view, so it follows `shown` too).

## Links and company domains

The database backs the app's validation with two checks. Every link must be `https://`. For PayPal, DonorBox and
Wise the host must be the company's own: only subdomain labels may sit between `https://` and
`paypal.com` / `paypal.me` / `donorbox.org` / `wise.com`, which must be followed by `/`, `?`, `#` or the end.
That rules out `paypal.com.evil.test`, `secure-paypal-donate.com`, `wise.com@evil.test` and
`evil.test/donorbox.org` (all asserted refused in the harness). A substring test would let those through.
`other`, bank and PromptPay rows may carry any https link or none.

## Thai

`label` and `note` are typed prose, so their Thai goes through the translations queue
(`translatable_fields` + the queue triggers), as site pages and map-room descriptions do. Bank names, account
numbers and the PromptPay ID are the same in both languages and are not translated.

## Not in this change

Knowing that a payment arrived, and recording it, are unchanged: staff still enter donations under
Management → Donations (`0168`).
