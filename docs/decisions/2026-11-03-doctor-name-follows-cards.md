# The doctor name on a clinic visit follows the `clinics.doctors` card

**Backlog item:** "A LIVE BUTTONS-FOLLOW-CARDS FAULT: A LOGIN THAT MAY BOOK A CLINIC VISIT BUT MAY NOT ADD A DOCTOR..." (`## Security`). Ticked.

## The activity the write really asks (deliverable 1)

`clinics.doctors`. Read from the database, not the item's word:

- `supabase/migrations/0182_perm_policy_cleanup.sql:54-56`: `doctors_insert_perm ... with check (has_permission('clinics.doctors'))`, and `doctor_clinics_insert_perm` just below it asks the same.
- `supabase/migrations/0172_clinics_and_doctors.sql:414-465`: `clinic_visits_link_doctor()` is `language plpgsql` with no `security definer` (invoker), and does `insert into doctors (name)` and `insert into doctor_clinics` when a typed name is new. So the insert runs as the caller.
- The booking action (`src/app/clinic-visits/new/actions.ts`) asks only `visit.book`; the edit action (`[id]/edit/actions.ts:52`) asks `medical.visits`. Neither asks the activity that the trigger needs, which is the fault.

The edit form has the same free-text field and the same trigger, so it is fixed too.

## Shape chosen (deliverable 2)

`DoctorNameField` takes a `canAddDoctor` prop that **defaults to false** (the pattern `CLAUDE.md` names). The two pages pass `can(perms, "clinics.doctors")`. Without it the field is a `<select>` of the clinic's existing doctors plus "No doctor recorded", with no free text. On the edit form a name already on the visit that is not on the list stays as a choice so editing does not drop it. I chose the prop over merely hiding the input because a caller that forgets offers nothing. The database policy, the trigger and the actions are unchanged; no migration.

## What the one-card runs showed (deliverable 3)

Dev, port 3001, fetching `/clinic-visits/new` with each disposable login:

- `--cards book_clinic_visits`: a `<select id="doctorName">` and the chooser hint; no `<input id="doctorName">`.
- `--cards book_clinic_visits,contacts` (`contacts` carries `clinics.doctors`): the free-text `<input id="doctorName">`; no select.

Not done: pressing Save as the second login to land a new doctor. The page was checked from its rendered HTML, not driven in the pane. The save path for a holder of `clinics.doctors` is the one that already worked.

## `check-doctors.mjs` (deliverable 4)

Still red in its `rls` part, with the same `42501` on `insert into doctors`. That is expected and is **not** a sign the fix failed: the harness inserts into `clinic_visits` directly in SQL as a login with only `visit.book`, bypassing the form, so it will keep meeting the (correct, unchanged) policy. It cannot pass for the right reason until batch 2's `clinic-harness-rewrite` makes it assert that the form offers no free text, or that the refusal is the intended one. Not edited here.

## Login-linked doctors (deliverable 5)

`loginLinksAdminOnly` ("only an admin can change where they work or merge them") is **correct; Admin is the rule, sentence left alone.** The policies on `doctor_clinics` for update and delete (`0147_perm_convert_people.sql:242-254`, carried over by the table rename) require `has_permission('clinics.doctors') AND NOT EXISTS (doctor with user_id not null)`: no card ever passes for a login-linked doctor. Only the Admin policy `admin_all_doctors` (`is_admin()`, named in `0273_drop_dead_doctors_policies.sql:7`) does. Admin sits outside the card system, so no card label belongs in the sentence.

## Second instance (deliverable 6) — for the planner to file

`src/app/assistant/actions.ts:230` calls the same `schedule_bulk_appointments` with `p_doctor_name: input.doctorName`, gated by `assistant.record`. A login holding that card but not `clinics.doctors` and giving a new doctor's name would hit the same `42501` through the same invoker trigger. Not fixed here. Not established whether the assistant offers a doctor name to such a login.

## Not established

Whether any real login is affected today (depends on transient card assignments).
