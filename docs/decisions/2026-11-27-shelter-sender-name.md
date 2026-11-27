# 2026-11-27 — Who mail says it is from (`#mlsnd`)

**Decided by Lutan, 2026-11-27:** *"yes lets go with option 3"* — the shelter's name as the sender NAME on one verified
address, `"<Shelter> (via CooperJaidee)"`.

## What was built

`src/lib/mail-sender.ts` `shelterSenderName(name, qualifier?)` composes the name; the shelter's name is read through
`shelterNames()` (its **display** name, e.g. "Lanna Care for Animals"), never written in code.

| Mail | Sender name now | Was |
|---|---|---|
| Supplier orders (`src/lib/merch/supplier-email.ts`) | `<display name> (via CooperJaidee)` | `<short name>` |
| Status alerts (`src/lib/status/alerts.ts`) | `<display name> status (via CooperJaidee)` | `<short name> status` |
| Release mail (`worker/release-mail.mjs`) | `CooperJaidee <environment>` unless `RELEASE_MAIL_SENDER_NAME` is set | `Lanna Care <environment>` |

## The open question this answers: mail that belongs to no shelter

Release mail and any platform-level mail go out as **CooperJaidee**, the product, with no "(via …)": nobody is being
carried, the product is the sender. `RELEASE_MAIL_SENDER_NAME` still overrides it per environment.

## What was NOT changed, and why

- **Auth mail (password reset, invite).** Supabase Auth sends it with one SMTP sender name per project, and one project
  serves every shelter, so it cannot vary by configuration. The **send-email hook** that would let it vary **is on the
  free tier** (Supabase's auth-hooks page lists Send Email as "Free, Pro", read 2026-11-27), so zero-cost does not
  block it; it was not built because it is a change to Auth configuration, which this stream was told not to touch.
  Next step: a stream that writes the hook (an Edge Function or Postgres function sending through the same SMTP), tested
  on dev first.
- **The reset mail's body names no shelter** (dev's recovery template, read 2026-11-27 via the Management API: "Reset
  your password … We received a request to reset your password …"), so when the envelope does change, the body will not
  contradict it.
- **The From ADDRESS.** It is still each environment's `STATUS_ALERT_FROM` / `RELEASE_MAIL_FROM` in `wrangler.jsonc`
  (lannacare domains). Moving it to `noreply@cooperjaidee.org` needs that domain set up for Cloudflare sending first; it
  is a `wrangler.jsonc` value change at a release, no code.
