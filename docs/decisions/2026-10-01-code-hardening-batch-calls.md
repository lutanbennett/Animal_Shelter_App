# 2026-10-01 — Code hardening batch: the calls that were not obvious

**Password minimum is 12, with no complexity rules.** The item gave 10 to 12;
12 because the length is the only control, and the cost to staff is one longer
passphrase. Existing passwords are untouched — the rule applies when one is next
set. Leaked-password protection is a Supabase dashboard switch and stays
Lutan's.

**WEB-6 is split.** `contact_map_url` now goes through `checkHttpsUrl` in the
action (any https host: both `maps.app.goo.gl` and `google.com/maps` appear in
practice). The matching database check constraint is filed as its own backlog
item rather than taking migration `0120`, because `0119` is reserved for the
placement guards and a Low finding is not worth a second schema PR in flight.
Until it lands, the only writer is the admin action, which is admin-gated.

**WEB-8 puts the logo on the public list.** Narrowing the proxy matcher to
`/_next/static`, `/_next/image` and `/favicon.ico` means the image-extension
skip is gone, so `/lca-logo.jpg` (login page and public header) would
redirect to `/login` for a signed-out visitor. It is added to both the open and
the locked public lists as an exact path. The old matcher also let any future
route ending `.png` or `.svg` bypass sign-in, which is the thing being closed.

**CODE-5 maps three codes.** `databaseFailure()` turns 23505 (unique), 23514
(check) and 42501 (RLS) into sentences and sends every other Postgres error
through `unexpectedFailure`, so table and constraint names stay in the server
log. Applied to the six areas the item named; `raise exception` messages from
RPCs (`record_intake`, `record_immunizations_fanout`) now show the generic
sentence plus a reference instead of their own text.

**WEB-9 was mostly done.** #247 pins `NEXT_PUBLIC_SITE_URL` for the Pi build.
What remained was `admin/status/actions.ts`, which read `x-forwarded-host`
itself for the alert-mail link; it now asks `getSiteOrigin()`.
