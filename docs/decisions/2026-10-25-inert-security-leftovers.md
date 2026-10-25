# The inert leftovers of coded security are deleted (migration 0264)

Lutan, 2026-10-25: step 4 of 4, after #935, #936 and #937. Seven functions answered a constant and about 140 policy, view and
function clauses still called them; five columns on `roles` were read by nothing. This changes **no access**: every function
removed already answered `true` or `false`, so each clause is replaced by that constant, simplified away.

## What was dropped

- **Functions:** `is_clinic_login()` (false), `on_volunteer_floor()` (false), `photos_medical_only()` (false),
  `sees_all_clinical()`, `sees_all_residents()`, `sees_all_contacts()`, `may_open_resident_record()` (all true).
- **Columns on `roles`:** `opens_app`, `scope_residents`, `scope_clinical`, `scope_contacts`, `scope_photos`.
- **`PUBLIC_VIEWER_ROLE`** in `src/lib/auth/app-access.ts` (nothing imported it) and its registry record.

## Policies: 60 dropped, 48 rewritten

Measured on dev after `0263`, from the **live** definitions (not from the migration files; `0224` rewrote guards in place).

- **60 dropped.** Every one is a `doctor_*` policy, permissive, and granted only through `is_clinic_login()`, either alone or ANDed
  with clinic-scope helpers. A policy that ANDs a constant `false` grants nothing, so dropping it changes nothing. The migration
  generator asserted that each dropped policy is named `doctor_*` and mentions `is_clinic_login`, and that no card policy mentions it.
- **48 rewritten** with `alter policy`. Each was `has_permission(...) AND sees_all_*()`; the card check stays, the constant `true`
  goes. Nothing ORed `is_clinic_login()` with a card check, so there was no case where a card check had to be kept beside a dropped one.

## Views (10) and functions (11)

- Views: the six that #937 gated lose the dead `on_volunteer_floor()` / clinic-login terms **beside** the `private.works_with_*()`
  gate, which stays (checked per view: the call is outside the clause removed). `private.app_users` now shows `u.email` plainly (the
  CASE only hid it from a clinic login or the volunteer floor, both false) and loses the clinic-login narrowing. Four medical list
  views lose `sees_all_clinical()`. Grants are restated because the migration-grants check requires it; they are the grants the views
  already had (`authenticated`, `service_role`, select).
- Functions: the photo and resident-photo guards, `set_resident_microchip`, `merge_doctors` and `set_resident_drive_folder` lose the
  dead terms. `current_user_clinic_ids()`, `current_doctor_resident_ids()` and `clinic_login_may_edit_doctor()` read
  `is_clinic_login()` and so answered a constant; they now say so (`'{}'`, `current_clinic_resident_ids()`, `false`).
- **Not touched, as the brief says:** the four `private.works_with_*()` functions and `has_app_access()` / `holds_app_role()`.
  The Admin short-circuit is unchanged.

## What the brief did not name

1. **`src/lib/residents/who-and-where.ts` called two of the dropped functions** (`on_volunteer_floor`, `may_open_resident_record`) by
   `rpc`. They are now plain constants (`false`, `true`) with no database call. The `limited` branches they feed (about ten files:
   the residents list and export, the enclosure pages, the resident card) are still there and still dead. Removing them is a
   follow-up, filed on the backlog; it is app code with its own tests and did not belong in a PR that changes no access.
2. **The hard-coded-security check refused two of my rewritten functions.** `current_user_clinic_ids()` and
   `current_doctor_resident_ids()` were `security definer` and now call no card or Admin function. They are plain `stable` functions
   now (they only wrap other functions or a constant, so definer was doing nothing).
3. **A dead cluster remains.** `current_clinic_resident_ids()`, `clinic_login_owns_visit()`, `doctor_can_write_attachment()` and
   the three helpers above existed for the clinic-login policies. Nothing in the database calls most of them now; `src/lib/clinics/`
   still reads some. They are not stubs of the seven and were left alone; worth a look when the clinics code is next touched.
4. **Harnesses.** About thirty check scripts inserted into the dropped columns or called the dropped functions. The inserts were
   trimmed to the surviving columns, the assertions about the volunteer floor, clinic-login agreement and `scope_*` values were
   removed (they asserted behaviour that left in `0259`), and `dev-signin.mjs` and `scripts/lib/old-role-shim.mjs` were updated.
   A few of these harnesses replay old migrations and were already stale; I made them run, not meaningful.
5. `scripts/check-no-role-column-security.mjs` keeps its six hard-coded column names. They are now a "must never come back" list and
   still correct. Deriving the list from `information_schema.columns` would not help (the columns it must catch are the ones that no
   longer exist), so I left it.

## `roles.show_menu`

Kept. It is layout by `CLAUDE.md`'s own test, `true` for every role on both databases, and reversible role by role. Whether to keep it
or fold it into a card is Lutan's call; it does not block anything.
