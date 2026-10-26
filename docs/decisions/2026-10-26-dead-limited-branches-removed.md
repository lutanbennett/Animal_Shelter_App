# The dead `limited` branches are deleted (2026-10-26)

Backlog item: "Delete the dead `limited` branches left behind by the stub removal". Stream `limited-branches-cleanup`.

**What changed.** `readsWhoAndWhereOnly()` was a constant `false` and `mayOpenResidentRecord()` a constant `true` since `0259`/`0264`. Both are gone, and so is every branch they fed: the residents list and export (`limited` through `list-view.ts`, `ResidentsTable`, `exportScope`), `loadOccupants`, the enclosure page's second read, the card landing's `whoAndWhereOnly` input, the record hub's redirect to `/r/` and its `readOnlyExceptMedical` mode, and `requireFullResident`'s `allowMedicalCard` option. In each place the live `else` path was kept and un-nested. The condition was never negated or combined with anything else, which was checked at each call site (`src/app/residents/[id]/page.tsx`, the one the item did not name, redirected on `false && ...`, so that line could never run).

**Changes no access.** Every deleted branch was guarded by `false`, so no login's path through the code moved. `check-permission-catalogue.mjs` pinned the hub guard as `allowMedicalCard: true` and checked the order of the dead redirect; both pins are updated or removed. `resident_who_and_where` stays: the resident card and the pickers still read it.

**Also removed** because only the dead branches used them: `asListRow`, the `searchPlaceholderWhoAndWhere` strings (en and th), and `WHO_AND_WHERE_COLUMNS` as an import of `list-view.ts` (the constant itself stays for `/r/[code]`).

**The clinic-login cluster was looked at, not deleted.** The six are database functions, so dropping them needs a migration, which this stream may not write.
- `src/lib/clinics/scope.ts` is **not dead**: `loadClinicScope` calls `current_user_clinic_ids()` and is used by `/residents`, `/appointments`, `/clinic-visits/new`, `/clinic-visits/[id]/edit` and their actions. It stays.
- In the database, `grep` over `supabase/migrations/` finds all six redefined in `0264` as plain functions; `current_user_clinic_ids` is also called by the app (above), and `current_doctor_resident_ids` by `src/lib/clinics/appointments.ts`'s comment only. Whether any live policy still calls the other four was not established here. Filed as a backlog item for a schema PR to settle with a pg_policies/pg_proc read of production, not a grep.

No role was named, no card created or changed, and the `perms.isAdmin` short-circuit is untouched.
