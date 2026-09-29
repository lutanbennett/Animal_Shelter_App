# 2026-09-27 — Refusing a page: `requireRole`, and `/no-access` rather than `/`

Backlog, "A refused page and a booked vet visit both dump you onto the public
website" (Pass 1, Vet). `/` has been the public home for everyone since
2026-09-26, so every guard's `redirect("/")` threw a signed-in user out of
the app with no explanation.

- **One guard for every role-gated page: `requireRole(allowed)`** in
  `src/lib/auth/require-role.ts`. Signed out → `/login`; a role `allowed`
  rejects → `refuse(role)`; otherwise it returns `{ supabase, user, role }`
  so the page does not look them up again. `requireManagementUser`,
  `requireAdminUser`, `/stocktake` and `/deliveries` now all go through it.
  **Later guards (the vet's-world item, recurring jobs) call this — or
  `refuse(role)` where the page already has the role — and never
  `redirect("/")`.**
- **Refused app users go to `/no-access`, a page inside the app**, not to
  `/my`. A silent bounce to My tasks would look like a broken link — the
  tester tapped Stocktake and got a to-do list. The page says what happened
  and offers My tasks. It is a redirect rather than rendering in place,
  because Next's `forbidden()` (which would keep the URL and send a 403) is
  still behind the experimental `authInterrupts` flag, and an experimental
  flag on the OpenNext/Workers build was not worth a small fix.
- **A non-app role is sent where `signedInLandingPath` sends it** — `/` for
  a public viewer, which is correct for them and only for them. The request
  proxy already catches a public viewer before any page guard runs, so this
  branch is a second line, not the main one.
- **Server actions keep throwing or returning their refusal**
  (`assertManagementRole`, `assertAdminRole`). A redirect from inside a form
  submission is not a refusal anyone reads.
- **Booking a vet visit** returns to `/residents/<id>/vet-appointments` for
  one resident (the new visit is listed there, as the edit form already
  does) and to `/residents` for several — the list a bulk booking starts
  from. There is no per-visit page to land on.
- The sweep found one more `redirect("/")`: `requireAdminUser`, which every
  `/admin/*` page uses. Fixed the same way.
- **Doctors become a list per clinic that fills itself, and a vet account records its clinic (2026-09-27):**
  `0102_vet_doctors_and_vet_accounts.sql`. This reverses the 2026-09-24 free-text
  entry above, and the reversal is Lutan's decision, made after an investigation.
  **Why now:** the cost of staying on free text grows with every name typed
  ("Somchai" and "Dr Somchai" can't be counted together, and a typo can't be
  fixed once), while switching has never been cheaper. On dev only 1 of 75
  visits had a doctor, and the AppSheet import never carried any. The
  deciding question was whether the shelter would keep a 20-name list per
  clinic up to date. The answer is that nobody has to: a
  `vet_appointments` trigger links every typed `doctor_name` to that
  clinic's `vet_doctors` row, adding one if needed. Every writer gets the same
  rule, as with 0074's trim. Same doctor means the same name ignoring case
  and runs of whitespace (`vet_doctor_key`, backing a unique index). Titles and
  punctuation are not guessed at: `merge_vet_doctors` is the fix for
  "Somchai" / "Dr Somchai". **`doctor_name` stays, and follows the list's
  spelling** on linked visits, and a rename is written through. So every page
  that shows `doctor_name` stays correct without knowing `doctor_id` exists,
  and a visit with no clinic keeps its free text. Rename and merge turn the
  0026 deceased-record lock bypass on for their own single UPDATE and then
  restore it. That UPDATE touches only the doctor columns: a label
  correction, not a clinical edit. A visit's doctor must belong to the
  visit's clinic, enforced by a composite foreign key
  `(vet_id, doctor_id) → vet_doctors (vet_id, id)`. A doctor who has visits
  cannot be deleted, only merged or made inactive. `schedule_bulk_appointments` gained
  `p_doctor_name` (last, default null), as the 2026-09-24 booking entry asked
  "the next time a schema PR touches vet visits". Booking with a doctor is now
  one transaction once the form passes it. **Vet account → clinic** is a
  separate change: `user_roles.vet_id`, allowed only for role vet (check),
  cleared by trigger when the role changes (so the existing role-change
  upserts in `/admin/security` don't start failing), and
  `current_user_vet_id()` for RLS, security definer like
  `current_user_role()`. It sits on the account rather than on a doctor
  because a clinic login may be a nurse or the front desk. Linking an
  account to a particular doctor waits for the "vet sees only their clinic's
  residents" item to decide whether the scope is the clinic or the doctor.
