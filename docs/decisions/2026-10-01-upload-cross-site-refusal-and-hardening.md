# Cross-site refusal on the upload routes, an auth check on the manual PDF, and CI hygiene

2026-10-01 — backlog "Defence in depth and hygiene" (WEB-7, CODE-9, CODE-10).

## WEB-7: what the upload helper compares, and what it never does

`refuseCrossSite()` in `src/lib/auth/same-origin.ts` is called first in all five
multipart routes (`residents/[id]/photos`, `projects/[id]/photos`, and the
`attachments` routes for procedures, maintenance and blood tests). It returns 403
for:

1. `Sec-Fetch-Site: cross-site` — set by the browser, not forgeable by a page.
   `same-origin`, `same-site` and `none` pass.
2. An `Origin` that is `null` or unparseable.
3. An `Origin` whose host is neither `lannacare.org`, a one-label subdomain of
   it (`www.`, `test.`), nor equal to the request's own `Host` header.

A request with neither header is not a browser cross-site post and passes; it
still needs a session and a role.

**It never compares `Origin` with the host the server believes it is.** Behind
the Worker and cloudflared that host is not the public one: `x-forwarded-host`
is cloudflared's ingress name (`pi.lannacare.org`) and `request.nextUrl` says
`localhost:3000`. That comparison is exactly what rejected every Server Action
on 2026-10-01 (see `2026-10-01-server-actions-allowed-origins.md`), and it fails
only in production. The static list is the same one `allowedOrigins` in
`next.config.ts` uses, for the same reason — the hosts in the visitor's address
bar. `Host` is the one dynamic input, and only as an *accept* path: cloudflared's
`httpHostHeader` pins it to `lannacare.org`, and under `next dev` it is
`localhost:<port>`. It can only widen to the host the request was addressed to,
never past a `Sec-Fetch-Site: cross-site`.

How it was checked without the Pi: the real function was run against the header
sets each hop produces — `Origin: https://lannacare.org` with `Host:
lannacare.org` (the Pi path), `www.` and `test.` origins, `localhost:3003` in dev
— all pass; `evil.com`, `lannacare.org.evil.com`, `a.b.lannacare.org`, `null`
and `Sec-Fetch-Site: cross-site` all refuse. A real upload through the Pi still
has to be exercised after deploy (test plan, left for manual verification).

## CODE-10: `getUser()` in `/manual/pdf`, and no layout guard

`proxy.ts` already turns a signed-out request away, so this was defence in
depth: the route now calls `getUser()` itself and answers 401. A matcher or
public-path edit can no longer silently open the printable manual.

**The optional shared layout guard was not built.** A guard in a root layout
would also cover the public pages (`/`, `/adopt`, `/donate`, the tag pages) and
would need its own public-path carve-out, duplicating `isPublicPath`; a
route-group move to make a staff-only layout is a large diff for a gap that is
now one line wide. Route handlers do not render under layouts anyway, so it would
not have covered the PDF route this item is about. Revisit if another
authenticated route handler turns up without a check.

## CODE-9: wrangler, `npm audit`, pinned Actions

- `wrangler` 4.135 → 4.145: `miniflare`'s `undici` goes 7.29.0 → 7.29.1, which
  clears the high-severity undici chain. `npm audit --omit=dev --audit-level=high`
  still reports **`next` 16.2.0–16.3.5 (critical, RCE in `next/og`
  ImageResponse)**; the fix is `next@16.3.8`, outside this item and not bumped
  here. It is its own follow-up.
- The `audit` job is `continue-on-error: true` and PR-only. That is right here and
  wrong for `test-plan` for the same reason stated the other way round: a
  `test-plan` failure is always someone's mistake to fix, so suppressing it hid
  real failures; an `npm audit` finding is often unactionable today (no fixed
  release, or only via a major bump), so a required or red-and-ignored job would
  teach everyone to look past red.
- Actions are pinned to commit SHAs with the tag in a comment. Pinned means they
  stop updating, so `.github/dependabot.yml` opens one grouped PR a month for the
  `github-actions` ecosystem; that PR is how a pin gets bumped.
