# One person, two roles: the app half

2026-10-14, `claude/multi-role-build`. Backlog: *One person, more than one role*, parts (2) to (4); part (1) was #620
(`docs/decisions/2026-10-14-multi-role-logins.md`). No migration.

## Where the union is computed

**In the database, once: `my_permissions()`.** Its `cells` and `scopes` are already the union of every live role, so
`can()`, the route registry, the left-hand menu (`NavPane` reads the same permissions) and every page guard are the union
with no change. The only addition on the TypeScript side is the list of role keys `my_permissions().roles` already
returned: `Permissions.roles` (main role first; one entry for almost everyone, and `[role.key]` if the database predates it).

Nothing recomputes a union in TypeScript. What is keyed on a **role** rather than on a cell uses that list:

- **Home** (`homeTilesForRoles`): each held role's home is drawn exactly as `homeTilesFor` draws it for a login holding only
  that role (its cards, else its jobs, else its curated home, else the derived one), against the union's cells, then joined
  main role first with a tile shown once. A tile therefore appears only if the union's cells cover it and its page opens,
  which is the database's answer, so it is never wider than what is enforced; and each role keeps its own tiles, so never
  narrower. One role gets precisely `homeTilesFor`'s answer (`scripts/check-multi-role-build.mjs`, hashed).
  One deliberate tidy: "Add photos" is the extra of a role with jobs and no medical photos job, so once any held role has that
  job it is dropped, or the maintenance side of a cover would have grown it.
- **Management keeps its curated home.** A Management login covering another role gets the curated Management tiles first
  (it is the main role) plus the other role's tiles. `check-home-screens.mjs` is untouched and still passes. Management as
  the *additional* role works the same way: its curated home is drawn for that role.
- **The manual and release notes** read a covering person as every audience they hold (`audiencesOf`), alongside the
  activity-based topics, which were already the union.
- **Recurring jobs and the rota.** `app_users` lists a person once, by their main role, so `held-roles.ts` reads the keys of
  every row in force today and `canDoJob` accepts a list: they can do the job when any of their roles can (`role_can()`
  answers each key). My tasks passes the reader's own `Permissions.roles`, the database's own list. The rota page and the
  actions fill `role_keys` from `user_roles` with the service role (only keys leave, for logins already named).
  **This is a second statement of "which rows are in force"**, because there is no database function that lists another
  person's roles. It mirrors `role_row_live()` (shelter date, `ends_on` inclusive). It only decides whom a picker *offers*;
  the work itself is still refused by the database, so if the two ever disagreed the failure is an offer that is refused
  or a missing offer, never access. A schema follow-up could expose `held_role_keys(user_id)`; not done, since this PR may
  not carry a migration.
- **Who does what** is open to anyone holding Management (`perms.roles.includes`), not only a main-role Management.

## How a cover ends

`ends_on` is the last day the role counts. Nothing runs at midnight: `role_row_live()` compares with `shelter_date()` on
every check, so it works all of the end day in Thailand and is gone from the first request of the next. Security hides rows
past their end, and lists covers ending in the next seven days above the table.

## Security

Add a role (role, optional last day) and Remove are server actions behind the same Admin + 2-step gate as every other
action here. Admin and the public viewer are refused with a plain message (the database refuses them regardless), as is a
second copy of a role already held, a last day before today (shelter date) and a person with no live main role. Removing
deletes the row; `audit_user_roles` (0195) records both, and `granted_by` says who gave it. Archive/restore already act on
every row of the login (`.eq("user_id")`). The role picker lists every live role except the person's own and Admin.

## Not done, on purpose

No card or grant changed (the set stays twenty-one) and no schema. Senior Staff and per-shelter roles are untouched; this
only makes "give someone a second existing role" possible. Extending a cover is Remove then Add; there is no edit-end-date
control yet.
