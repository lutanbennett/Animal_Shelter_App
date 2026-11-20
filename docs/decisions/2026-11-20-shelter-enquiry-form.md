# The shelter enquiry form (#shsup, app half)

Lutan, 2026-11-20: *"Record an enquiry."* The form records who asked and mails him; nothing is created. Specification:
`2026-11-20-shelter-enquiry-schema.md` §4. Table `shelter_enquiries` is 0427 and is untouched here.

## The gate (deliverable 1)

Two gates sat in the way, and the page works with both rather than around them.

- **`PLATFORM_KEEPS`** (`src/lib/site-hosts.ts`) already keeps everything under `/platform`, so the platform host does not bounce
  `/platform/enquire`. No change.
- **The proxy's sign-in wall** (`PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS` in `src/lib/public-paths.ts`) would send a stranger to
  `/login`. `/platform/enquire` is added to both as an **exact path**, so `/platform` itself (the console) stays behind sign-in
  and `isProductAdmin()`.
- `src/app/platform/page.tsx` is **not edited**. The new page keeps only the host check (`platformHost()` set and the request
  not on it gives not-found), and does no sign-in or product-admin check, because it shows and reads nothing.

## One answer (deliverable 4)

Success, a duplicate (`23505`), a drifted check (`23514`), any other database failure, a honeypot hit and a throttled send all
return the same `{ ok: true }`. Only a bad field of the visitor's own names the field to fix. `answerForInsert()` in
`src/lib/platform/enquiry.ts` is the one place that maps an insert result to an answer, and `enquiry.test.mjs` asserts success
and duplicate are identical. The form never reads back and never checks whether an address or shelter exists.

## Protections (deliverable 3)

Honeypot field `website`; per-address throttle (5 per 10 minutes, in memory: one server on the Pi, a restart only forgives);
lengths capped before the insert (raw field cut at 8000, then the table's limits); the response never echoes input.

## The email (deliverable 5): there is a free path, and it is the Worker's own relay

Question: can a server action on the Pi reach the Worker's `RELEASE_MAIL` binding? **Not directly, but it does not need to.**
`worker/release-mail.mjs` already answers `POST /api/releases/mail` over HTTPS, bearer-authenticated with the service-role key,
which the Pi also holds. The action posts there after a successful insert (`appUrl("/api/releases/mail")`), with a **fixed
subject**, the visitor's words only in the **text/html body** (HTML-escaped), and `to` set from `SHELTER_ENQUIRY_MAIL_TO`, one
address, Lutan's. A 5 s timeout, no retry, and every failure is caught and logged: mail can never change the visitor's answer.
No paid service.

**What is NOT established, and is a step only Lutan can do:** `SHELTER_ENQUIRY_MAIL_TO` is unset everywhere, so **no mail is
sent until it is set** on the Pi (and the address must be a verified Cloudflare destination, as with release mail). On dev the
relay is off by construction. The mail path was **not driven end to end**; only the insert was. The relay also prefixes the
environment label (`[Production]`) and sends from the release sender, so the mail reads like a release mail's sibling.
`SHELTER_ENQUIRY_MAIL_TO` is recorded under `environment` in the security registry (it gates nothing); I did not touch
`scripts/lib/runtime-config.mjs` (stream 6's file), so that registry of worker settings still needs the name added.

## Service role

One call site, `src/app/platform/enquire/actions.ts`, added to the ESLint allow-list and to `serviceRoleSites`. A stranger holds
no table access (0427 grants none), so there is no signed-in alternative. `check-hard-coded-security.mjs` still prints
`no coded security outside the Admin bypass`.

## Found, not fixed

- The built-in pane shows a direct-loaded page un-hydrated; the form hydrated here after a screenshot woke the pane.
- The platform host is not configured on dev, so the apex host check was not driven; only the open (unset) branch ran.
- Not built, by design: approval queue, pending application, any account. The console's list of enquiries belongs to `#pacon`.
