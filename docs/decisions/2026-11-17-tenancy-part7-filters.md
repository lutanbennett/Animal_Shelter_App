# Part 7 second half, first slice: shelter filters on service-role calls (#ps6ms)

**Status: partly done. `#ps6ms` stays open: 57 of the 81 recorded calls are still `needs-shelter-filter`.**

## Question 1: does passing `shelterId` to `createAdminClient()` filter anything?

**No.** `admin.ts` only sets the `x-shelter-id` header. The service role is a trusted caller (`is_trusted_caller()`, `0392`), so the restrictive policies let it through whatever the header says. **A filter must be an explicit `.eq("shelter_id", …)` in each query**, and the fix is per query, not per client. The helper `actingShelterId()` (`src/lib/supabase/acting-shelter.ts`) reads the request's shelter; no shelter means no rows, never every shelter.

## Done

- `src/lib/status/usage.ts` (the confirmed leak): every count carries the shelter, sign-ins count only logins holding a role here, and the report cache is keyed by shelter. The `system.status` card is untouched.
- `src/lib/auth/held-roles.ts` (2 calls): `user_roles` read for the acting shelter only.
- `src/lib/status/alerts.ts` (6 calls): recorded `cross-shelter`, with #1645's reason (installation monitoring).
- The registry has a new class, `filtered`. The check now fails a `filtered` record whose function names no `shelter_id`/`shelterId`/`actingShelterId`; three planted tests added to `scripts/check-service-role-sites.test.mjs`.

## Not done, and why

- **57 sites still `needs-shelter-filter`** (Security actions and page, Who does what, adopter portal, reels and video routes, report photos, calendar import and sync, facility map, home roles, menu, merch, access requests). Each needs its shelter chosen: a request-scoped route can use `actingShelterId()`; storage-bucket sites (report photos, facility map) have object names with no shelter prefix, so a filter there is a naming change, not a `.eq`; the adopter-portal and merch sites are public and carry no signed-in shelter beyond the host header.
- Not yet established: whether any site exists because RLS would block it (question 3), and which sites have no shelter at all (question 2: cron and poller paths). Neither is answered by this slice.
- The canary is blind to service-role calls, so its green proves nothing here.
- The strict catalogue lint was not re-run (no schema change).
- Browser click-through of `/admin/status` not driven; build gate stopped on Next's security-advisory notice, not on this change.
