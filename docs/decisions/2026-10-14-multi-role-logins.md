# A login may hold several roles, and its rights are the union (schema half)

2026-10-14, `claude/multi-role-schema`, migrations `0196` and `0197`. Backlog: *One person, more than one role*. This
is part (1) only. **Nobody can see or use this yet**: the Add-a-role panel, the union in the home and menu, the rota
picker and the "covers ending" list are `multi-role-build`. Until that ships every login still has exactly one row.

## What changed

- `user_roles` is one row per (login, role): key `(user_id, role_id)`. New columns `is_main` (the login's one permanent
  role; every existing row back-filled true), `starts_on` / `ends_on` (shelter dates; null = open on that side),
  `granted_by`. A unique index allows one main role per login; a main role cannot carry dates.
- `role_row_live(starts_on, ends_on)` says whether a row is in force today **by `shelter_date()`**, not UTC. `ends_on`
  is the last day the role counts, so a cover that ends today still works today in Thailand and stops the day after.
- **Admin is never an additional role** (and neither is the public viewer). A trigger refuses it, so the 2-step and
  lockout rules (`docs/roles-and-permissions.md` section 6) stay true whatever UI is built on top. An additional role also
  needs a live main role to sit on, and a main role cannot be turned into an additional one.

## How the helpers combine several roles

The rule: **a grant is the union; a restriction holds only while every live role is restricted.**

| Helper | Several roles |
|---|---|
| `has_permission`, `is_admin`, `holds_app_role`, `sees_all_residents / clinical / contacts` | any live role grants it (already `exists`; only the expiry test was added) |
| `my_permissions()` cells | the highest level any live role gives |
| `my_permissions()` scopes | the widest: residents all > who_and_where > own_clinic; clinical any > own_clinic; contacts full > name_phone > name_type; photos all > medical_only. `sees_login_emails` and `opens_app` if any role says so |
| `is_clinic_login`, `photos_medical_only` | true only if **every** live role is restricted, so a doctor who is also a Head of Medical is not confined to one clinic |
| `on_volunteer_floor` | true while some role reads who-and-where **and none reads every resident** |
| `role_can` | "is it one of my roles", not "is it my role" |
| `reassign_recurring_job` | counts people with `count(distinct user_id)`; counting rows would have refused a two-role person |
| `private.app_users` | one row per person, from the main role (otherwise a person is listed once per role) |

**The floor is not the minimum of the floors, and it is not the maximum either.** The volunteer floor and the clinic
scope are limits on what a role may see. A person holding a limited role and a wider one gets the wider reach, because the
wider role was granted on purpose, so the limit lifts. The one place a limit survives is the **email** hiding in
`private.app_users`: a doctor who is also a volunteer still has the volunteer floor, so their colleagues' emails stay
hidden. Hiding is the safe way to be wrong there. `my_permissions().role` is the **main** role; the new `roles` array
lists every live key.

`my_permissions()` takes the **widest** of two scopes that are not strictly ordered (`name_phone` and `name_type` each show
something the other does not). The ranking above picks the broader; the person is not given a mixture. That is a
deliberate simplification, and the safe one to correct later.

## Proof nothing widened

`permission_activities` x `has_permission` (read and edit), `my_permissions()` (role, is_admin, scopes, permissions), the
eight scope helpers and `private.app_users`, hashed **per login** under its own JWT before and after `0196`/`0197`: 63
logins, 63 identical hashes. `scripts/check-multi-role-schema.mjs` then exercises the new behaviour in a rolled-back
transaction (union, expiry both edges, restrictions, one row in `app_users`, six refusals).

## What I got wrong on the way, so the next person does not

`0196` first shipped `role_row_live` with `search_path = ''`; `shelter_date()` calls `shelter_time_zone()` unqualified, so
every permission helper failed on dev until `0197` fixed it. Applied files are never edited, hence the second file. The
before/after hash caught it on its first run, which is what the hash is for.

## Code that assumed one row (fixed here, because the key change would otherwise break it)

- `src/app/admin/security/actions.ts`: `approveAccessRequest` and `updateUserRole` were `upsert({ user_id })`. With the
  new key that would **insert a second role** and silently keep the old one, which is the widening this item fears. Both
  now go through `setMainRole`, which changes the one `is_main` row. `restoreUser` and `dismissAccessRequest` used
  `.maybeSingle()` on `user_roles`, which throws on two rows; they read the list.
- `src/app/admin/security/page.tsx` reads only the main row for the people table.
- `scripts/check-user-roles-aal2.mjs` upserted `on conflict (user_id)`; now `on conflict (user_id) where is_main`.
- Not changed because it cannot see two rows: `adminEmails` (Admin is main only), `access-requests.ts`
  (`select user_id` as a set), `loadDoctorLogin` (filters to one role key).

## Items this touches (not built)

- **Senior Staff role**: helped. A Senior Staff role can be given as an additional role without changing anyone's main
  role, and its cells and scopes merge by the rule above. Nothing in this schema decides what it can do.
- **Roles each shelter configures**: neutral. The helpers read `roles` columns, never role names (except Admin and the
  public viewer, as before).
- *The role picker lists every live role* is extended by `multi-role-build`; this PR does not touch it.

## Undo

Restore the helpers from `0178`/`0179`/`0180`/`0181`, delete any `is_main = false` rows, put the key back on `user_id`,
drop the four columns and the two triggers' new function. Safe at any point before `multi-role-build` lands.
