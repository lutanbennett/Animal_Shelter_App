# Part 10: per-shelter roles (`#omt6u`), and what to do with `card_grants` / `card_includes`

**Step zero.** The Who does what screen already lets a shelter add a role and set its cards, and it already resolves the shelter it
serves (`shelterId` on every role read; `role_cards`, `role_permissions`, `role_groups`, `user_roles` all carry `shelter_id`; `0387`
made `roles.key` unique per shelter and Admin one per shelter). Creating a role takes its shelter from the request header (column
default). What was missing was not a surface but three database paths that wrote **without** a header and so broke under `0397`'s NOT NULL.

## Decision: `card_grants` and `card_includes` stay shared and are NOT split

The registry said they "hold assignments as well as definitions". **They do not.** `card_grants` is `(card, activity, level)` and
`card_includes` is `(card, included_card)`; neither has a role column. A role's assignment is `role_cards` (shelter-scoped) and its
derived cells are `role_permissions` (shelter-scoped). So there is no second job to separate: they are pure catalogue, identical for
every shelter, and adding `shelter_id` would invent per-shelter card definitions nobody asked for. The registry notes are corrected
and no longer point at `#omt6u`.

**Found, not fixed (for the planner to file):** both tables' policy is `is_admin()` for all, and `is_admin()` is any shelter's Admin.
No screen writes them, but a second shelter's Admin could in principle edit what a card grants for everyone. Narrowing writes to the
service role is its own small change.

## What changed
- `0401`: `recompute_role_permissions` stamps `role_permissions.shelter_id` from the role, so a recompute with no header (migration, job)
  no longer fails.
- `0402`: `record_audit` falls back to `current_shelter_id()` when the audited row has no shelter (the catalogue tables).
- `check-card-grants.mjs` stamps a shelter on its throwaway rows and sets the shelter header for its rolled-back transaction (`#cgrnt`).

## Proof (dev, rolled back)
A second shelter was inserted in a `begin … rollback`: shelter one's role count was unchanged (115 → 115); a role keyed `volunteer` in
shelter two coexisted and held 0 cells; a role keyed `kennel_lead`, a key the code has never seen, holding only `my_tasks`, held
exactly `recurring.do_own`. No second shelter was left behind.
