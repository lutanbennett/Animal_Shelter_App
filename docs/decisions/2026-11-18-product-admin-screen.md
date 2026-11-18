# 2026-11-18 — The product-administrator screen, inside Settings (`#shmgt`, app half)

Page `/admin/product-admin`; no migration. Reads `product_admin_shelters()` and `product_admins` (0411/0412) through the signed-in client.

## The location question is answered, and by whom

Lutan, 2026-11-18, offered three options (inside the app's admin area, a separate surface outside the shelter app, keep using scripts), chose **inside the admin area**. Not put to him again. The access design was settled the same day by him: *"just a list of people with Product Admin (PADMIN)"*, *"doesnt need roles or cards"*. Recorded already under `outsideTheCardSystem.productAdmin`; nothing was added to the registry here because no new rule or service-role call site was introduced.

## The button gate is not `can()`, and why

PADMIN sits outside the card system, so there is no activity to ask. The gate is **`is_product_admin()` plus `aal2`**, read from the same place the database reads it (0411: the insert and delete policies answer `is_product_admin()`, and restrictive policies demand `aal2`):

- **The surface exists only for someone on the list.** The page calls `is_product_admin()` and answers `notFound()` otherwise, so a login not on the list (a shelter Admin included) gets the same page as an address that does not exist. The Settings tile is drawn only when the same call is true. The page is deliberately **not** in the route registry (`routes.ts`): registry entries open on a card or on Admin, and an entry here would have opened it to Admin.
- **Add and Remove are drawn only at `aal2`** (`hasTwoStep()`). At `aal1` the person sees a sentence and a link to the existing step-up page, `/admin/security/verify`, which is how `/admin/security` handles the same case. Drawing them at `aal1` would be the fault the button rule was written for: the database refuses each press.
- The action files re-check `is_product_admin()` and `aal2` before writing and return the refusal in words. **Those checks are the courtesy; the policies are the security and are unchanged.**
- The step-up page and its code-entry action (`confirmTwoStep`) used to require Admin. They now also accept someone on the list, because otherwise a PADMIN who is not a shelter Admin could never reach `aal2`. This only raises the caller's own session, so it grants nothing (the action's own comment already said so). The first-time authenticator setup (`startTwoStepSetup`) stays Admin-only: its window is opened by an Admin (`#two-step`).
- Removing yourself is refused in the action so one press cannot empty the list. It is not a permission; someone else removes you.

## The email choice (deliverable 6): no service role, and the narrow choice is the right one

**Not used.** Showing a PADMIN's email would need `createAdminClient()` to read `auth.users`, a permanent entry in `docs/service-role-sites-registry.json` and a new place the service key is reachable from a request, to save a person from reading an id. So the list shows the **account id**, and the signed-in person's own email beside their own row (it is on their session already).

The cost, stated plainly: **adding is by account id**, not by email, because turning an email into an id also needs the service role. A product administrator adds someone by pasting their account id (visible to them in the Auth dashboard). That is rare, and the alternative is a registry entry for good. A future item can add the lookup if the list ever grows beyond a handful. `check-service-role-sites.mjs` still reports 90 calls, all recorded.

## Creating a shelter (deliverable 9): not in this stream

**Answer: no.** Writes to `shelters` and `shelter_hosts` have no login grant (0382). A definer write function is a migration, and this stream carries none (`0413` belongs to another stream). Creating a shelter stays a script, documented by the onboarding runbook (`#onbrb`). The screen says so in a line. The item is therefore **not closed**: see the PR for the remainder.

## What was driven and what was not

Driven in the built-in browser on dev: a login **not on the list** (the dev admin) sees no Product admin tile and the address returns a page with no mention of it; the same login **placed on the list** (service role, removed afterwards) sees the tile, the two dev shelters with their hosts and keys, the list showing itself, **no Add or Remove**, and the sentence with the step-up link. **Not driven: `aal2`.** A dev session has no authenticator, so Add, Remove, their refusals and the post-code redirect were not seen: `pending: aal2 state not driven`.

## Found, not fixed

- A PADMIN who is not a shelter Admin reaches the screen only by its address: the Settings landing opens for logins holding a Settings page card, and the tile lives there. Whether the platform operator needs a landing of their own is for the planner.
- A PADMIN with no authenticator cannot set one up on their own: setup is opened by a shelter Admin for that login (unchanged).
