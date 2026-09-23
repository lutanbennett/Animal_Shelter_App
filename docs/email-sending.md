# Sending email

The system sends two kinds of mail, through two free senders. Both are set up
by hand in a dashboard, and this is the runbook for doing it. Nothing here costs
money. If a screen asks you to upgrade a plan, stop, because that means the step has
changed since this was written (2026-09-23).

| Mail | Who gets it | Sender | Costs |
|---|---|---|---|
| Release notes, on a major release | the environment's admins | Cloudflare Email Service, from the Worker (`worker/release-mail.mjs`) | $0: a free account may mail its **verified** destination addresses |
| Password reset (Forgot password?) | anyone with a login | Supabase Auth, through **Resend** SMTP | $0: Resend's free tier, one domain |

Why two: Cloudflare's free route only reaches addresses you have verified, which
is fine for a handful of admins and useless for password resets to any user.
Mailing arbitrary addresses from Cloudflare needs Workers Paid ($5/month), and
the project's rule is that email costs nothing. `docs/decisions.md`, "Release
notes register", has the reasoning.

**Domains.** UAT sends from `lannacare.org`, now and for good. Production will
send from `lannacareforanimals.org` after the cutover. That domain repeats these
steps; it is not a redo of them (see the end of this page).

**What is already on `lannacare.org`** (checked 2026-09-23 over DNS-over-HTTPS):
MX → `route1/2/3.mx.cloudflare.net` (Email Routing's catch-all), one SPF TXT
`v=spf1 include:_spf.mx.cloudflare.net ~all`, a Google site-verification TXT,
and **no DMARC record**. Neither sender below touches the root MX or the root
SPF record: both put their MX and SPF on a subdomain of their own. Email
Routing's catch-all keeps working.

---

## 1. Release notes: Cloudflare Email Service

The Worker already has the binding (`wrangler.jsonc`, production environment:
`send_email` → `RELEASE_MAIL`, `RELEASE_MAIL_ENV = "UAT"`,
`RELEASE_MAIL_FROM = releases@lannacare.org`). There is no API key or secret.
What it needs is the recipients.

### 1a. Nothing to onboard: Email Routing is enough

**Do not use Compute → Email Service → Email Sending.** On the free plan
that screen offers only "Purchase Workers Paid" (seen 2026-09-23), because
*Email Sending* is the paid feature that mails arbitrary addresses.
Verified-address sends don't need it. Cloudflare's pricing page: "Sending
to verified destination addresses in your account is free on all plans,
including when only Email Routing is configured." Email Routing is already
on for `lannacare.org` (the catch-all), and the From address
(`releases@lannacare.org`) is on that domain. No DNS changes are needed.

### 1b. Verify each admin's address (once per person)

A free account may mail only addresses verified under Email Routing:

1. Cloudflare dashboard → `lannacare.org` → **Email** → **Email Routing** →
   **Destination addresses** → **Add destination address**.
2. Enter the admin's email. They get a message from Cloudflare and click the
   link in it. Until they do, they stay "Pending" and are skipped.

Your own Gmail is already verified, because the catch-all forwards to it. So
until you add anyone else, **the first real send reaches only you.** That is
the intended first test. Add other admins when you are happy with it.

### 1c. How a send happens, and how to test it

`node scripts/deploy.mjs --env production` does this by itself after the
deploy, and only when a **major** release is new to that site:

```
deploy: release 0.1.0 "…" (live now: 0.0.1)
…
deploy: release mail for 0.1.0 [UAT]: sent 1, skipped 1
  sent     you@gmail.com
  skipped  someone@example.org: E_RECIPIENT_NOT_ALLOWED
```

- `E_RECIPIENT_NOT_ALLOWED`: that admin hasn't verified (1b).
- `E_SENDER_DOMAIN_NOT_AVAILABLE` / `E_SENDER_NOT_VERIFIED`: Cloudflare
  wants the domain onboarded after all. Don't buy Workers Paid: raise it,
  and the fallback is to send through Resend's API (§2's account) instead.
- `[off]` with every address skipped: the environment doesn't send. That is
  **expected on `--env test`**, which runs on the dev database.
- `--no-mail` deploys without announcing.

A redeploy of the same version sends nothing: the script asks the live site
which release it runs (`/api/releases/current`) before deploying, and mails
only releases newer than that.

---

## 2. Password reset: Resend SMTP for Supabase Auth

This closes the Deployment item *"Configure SMTP in the production Supabase
project before go-live"*. Everything below is dashboard work. No code reads
these values.

### 2a. The account (yours)

1. Sign up at resend.com with your own address. The free tier needs no card.
2. **Domains** → **Add Domain** → `lannacare.org`, region of your choice.

### 2b. DNS in Cloudflare

Resend lists three or four records. As of this writing they are all on
subdomains:

| Type | Name | Value | Notes |
|---|---|---|---|
| MX | `send` | `feedback-smtp.<region>.amazonses.com`, priority 10 | Bounces. **On `send.lannacare.org`, not the root**, so Email Routing's MX is untouched |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for `send.` only. The root SPF record stays as it is |
| TXT | `resend._domainkey` | the DKIM key Resend shows | |
| TXT | `_dmarc` | *(optional in Resend)* | Optional. There is no DMARC record today, so adding Resend's is safe, but only ever one `_dmarc` record |

Copy the exact values from Resend's screen, not from this table. Add each
record in Cloudflare → `lannacare.org` → **DNS** → **Add record**, with the
proxy **off** (grey cloud) and TTL Auto. Then press **Verify** in Resend.

**If Resend asks for an MX on the root (`@`) rather than on `send`, stop.**
That would take mail away from Email Routing's catch-all.

### 2c. An SMTP key

Resend → **API Keys** → **Create API key**, permission *Sending access*,
domain `lannacare.org`. You see it once, and it goes straight into the
Supabase field below. It doesn't belong in any file in this repo.

### 2d. Supabase: which fields go where

Supabase dashboard → the project behind `lannacare.org` (today
`dbkodyyxxhtygxcxmfcu`) → **Authentication** → **Emails** → **SMTP Settings**
→ **Enable custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `noreply@lannacare.org` |
| Sender name | `Lanna Care UAT` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the API key from 2c |
| Minimum interval between emails | leave the default |

**Save.** Then, still under Authentication → **Rate Limits**: the email limit,
which Supabase keeps very low for its own mailer, can go up to a sensible
number (e.g. 30/hour). The **Reset password** template under **Emails** →
**Templates** can carry the shelter's name.

The dev project (`qxkmhwybjggxvsfxsxbd`) can keep Supabase's built-in mailer.
It is rate-limited but real, and dev has no users outside the team.

### 2e. Test it

1. Sign out of `lannacare.org`, then open **Forgot password?** and enter an
   address that has a login and that you can read.
2. The mail arrives from `Lanna Care UAT <noreply@lannacare.org>`, and its link
   lands on **Choose a new password**.
3. Resend → **Emails** shows it as *Delivered*. If it isn't there, Supabase
   never handed it over, so recheck 2d. If it's there but *Bounced*, recheck 2b.

---

## At the Production cutover (`lannacareforanimals.org`)

This is configuration and DNS. No code changes. The cutover item in
`docs/backlog.md` should:

1. Turn on Email Routing for `lannacareforanimals.org` (verified-address
   sends need nothing more), and verify admin addresses (1b).
   The production database has its own admins.
2. In `wrangler.jsonc`, the new `production` block gets `RELEASE_MAIL_ENV =
   "Production"`, `RELEASE_MAIL_FROM = releases@lannacareforanimals.org` and
   the `send_email` binding. The new `uat` block takes today's values (`UAT`,
   `releases@lannacare.org`). `scripts/deploy.mjs` `SITE_ORIGINS` gains `uat`,
   and production moves to the new host. `src/app/releases/page.tsx`
   `ENV_LABEL` gains the real `uat`.
3. For Supabase Auth on the new production project: Resend's free tier holds
   one domain. Either a second free Resend account for
   `lannacareforanimals.org` (the shelter's own Google account is the natural
   owner) or Resend's paid plan. Decide then, and repeat **2b–2e** with
   `Lanna Care` as the sender name.
