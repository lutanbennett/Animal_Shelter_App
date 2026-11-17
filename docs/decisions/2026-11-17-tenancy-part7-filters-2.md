# Part 7 second half, second slice: Group A, the admin screens (#ps6ms)

**Status: Group A done; `#ps6ms` stays open. Groups B (storage and media) and C (clinics calendar, merch) are not started.** 27 sites are still `needs-shelter-filter`, read from `docs/service-role-sites-registry.json` after this change.

## Shape of the filter (same as slice one)

The service role is a trusted caller, so every read names the acting shelter itself with `.eq("shelter_id", …)` from `actingShelterId()`. No shelter means no rows (a nil UUID where a query must still be built).

## What was filtered

- **`/admin/recent-changes`** and **`/admin/security`**, the two sites the tenancy spike named: the login list now comes from the new `listUsersOfShelter()` (`src/lib/auth/access-requests.ts`): logins holding a role in the acting shelter, plus logins holding no role anywhere (access requests belong to no shelter yet, the same rule as `userInActingShelter`). The Security page's `user_roles`, `clinics`, `doctors` and role-option reads each carry `.eq("shelter_id")`.
- **`openSetupForNewAdmin`** and **`loadDoctorLogin`** refuse a login outside the acting shelter (`userInActingShelter`).
- **Who does what** (page, details): role, role_cards, role_permissions, role_groups and user_roles reads are filtered by the acting shelter, and `loadRoles()` / `holderNames()` are too. Roles are per-shelter rows today, so filtering now is correct, and Part 10 (`#omt6u`) does not need to undo it.

## Judgement: cross-shelter

- **`who-does-what/features/page.tsx`** reads only `features` and `card_features`, the shared card catalogue. Neither has a `shelter_id` column, so there is nothing to filter. Recorded `cross-shelter` with that reason. The same two tables are also read unfiltered in `who-does-what/page.tsx`, which is otherwise `filtered`.

## Not done

Groups B and C (see the registry). No migration, no backlog edit.
