# 2026-09-24 — Frequencies move to Settings; the policy stays

`/admin/frequencies` is the frequency list's own page, beside procedure and
blood-test types, and `/management/medications` is medications only. The
move is the page, the actions and the text (`admin.frequencies` in both
dictionaries); `FrequencyScheduleFields` and `parseSchedule` stay shared
because the prescription form's inline add still uses them.

- **The actions are admin-only now** (`assertAdminRole`), matching the page
  guard, as on every other Settings page. The management-gated frequency
  actions are deleted, not left behind.
- **The database policy is unchanged, on Lutan's call.**
  `management_rw_frequency` (0043) still gives management update and delete
  on `frequency`, though no page offers it any more. The backlog item left
  "revoke it or keep it" open. Lutan answered it two ways during the day, and
  then settled it in this stream's session: leave the RLS alone. So there is
  no migration. If it is ever revoked, the file drops `management_rw_frequency` and recreates
  `management_insert_frequency` (`for insert with check (current_user_role()
  = 'management')`). That keeps management's policy count equal to staff's,
  the invariant 0039's mirror block asserts.
- **Revoking management alone would not make the list "set up once".**
  Staff and vets insert through `staff_insert_frequency` and
  `vet_insert_frequency` (0027), which the prescription form's "+ Add new
  frequency…" uses. Admin-only additions would mean removing that inline
  add, a UI change as well as a policy one. That is a different decision from
  the one the backlog item asked.
- **No `refresh()` in the actions.** `/admin/procedure-types` calls it after
  each action because of a stale-row report that #88 closed as not
  reproducible. The frequency actions came across without it, and in
  testing a deleted row left the table without a reload. A merge I checked
  after 5 seconds still showed the row, but its request took 5.2 seconds on
  a cold dev server, so that says nothing either way.
