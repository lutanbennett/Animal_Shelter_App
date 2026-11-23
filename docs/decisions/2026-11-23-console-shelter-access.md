# Console shelter access: a backup to a shelter's own Admin (#shsec)

Lutan, 2026-11-23: *"just want the ability to add and remove users from a shelter and asign existing roles"*, as *"a backup to the admin at the shelter"*.

## What it is
An **Access** tab on a shelter in `/platform`. A product administrator at aal2 sees the shelter's logins and the role each holds, and can add a
login (by its email) to an existing role of that shelter, move a login to another existing role, or take a login out. The shelter is named in a
banner on the tab. Migration `0438` holds five product-administrator-only functions behind it; `src/app/platform/access-actions.ts` calls them
through the signed-in client, as the other console actions do.

## Why a role and never a card
Giving a login an existing role grants exactly the cards that role already holds, so no new way to grant exists. Nothing here writes `roles`,
`role_cards` or `card_grants`; `roles` is only read. There is no flag, level or override, and no action that creates or edits a role. How this was
prevented (not just intended): the database has no function that does, the actions call only the five functions, and the harness
(`supabase/harness/0438_product_admin_shelter_access.sql`) and `check-hard-coded-security.mjs` stay clean. The gate is the product-administrator
list plus aal2 (outside the card system, 2026-11-18), the same check the control, the action and the database function each ask.

## What the audit records
`user_roles` already has the `record_audit()` trigger. The functions run under the caller's own JWT, so `audit_log.actor` is the product administrator
and `audit_log.shelter_id` is the shelter, for every add, re-role and take-out. No second trail. A shelter's Recent changes shows these rows; it does
not yet mark them as an outsider's beyond the actor (noted for the planner).

## The two open questions
1. **What "remove" means:** archive (`user_roles.archived_at`), the same reversible state the shelter's own Archive uses. The login, the person and
   every record they made are kept; adding the login back restores it. Nothing built here can delete a person or a login.
2. **Can a product administrator lock a shelter out?** The path allowed it, so it is refused: a re-role away from Admin, or a take-out, of the only
   live login holding the shelter's Admin role raises 23514 and the screen says why. Proved by the harness (sole Admin: demote and remove both refused).

## Deliberately not here
Creating a brand-new login (the first-login door, `0425`, already exists for a shelter's first Admin); roles; cards; additional (cover) roles.
A login that already belongs to another shelter is refused (`user_roles_one_main`), never moved. A login given the Admin role has its authenticator
set-up window opened, as the shelter's own Security page does (`openAuthSetup`, best effort, after the database accepted it).
