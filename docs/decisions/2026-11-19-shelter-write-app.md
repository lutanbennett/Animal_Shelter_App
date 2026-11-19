# Product admin: the write half (#shmgt app PR)

**Built:** on `/admin/product-admin`, a product administrator at `aal2` can create a shelter, add a web
address to a shelter and remove one. They call `product_admin_create_shelter`, `product_admin_map_host` and
`product_admin_unmap_host` (0414) through the signed-in client, never the service role. Controls are drawn
only at `aal2`; at `aal1` the existing sentence and step-up link show. Each SQLSTATE the functions raise
(`42501`, `22023`, `23505`) is turned into a plain sentence; anything else goes through `databaseFailure`.
No delete, no rename, no one-step move of an address: no function does them.

## Deliverable 7: what the screen says after a create

It says the shelter exists but has **no web address, no Admin role and no login yet, so nobody can use it**,
and that the Admin role and first login are set up outside this screen. The standing note under the table
says the same. **Why:** a created shelter appearing in the list looks finished; naming what is missing stops
anyone treating onboarding as done. The function that makes the Admin role belongs to a parallel stream and
is neither called nor built here.

## Deliverable 8: host at creation, or afterwards

**Afterwards, as two deliberate steps.** Create takes a short name and a name only; the address is added from
the shelter's own row once it exists. **Why:** the two calls share no transaction, so one form doing both
could create the shelter and then fail on the address, leaving a half-done create with no visible cause.
Two steps means each result is shown on its own, and a shelter with no address is plainly listed as such.

## Not shipped

Connecting Drive and calendar from the screen (stage 3 of the original item) was not built and still runs by
`connect-shelter-*` scripts; the backlog tick says so. Also for the planner to file: this work makes
`#onbrb`'s Step 1 (create the shelter) and the host-mapping part of Step 6 possible from the screen; the
Admin-role and first-login steps stay `NOT YET POSSIBLE`. The runbook was not edited.
