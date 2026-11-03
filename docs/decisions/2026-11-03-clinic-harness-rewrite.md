# The three clinic/doctor harnesses now assert cards; `loadClinicScope()` is a constant

Stream `clinic-harness-rewrite`, 2026-11-03. No migration, no policy change, no card. Follows
`2026-11-02-clinic-scope-inert.md` (the verdicts, not re-opened) and `2026-11-03-doctor-name-follows-cards.md`.

## The red list, before any change (dev, 2026-11-03)

| Harness | Red | Kind | Assertion (before) |
|---|---|---|---|
| `check-clinics-readonly` | `setup`: doctor login "not at its own clinic" | **Harness asserts the retired model** | `check-clinics-readonly.mjs:117` `v_own = any(current_user_clinic_ids())`; C also asked for `doctor_read_clinics`, dropped by 0264 |
| `check-doctor-multi-clinic` A | moving a visit gave `-1` | **Harness depended on a role's card state** (see below), not the retired model | `:168-172` |
| `check-doctor-multi-clinic` C, D, F | not reached (A failed first); read by hand | **Harness asserts the retired model** | C `:224-246` (clinic lists, per-clinic resident reach), D `:250-279` (booking refused at C), F `:303-312` (doctor login fenced to its clinics) |
| `check-doctors` `behaviour` | printed `HARNESS-OK` as an error | **Reporting bug, not a red**: the section passed; the harness ends in a deliberate `raise exception`, and the runner printed the database's HTTP 400 text raw | runner at the foot of the file |
| `check-doctors` `rls` | `42501` on `doctors` | **Harness asserts a model that stopped holding at 0182**, and no app change can fix it (#1230): it inserts into `clinic_visits` in SQL as a book-only login, so it never meets the form | `:214-217` "management booking adds the doctor" |

So the item's "all three red" is true, but one of the five sections was a passing section mis-reported.

## What each harness asserts now

All three build their actors from **harness roles holding exactly the cells under test** (rolled back with the
transaction), never from the real doctor or management roles, whose cards change.

- `check-clinics-readonly` (green on first run): every policy on `clinics` asks `has_permission('clinics.list')` and
  nothing narrows by clinic or role key; `clinics.list` at read reads all and writes nothing; at edit it
  inserts/updates/deletes; a login without the card reads none; admin and the service role write.
- `check-doctors` `rls`: a login holding `visit.book` **without** `clinics.doctors` is refused `42501` by a direct SQL
  insert whose typed name would add a doctor (the true statement #1230 pointed at), and is **not** refused when the
  name exists or the doctor is chosen by id; with `clinics.doctors` it adds and renames. Volunteer and anon checks
  kept; the anon `current_user_clinic_ids()` grant check was **replaced** (anon cannot book a visit) because it
  asserted a dead helper's grant.
- `check-doctor-multi-clinic`: A, B, E, G, H kept (E accepts `0` rows as well as `-1` for a login lacking
  `clinics.doctors`, as its management lines already did). **C** now asserts `current_user_clinic_ids()` is `{}` for
  every login and that residents follow `resident.record` alone: linked and unlinked doctor logins all see all three
  residents, an inactive link changes nothing, a login with no cards sees none. **D** asserts insert asks `visit.book`
  and update asks `medical.visits` with no clinic term (booking, editing and moving a visit at a clinic the login's
  doctor does not work at all succeed), no delete policy, no cards means no booking, and the doctor-at-clinic
  guarantee is still a foreign key. **F** asserts doctor writes ask `clinics.doctors` with no clinic term and a
  login-linked doctor's links stay admin-only. The old C/D/F assertions that said a clinic fenced a doctor login are
  false after 0264/0182; they are replaced by the true statements above, not deleted to go green.

All three print `PASS <name>: <evidence>` or `FAIL <name>: <message>` through `scripts/lib/rollback-harness.mjs`.

## Section A of `check-doctor-multi-clinic`: cause ESTABLISHED

Moving a visit to another clinic re-resolves its typed doctor name there (`clinic_visits_link_doctor()`, 0172:414,
security invoker) and, finding none, **inserts a doctor**. That insert asks `clinics.doctors` (`doctors_insert_perm`,
0182:54), which the real management role on dev did not hold, so the whole update failed `42501` (`-1`). Same
mechanism as `check-doctors` `rls`. Shown, not inferred: giving the harness actor exactly the cells (including
`clinics.doctors`) turned A green with the assertion unchanged. It was **not** the retired model.

Finding for the planner: that trigger insert is a second place a login without `clinics.doctors` is offered an action
the database refuses (#1230 fixed the booking form; the visit-edit change of clinic is the sibling). Not
investigated further. Also: the trigger finds an existing doctor through `doctors_select_perm` and
`doctor_clinics_select_perm`, which ask `clinics.list` at read, so a login with `visit.book` but not `clinics.list` is
refused even for an existing name.

## `scope.ts`: a constant, not a deletion

Read all importers. **Eight files use it in code** (`appointments/page`, `NavPane`, `residents/page`,
`clinic-visits/new/{page,actions}`, `clinic-visits/[id]/page`, `clinic-visits/[id]/edit/{page,actions}`); the
brief's other two, `ClinicVisitForm.tsx` and `ClinicVisitEditForm.tsx`, only name the file in a comment. Every use is
a `kind === "clinics"` or `"unlinked"` test that can never be true, and the loader made two queries per page to
return `any`.

`loadClinicScope()` is replaced by `export const ANY_CLINIC_SCOPE`, and each call site swapped; nothing else changed.
**Deletion would not widen anything** (a dead branch removed shows what the live branch showed), but it means
rewriting the locked modes of `ClinicVisitForm`, `ClinicVisitEditForm` and `DoctorNameField`, the whole
`/appointments` page, and it leaves orphan strings in the dictionaries, which stream 5 owns this batch. A constant is
correct now and makes the follow-up a pure deletion.

**Found, not fixed:** `/appointments` always shows its "unlinked" message and `NavPane` never draws that link (it
falls to `/upcoming-visits`), because both required `kind === "clinics"`. The page, the dead branches in the visit
forms and the residents scope note, and their dictionary strings, can all be deleted. For the planner to file.

## Not settled

- Browser: admin session only (`dev-signin.mjs admin`). Clicked through to `/residents` (214 rows, no scope note),
  the nav links, `/operations` -> `/upcoming-visits` -> `/clinic-visits/new` (10 clinics offered, no lock). A one-card
  login was not driven; `/appointments` and the visit detail and edit pages were not opened.
- The harness fixes rely on custom roles being insertable inside the rolled-back transaction, as the old clerk fixture
  already did.
