# 2026-11-14 — What a hostname MEANS on `cooperjaidee.org` (`#j4m8w`): a recommendation, and the choice is Lutan's

**Status: RECOMMENDATION. The product choice in (a) is Lutan's and the Director's; the item stays open.**
Nothing is deployed, no DNS record, route or Pages project exists, and nothing in this repository is renamed.

## Step zero

Checked 2026-11-14: no hostname decision exists (`docs/decisions/` has only the spike and the tenancy hardening files);
`cooperjaidee` appears only in docs (product-name decision, handovers, backlog); `wrangler.jsonc` routes name only
`lannacare.org` subdomains and `lannacareforanimals.org`. The gap is real.

## The certificate limit, VERIFIED

Source: Cloudflare docs, *SSL/TLS → Universal SSL → Limitations*, `developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/`,
read 2026-11-14. In a **full setup** zone (the registration is on Cloudflare, so this is ours), Universal SSL covers
**the root domain and first-level subdomains** (`example.com`, `blog.example.com`). **Deeper names
(`app3.dev.www.example.com`) are not covered**; fixing that needs Advanced Certificate Manager (paid) or an uploaded custom certificate.
**It agrees with the item**: apex plus one level. So `lanna.cooperjaidee.org` works free; `app.lanna.cooperjaidee.org` would cost money
and break the zero-ongoing-cost rule. Free plans get an ECDSA-only certificate, which is fine for any current browser.

**Not verified, and not assumed:** whether the Worker can be attached to a wildcard (`*.cooperjaidee.org`) on the free plan, or only to
explicitly listed custom domains (as `wrangler.jsonc` does today, one `custom_domain` line each). Check before the build relies on a wildcard;
listing each shelter's host explicitly is the known-working fallback.

## What the host-to-shelter mapping must do, per shape

The spike (`2026-10-09-multi-tenancy-spike.md`, "anon's comes from the site being visited") has the Worker map the request host to a shelter and
send it as a header that PostgREST exposes; no header means no rows.

| Shape | Worker lookup | Where the mapping lives | New shelter setup | Certificate |
|---|---|---|---|---|
| **1. Subdomain per shelter** (`lanna.cooperjaidee.org`) | Strip the suffix, read the label | Could be computed, but a table is safer | One DNS/route entry (or none if a wildcard works) | Free, one level. **Never nest deeper** |
| **2. Shelters keep own domains** (today's Lanna) | Exact match on the full host | A table of host → shelter | A route per shelter on that shelter's own Cloudflare zone, which is their account and their DNS | Each zone's own Universal SSL |
| **3. `cooperjaidee.org` is only the front door** | Apex maps to *no* shelter (platform pages, sign-in) | Same table as 2 | Same as 2 | Apex only |

**The technical consequence:** shapes 1 and 2 are not alternatives to the Worker. Both resolve through **one table, host → shelter**
(a hostname row per shelter, a shelter may have several). A computed label rule is a shortcut inside shape 1 only and would not cover Lanna.
So the build should be **table-driven whichever shape is chosen**, which makes the choice a product question, not a mapping one.

## Email (c), read from the code

- Receiving: `lannacare.org` has Email Routing with a catch-all to Lutan's Gmail (receive-only).
- Sending today: the Worker sends release mail and status alerts through Cloudflare's `send_email` bindings (`RELEASE_MAIL`, `STATUS_ALERT_MAIL`)
  from `RELEASE_MAIL_FROM` = `releases@lannacare.org` (UAT/test) and `releases@lannacareforanimals.org` (production) (`wrangler.jsonc`,
  `worker/release-mail.mjs`). Password reset (`src/app/login/forgot/actions.ts`) goes through the Supabase project's own SMTP setting, not an address in this code.
- **Nothing sends as `cooperjaidee.org`, and nothing needs to yet.** Receiving there (Email Routing, same catch-all pattern) is optional, cheap
  and wanted only once a person-facing address is printed anywhere. Sending as it would need SPF/DKIM and a verified sender: a separate job, Lutan's.
  Not set up here.

## Recommendation

**Table-driven mapping (one `host → shelter` table), with `cooperjaidee.org` as the platform's front door and sign-in (shape 3) and each shelter's public site
staying on its own domain (shape 2); a first-level subdomain (shape 1) is offered to a shelter that has no domain of its own.**
Reasons: it is the smallest change; Lanna's public identity does not move; the one-table mapping serves all three; the only certificate
rule it imposes is "never a second level", which costs nothing.

**Hostnames the tenancy build resolves against, under this recommendation:**

- `cooperjaidee.org` (and `www.`): platform front door, no shelter.
- `<shelter>.cooperjaidee.org`: one level only, for shelters without their own domain.
- `lannacareforanimals.org`, `www.lannacareforanimals.org`: Lanna, production, unchanged.
- `uat.lannacare.org`, `test.lannacare.org`: Lanna's UAT and test, unchanged.
- Anything else: no shelter, no rows.

## Why this is his, not settled here

(a) turns on what Cooper Jaidee is to its customers: a brand each shelter wears (shapes 2/3) or a place they live (shape 1).
(e) says a shelter's domain is its public identity and moving it is his and the Director's call. The mapping does not force either.

## Explicitly NOT changing

Lanna's domains; every repository, project, Pi service and branch name; production; no DNS record, route, Pages project, certificate
or Email Routing change; nothing deployed. `#j4m8w` stays open: (a) is recommended, not decided.
