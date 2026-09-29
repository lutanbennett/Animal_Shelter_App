# 2026-09-25 — Internal views need a staff role, not a session (`0086_app_access_gate.sql`)

The audit for the public viewer found that "no named role means no access"
held for every table but not for six views. `app_users`, `current_placement`,
`resident_current_state`, `immunization_compliance`,
`immunization_duplicate_check` and `translation_queue` run as their owner, so
RLS never applies under them. Each is granted to `authenticated`, which covers
any session with a JWT. On dev, a throwaway archived login and a login with no
role each read 58 `translation_queue` rows, 81 placements, 81 resident states
and 220 immunisation-compliance rows. `app_users` filtered on "has a role",
so archived logins saw nothing there, but a public viewer has a role and would
have read every staff name and email. `translatable_fields` was open to
`auth.uid() is not null`. So this was a live gap for archived logins, not only
a future one for public viewers. Archiving someone who has left did not
stop them reading those views with a session they already held.

- **Moved, not filtered in place.** `current_placement` and
  `resident_current_state` are what the `public_*` views are built on, so a
  "caller is staff" filter inside them would have emptied the public site for
  anon and the public viewer. As `0082` did for `approved_translations`, the
  six move to `private`, which the Data API does not expose. Dependents follow
  them by oid, so the public site reads exactly what it did. `public` gets a
  view of the same name over each one: `select * … where
  private.has_app_access()`, with `security_barrier`. The app and the SQL
  functions that name these views needed no change.
- **An allow-list, not "anything but public_viewer".** `has_app_access()` is
  true for admin, management, staff, vet and volunteer. A role added later
  starts with no access until someone decides otherwise, as RLS does. Callers
  that are not Data API sessions (service_role, postgres in scripts and
  definer functions) pass.
- **Not `security_invoker`.** That would make vets and volunteers see these
  views through RLS, which is `0081`'s deferred behaviour change. Staff read
  exactly what they read before: the harness checks this on every object.
- **Editing one of the six from now on** means changing `private.<name>` and
  then re-creating the `public` one as the same gate, because `select *` is
  expanded when a view is created and would not show a new column otherwise.
  `check-migration-grants.mjs` (`npm run lint`) fails a later file that
  re-creates one of the six in `public` without the gate. `translation_queue`
  has been redefined four times, so this was going to happen.
- **Left as they are:** `resident_is_deceased` and `attachment_resident_id`
  (security definer, callable by any signed-in session) answer a boolean or an
  id for a row id without a role check. `0082` kept them callable, and the
  lock triggers use them. `cashflow_forecast` and the two forecasts it calls
  are invoker, so a non-staff session gets the month grid with every amount 0.
- Evidence: `scripts/check-app-access-gate.mjs`, a rollback harness on dev.
  It creates throwaway staff, archived, role-less and public_viewer logins
  (the last one once `0085` is applied) and compares them with anon, before
  and after the migration, on 18 internal objects and 13 public ones. With the
  migration left out, it fails on each of the leaks above.
