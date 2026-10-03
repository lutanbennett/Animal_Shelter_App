# 2026-10-03 — New roles are configured roles, not new `app_role` enum values

**Lutan, 2026-10-03, in chat: "Decision: Lets do Configured roles."**

**The fork.** The backlog item *The roles the shelter actually has, from the
Director* (Auth) asked whether Maintenance and Medical should be two new values
of the `app_role` enum, each a two-file migration, or roles configured in the
permissions matrix of *Roles and permissions each shelter configures*
(Architecture), and said to decide which with Lutan rather than do both. His
answer of the same day that the 2IC is separate from Management made it a
question about three roles: the 2IC, Maintenance, Medical.

**Decided: configured roles.** Each new role is a row in a `roles` table with
its own cells in `role_permissions`. No value is added to `app_role`, and no
enum migration is written for any of the three.

**What the decision carries with it, because it cannot be done without it.**

- **The permission tables are built.** A configured role needs `roles`,
  `role_permissions`, the activity catalogue and one function that every policy
  can ask. So the Architecture item's matrix goes ahead, in the stages that item
  already names: the catalogue and enforcement first with behaviour unchanged,
  then the Settings screen, then roles a shelter adds for itself.
- **Senior Staff is not an enum value either.** If that item is kept at all, it
  is a configured role. Whether to close it is still Lutan's call.

**What it does not decide.** The details in `docs/roles-and-permissions.md` that
he has not ruled on stay proposed, and that paper's §17 lists them: that default
cells are what the screens offer today, with the wider database grants closed as
tables are converted; the live `has_permission()` lookup over the token hook;
one login for the Director with the home screen following the device; `0132` as
the permission tables; and the order in which the roles are built. None of them
holds up the first piece, and the first three are settled in practice when its
schema PR is reviewed.

**Why, as it was put to him** (the paper's §16 has the counts):

- An enum value is a two-file migration, since a new value cannot be used in the
  transaction that adds it, and then a policy for the role on nearly every one
  of 47 tables, because policies are written one per role per table. The five
  existing roles have 40 to 64 each. Three roles is on the order of 150 to 190
  new policies, plus 15 functions, 10 views, 14 predicates and 16 role lists to
  review so that no new role can do less than it should by omission.
- All of that would be written to be removed. The Architecture item says so in
  terms: a new enum value "later has to be migrated out".
- The enum's one advantage was speed, about a batch. Taking the work role by
  role (Lutan's instruction of the same day) removes most of it: after a
  foundation, each role gets its real database boundary in its own slice, and
  until then nothing any of the three people need is blocked, because the logins
  they hold today can already do their jobs.
- Lutan's answers make the three roles far narrower than staff or management. A
  configured role starts from the narrowest rights in the system and is granted
  only its own job, so a mistake shows as a refusal. An enum value added to
  dozens of lists by hand fails the other way.

**What was given up.** Roles that are real in the database about a batch
sooner. And the simpler alternative that would have been right if shelters were
never going to define their own roles: three enum values and pages named for
roles.
