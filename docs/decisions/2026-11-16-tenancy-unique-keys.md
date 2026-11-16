# Tenancy part 2 (C2): the two unique keys, 0387

`#s50n8`, under `#ykefa`. Migration `0387_roles_unique_keys_per_shelter.sql`, applied to dev only.

## What changed
- `roles.key`: `unique (key)` (0132:76) becomes `roles_shelter_key_key unique nulls not distinct (shelter_id, key)`.
- `roles_one_admin_idx`: `on roles (is_admin) where is_admin` (0275:17) becomes `on roles (shelter_id) nulls not distinct where is_admin`.
Each is wrapped to act only if today's definition is still there, so it is re-runnable.

## Why `nulls not distinct`
Every `shelter_id` is null until part 5. A plain `(shelter_id, key)` would treat each null as different and allow duplicate keys and a second Admin today, weakening the existing guarantee. `nulls not distinct` keeps it exactly: still one Admin and one of each key while no shelter exists.

## The Admin invariant
Lutan, 2026-10-25: *"Admin always has access to everything. No matter what cards exist or don't exist."* This change does not alter who Admin is or what Admin may do; it changes how many Admin roles the database will hold, from one in total to one per shelter, because otherwise a second shelter cannot be created at all. `can.ts` is untouched; Admin is given no cards.

## How Admin is decided in SQL (correcting the brief)
The brief said `has_permission()` tests `r.key = 'admin'`. That was true of 0196, but **0277 moved `has_permission()`, `is_admin()`, `my_permissions()`, `holds_app_role()`, `reassign_recurring_job()` and `role_can()` onto `roles.is_admin`**. So SQL and TypeScript both key Admin on the flag now (CLAUDE.md's wording that SQL still reads `key = 'admin'` is stale). Consequence: Admin is identified by the flag, so the per-shelter key is not what makes a second Admin possible; the index is. The key change only lets each shelter use the key `admin`, which nothing decides access by.

## Recommendation for part 5 (`#ujqr5`): the cross-shelter path
Not built here. The Admin bypass is about cards and says nothing about shelters: `is_admin()` returns true if the caller holds any role with `is_admin`, so with one Admin per shelter it would, unless part 5's restrictive policies filter by shelter, let shelter A's Admin through shelter B's rows only by accident of the policy. Recommendation: **do not ride on the Admin bypass.** Use something narrower for Lutan's one identity: a single named row (for example a `platform_operators` table keyed by user id, no role, no card) read by one function the one deliberate exception in part 5's policies calls. It names a person, not a role, and reads no role by name. What would settle it: the shape of part 5's policies, which this part cannot see.

## What the harness proved
See `supabase/harness/0387_roles_unique_keys_harness.sql` (ended `HARNESS OK`, nothing kept): today's single null-shelter Admin still stands and a second is refused; a null-shelter duplicate key is refused; two Admins in two shelters are allowed, two in one refused; `volunteer` in two shelters is allowed, twice in one refused. After applying, an Admin login signed in and Settings → Who does what loaded.
