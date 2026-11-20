# 2026-11-20 — `#pltfd` established as built; the console's Drive and Calendar lines corrected

**Step zero (read on `main` plus this branch, 2026-11-20):** the move had already shipped. `#padui`'s DONE note says it landed with the move
(`docs/decisions/2026-11-19-operator-console-on-the-platform-host.md`, `2026-11-19-platform-console-finish.md`). No `src/app/admin/product-admin/`
directory survives; the code is `src/app/platform/` and names `#pltfd` in its comments. Nothing was rebuilt.

## The five "done when" clauses

| Clause | Evidence |
|---|---|
| The shell carries no shelter name or branding | `src/app/platform/layout.tsx`: plain header (platform name, signed-in email, sign out), `robots` noindex; its header comment says why. |
| The apex serves no shelter data | `src/lib/site-hosts.ts` `PLATFORM_KEEPS` limits the apex to `/platform`, `/login`, `/auth/`, `/api/`, `/admin/security/verify`, logos, `/robots.txt`, `/privacy`, applied by `platformRedirect()` from `src/proxy.ts`. The page reads only `product_admin_*` functions, which are not shelter-scoped. |
| Not reachable under any shelter's address | `src/app/platform/page.tsx`: `if (platformHost() && !isPlatformHostname(...)) notFound();`. **Cannot be proved on dev**: `next dev` leaves `PLATFORM_HOST` unset, so the gate is inert there. |
| A non-product-admin gets not-found | `page.tsx`: `if (!(await isProductAdmin())) notFound();` — `is_product_admin()`, not a role or a card. |
| The records are written down | Below. |

## Records on Cloudflare

`docs/domain-checklist.md` section F: the two addresses (`cooperjaidee.org`, `www.`) are `custom_domain` routes the production deploy creates with their
certificates; the only hand step is deleting any A or CNAME already on the apex or `www`. **Whether Lutan actually had to delete one is not established**
(nothing in the repo records it); the apex has been serving `0.47.6` since the deploy.

## What remains, and whose it is

- **The live saving proof** (sign in on `cooperjaidee.org`, press a button that writes): `#plhbd`'s outstanding half. It needs a production deploy and a Pi
  rebuild, which are Lutan's. The Supabase redirect entries behind `#cjred`/`#aucbk` were added by Lutan's instruction and read back on 2026-11-20.
- Build is complete; the item is ticked with that note.

## The two wrong sentences (rehearsal fault 3)

`driveNotStarted` and `calNotStarted` said the shelter's own Admin connects Drive and Calendar "in its Settings". `DriveStatus.tsx` and
`CalendarStatus.tsx` were opened: no button, form or click handler in either, so Settings only shows status. They now say it is connected from a terminal
(onboarding Step 4 and Step 5) and that Settings only shows the status, in English and Thai. **Release note: none** — only the platform console
(`ProductAdminPanel.tsx`, product administrators only) draws these strings.

## What was driven on dev (port 3005, about 04:45–05:15 UTC on 2026-11-20, alongside two other streams)

By HTTP with a signed-in session's cookies, not by clicking (the browser pane refused the sign-in snippet: "Policy check in progress for this tab"):
signed out, `/platform` is a 307 to `/login?next=%2Fplatform`; the disposable `dev-signin-admin` login at aal2, which **is on dev's `product_admins` list**
(checked with the service role, added 2026-11-19), got the console (`<h1>` "Product admin", the platform shell with its email); a login holding only
`website_photos` (not on the list) got "This page could not be found" with no console; `/admin/product-admin` is 404. **Not proved:** the host gate
(`PLATFORM_HOST` is unset under `next dev`, so it is inert there) and any press or save on the apex, which is `#plhbd`'s live proof.
