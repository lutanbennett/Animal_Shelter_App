# Role archiving removed (`roles.archived_at`, migration 0272)

**Decided 2026-10-27 by Lutan.** He asked: *"Do we need a archiving feature for roles or can they just be deleted? the reason that
the retire was built was that I was advised it was required for the audit log but that appears to not be the case"*, was told it is
not, and said *"Yes, add the delete role button to the backlog"*. Nothing was left to decide. This is the **schema half** of that item;
the Delete role button is `claude/role-delete-app` and is **not** built here.

## Why archiving was never needed

`audit_log` has no foreign key to `roles`. It stores `actor` (a person, never a role) and full `old_row`/`new_row` copies, so a deleted
role's own DELETE is logged with its name and contents, and Recent changes reads names from those copies. `0173` archived Staff to keep
`user_roles.role_id` valid for ended logins; its header's "history in audit_log stays readable" was never a dependency.

## What 0272 does

Every reader is rewritten first, **from the live function bodies on dev** (not the older migration files), then the column is dropped.
After `0270` no role was archived (dev: 0), so every `r.archived_at is null` filter was already true; removing it changes no answer.

| Reader | What happened |
|---|---|
| `has_permission`, `is_admin`, `holds_app_role`, `my_permissions`, `reassign_recurring_job`, `role_can` | filter removed |
| `roles_guard_fixed` | the "or archived" test removed (a fixed role could never be archived; now nothing can be) |
| `set_role_cards` (the function **0222** changed) | the "retired roles do not approve photos" join filter removed. **Rewritten, not dropped:** `0222` was never a separate function, just two lookups inside `set_role_cards`, and the rest of the function (last-approver refusal, card closure) is still wanted. With no retired roles there is nothing to exclude. |
| `user_roles_take_live_role` (`0173` trigger) | **dropped**, trigger and function: its only job was refusing a retired role |

No view, policy, index or constraint read it (checked on dev: `pg_depend`, `pg_policies`, `pg_views`, `pg_indexes`, `pg_constraint`).

## THE TWO-COLUMNS TRAP — read this before you grep

**There are two different `archived_at` columns and only one of them went.**

- `roles.archived_at` — removed. Marked a *role* as retired.
- `user_roles.archived_at` — **stays**. Marks a *person's assignment* ended. `0270`'s guard (refuse deleting a role while a live login
  holds it) depends on it, and so will the Delete role button.

A plain `grep archived_at` returns ~57 migrations (it is also on `weight`, `prescriptions`, `clinic_visits`, `contacts` …) and is useless.
Search on `r.archived_at` / `roles.archived_at` / `from("roles")` **and read the live function bodies**: a multi-line supabase-js query
(`.from("roles")` … `.is("archived_at", null)` on a later line) is missed by a single-line grep. Four app readers were found only by
running the pages after the apply (`src/lib/home/roles.ts`, `src/app/admin/who-does-what/roles.ts` and `actions.ts`).

## App and script readers

Each filter excluding retired roles became **nothing**: there is no other thing to filter on. `approvers.ts` lost its `archived` field
(and its test case); the Security screen lost the "retired role shown, never offered" branch and the `retiredRole` message; the
`archived-role-references` read-only check was deleted (nothing it asked can exist); `check-staff-retired.mjs` was deleted (Staff has been
gone since `0270`). Harnesses that set `roles.archived_at` to test the behaviour had that section removed.

## Hard-coded-security check

`check-hard-coded-security.mjs` flags any migration from `0262` that re-declares a function reading a role by key or a definer function
not calling a card/Admin function. Five of the rewritten functions trip it, so they are **declared** in the registry with reasons. They
are not new rules: the only role-key read is the Admin short-circuit `r.key = 'admin'`, which sits outside the card system, and
`role_can` reads the key it is asked about. The check still ends `no coded security outside the Admin bypass`.
