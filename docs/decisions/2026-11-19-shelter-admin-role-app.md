# 2026-11-19 — Shelter Admin role: the screen half (#shadm)

Calls `0415`'s two functions from `/admin/product-admin` (`createShelterAdminRole`, `linkShelterAdmin` in `actions.ts`),
in the signed-in client, same shape as the `0414` actions. Controls drawn only at `aal2`. The Admin role is given no cards.

## Deliverable 5 — create a login, or pick one? PICK (by pasted account id)

- **A PADMIN can read no logins.** `product_admin_shelters()` returns shelters; a PADMIN holds no cards so the people
  screens are closed to them. So "pick from a list" is not implementable. What is implementable, and what the screen's
  own "Add a product administrator" form already does, is to paste an `auth.users` id.
- **Creating** would need `auth.admin.createUser` through the service role. The existing action is gated by the card
  `security.createUser`, which a PADMIN does not hold, and widening it would be a card-system change by the back door
  (forbidden file). A new service-role call site was not justified when pasting an id works. **No service-role site added**
  (`check-service-role-sites.mjs` count unchanged).
- **Cost, stated plainly:** onboarding is end to end only if the first person already has a login. Creating one, or inviting
  them, is still a separate step. Finding for the planner: a way for a PADMIN to create or invite a first login needs its own
  decision (a card, or a narrow PADMIN function).

## Deliverable 9 — what state a shelter is in

There is no PADMIN-readable function saying whether a shelter has an Admin role or a linked login, and no migration is
allowed here. So the screen cannot show per-shelter state. It says so in words (the shelter note, and the "created" message
now points at the two steps in the row), and each refusal tells the person if a step is already done. Consistent with #1714's
vocabulary ("cannot be used" became "cannot be signed in to"). Finding for the planner: a `product_admin_shelters()` extension
(or sibling) returning `has_admin_role` and `admin_logins` would let the screen show the state.

## Error mapping

`42501` second step expired. Create: `23505` already has an Admin role, `22023` unknown shelter. Link: `23505` is one sentence
covering both causes (already linked, or already has a main role elsewhere); `22023` covers "no Admin role yet" and "no such
login" in one sentence because the code is shared.

## For the planner (not edited here)

`#onbrb` runbook steps that are now possible: giving a new shelter its Admin role, and linking an existing login to it.
