# The console shows a person who works at two shelters (#acwho, console half) — 0444

Follows `2026-11-25-one-main-role-per-shelter.md` (the schema half, `0443`), whose "Specification for the console stream" this works
through item by item. Lutan's model is unchanged: one login per person **per shelter**, carrying as many roles as that shelter needs.

## What the Platform console's Access tab now shows

- **Each person once, with their main role** (the one the console changes), as before.
- **Their additional roles at this shelter, grouped under them**, read-only, with `(main role)` beside the main one. Decision below.
- **"Also works at N other shelters."** A count, never names: the product administrator already sees every shelter, but the rule is
  Lutan's privacy line and the spec's, and the count is all the screen needs.
- **The Add result says which of three things happened**: *new to this shelter*, *was already here and now has the role you chose*
  (including bringing back a login that had been taken out), or *already has that role here, nothing changed*. When the person also
  works elsewhere the count is added to the sentence. English and Thai.

## The new function: `product_admin_access_elsewhere(p_shelter)` (0444)

For each login with any row in `p_shelter`, how many **other** shelters it holds a live main role at. Returns `user_id` and a count only.
Product administrator and aal2 in its own body, like its `0438` neighbours. Reads `public.user_roles` only, not `auth.users`.

**It stays owned by postgres and is recorded in `scripts/lib/tenancy-catalogue.mjs`'s `ALLOWED`**, with the reason: counting other
shelters means reading `user_roles` across shelters, and under `rls_definer` the restrictive per-shelter policy would hide every other
shelter, so the count would always be 0. The entry lands in this PR with the function, as the `tenancy-migrations` gate
(`claude/tenancy-catalogue-gate`, #tnc41) requires; that stream agreed the text and asked for it to be carried here.

**Could the count be answered without a new function?** No. `product_admin_shelter_access(p_shelter)` returns only that shelter's rows,
and the console has no other product-admin read of `user_roles`. Calling it once per shelter would work but costs a round trip per shelter
on every load and puts names of other shelters in the browser's hands, which is what the count avoids.

## Additional roles: SHOWN

The RPC already returned `is_main = false` rows and the action dropped them, so a login with two roles at a shelter read as one role.
That misleads, so they are shown, grouped under the person. They are **not editable from the console**: adding or ending an additional
role stays on the shelter's own Security page, which the spec says is unchanged and correct. The console's role selector still changes the
main role only.

## The add result: how the three outcomes are told apart

`product_admin_access_add` returns the user id whether it inserted or re-roled. Rather than change its return type (which would need a
drop and recreate of a live function), the action reads this shelter's main row for the address first: none means *new*, same role and
live means *unchanged*, anything else means *re-roled*. Only a product administrator writes here, so the read and the write do not race in
practice. `23505` can no longer come from add (`0443`); it remains mapped to `alreadyHere` for the other actions.

## Access requests: NOT BUILT, and why that is the right size

Today an "access request" is not a record at all: it is a login that exists in `auth.users` and holds **no role anywhere**
(`accessRequestsAmong`, `listUsersOfShelter`, `countWaitingAccessRequests` in `src/lib/auth/access-requests.ts`). There is no table saying
*which* shelter the person asked for and no action by which a signed-in person asks. So a person with a role at A has no way to ask B, and
nothing B's queue could show if the condition were changed: relaxing `listUsersOfShelter` to include "has a role elsewhere" would put
**every** staff member of every other shelter in B's queue.

Doing it honestly needs a request record (who, which shelter, when), an "ask to join" action for a signed-in person, and the two functions
reading that record. That is a feature, not a condition and a sentence, so it is **left for its own item** (for the planner to file).
**Today's need is met without it:** a product administrator adds the person directly from the console, which is what this change makes
usable and what was driven below.

## Proved by driving it

Headless Chrome through `scripts/lib/driven-session.mjs`, a disposable aal2 Admin login on dev's product-administrator list, adding
`dev-signin-volunteer@example.invalid` (main role at the dev shelter) to the disposable "Proof shelter B". Read back from the page:

- first Add: *"Added. This login is new to this shelter. Also works at 1 other shelter."*
- the same Add again: *"This login already has that role in this shelter. Nothing changed. Also works at 1 other shelter."*
- reloading Proof shelter B: the login listed with *"Also works at 1 other shelter."*
- reloading the dev shelter (Lanna Care for Animals): the same login listed there with *"Also works at 1 other shelter."*

The script added the person with the selector's default role, which is Admin, on that disposable shelter; it is left in place (dev data is
disposable, and taking them out would be refused as leaving the shelter with no Admin).

## Left alone, read

`removeExtraRole` (`src/app/admin/security/actions.ts`) and its unscoped role lookup by key: not touched, not reachable from this change,
as the schema half established. `src/app/platform/ProductAdminPanel.tsx` is still 1,103 lines and was not changed: the Access tab is
`ShelterAccess.tsx`.
