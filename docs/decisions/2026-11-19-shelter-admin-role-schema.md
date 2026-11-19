# 2026-11-19 — A new shelter's Admin role and first login, schema side (`#shadm`, migration `0415`)

`supabase/migrations/0415_product_admin_shelter_admin_role.sql`, proved by `supabase/harness/0415_shelter_admin_role.sql`. Schema only; `#shadm` stays open until the screen half lands. It **extends** the recorded PADMIN exception (`outsideTheCardSystem.productAdmin`) and adds no new one; two `database.declared` entries were added to the registry, nothing under `outsideTheCardSystem` changed.

## Admin gets NO cards

The Admin role is inserted with `is_admin = true` and **no `role_cards` row**. Full access comes from the `roles.is_admin` flag that `has_permission()` reads. The harness proves it: after the call the role holds 0 cards and the linked login's `has_permission('resident.record','edit')` is `true` (a card-shaped implementation would fail that).

## Scope decision (deliverable 4): link an EXISTING login; the invite is not built

"Connects a first login" means linking an `auth.users` row that already exists. The planner's "no invite machinery" read **half held up**: there is no email-invite call anywhere (`inviteUserByEmail` is absent), but logins are admin-provisioned, and `src/app/admin/security/actions.ts` `createUser` (line 213) already makes a login through `auth.admin.createUser` with the service role. So the screen half can create the login with that existing pattern and then call the link function, no new schema needed. What is **not** established: that `createUser` works for an admin of a shelter that has no Admin yet (it acts inside the current shelter), so the screen half will need to create the login from the PADMIN screen. **Finding for the planner to file:** onboarding is still not end to end until the screen half creates (or picks) the login and calls both functions.

## Other rows a shelter needs (deliverable 8)

Not tested to exhaustion. `0392` made every list read empty for a shelter with no rows, and `site_content` is one-per-shelter (`0396`), so a created shelter probably also needs a `site_content` row and any settings it reads before its public site renders. None of that blocks **signing in** (the aim of this item). **Finding for the planner:** a "what does a fresh shelter need to render" probe is its own item.

## A trap met, and a fix

`rls_definer` cannot read `auth.users` (42501), so the link function does not look the user up; the foreign key on `user_roles.user_id` raises, and the function turns it into `22023 no such login`. 0415 was applied to dev twice (first draft inserted a dropped column, `opens_app`) via `--forget` of the unmerged row; the file as merged is the one that ran last.

## Specification for the screen half

Both functions: `authenticated` and `service_role` only; call through the signed-in PADMIN's own client (the JWT must be theirs). Each raises, never returns silently, unless the caller is a PADMIN at `aal2` (`42501`).

| Function | Returns | Raises (besides `42501`) |
|---|---|---|
| `product_admin_create_shelter_admin_role(p_shelter uuid)` | the new `roles.id` (uuid) | `22023` unknown shelter; `23505` shelter already has an Admin role |
| `product_admin_link_shelter_admin(p_shelter uuid, p_user uuid)` | nothing | `22023` shelter has no Admin role, or `p_user` is not an `auth.users` id; `23505` login already linked to this Admin role, or login already has a main role (anywhere) |

The link is the login's **main** role (`user_roles_extra_role_rules` forbids Admin as an additional role, and `user_roles_one_main` allows one main role per login), so a login that already works for another shelter cannot be linked: refuse it plainly. Order: create shelter (0414) → create Admin role → create or pick the login → link. The screen must NOT: give the Admin role cards, rename or delete the role, link a second Admin (it is one Admin role per shelter, but any number of logins may be linked), or try to send an invite (none exists).
