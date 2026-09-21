# Decisions log

Tracks answers to the open questions raised in
[`requirements/lanna-care-rebuild-requirements.md`](requirements/lanna-care-rebuild-requirements.md)
Section 11, plus decisions made during setup that aren't in the original doc.

## Confirmed

- **Maintenance jobs are assigned to a login, not a contact (2026-09-21):**
  the first cut wired `maintenance.assigned_to` (a contacts FK from 0001)
  to a picker of every contact. The user's correction: whoever actions a
  job is staff, a volunteer or management — people with logins — never a
  carer or a supplier, who are what the contacts table is for. 0055
  replaces the column with `assigned_user_id` → auth.users (on delete
  set null, so removing an account unassigns rather than blocks) and
  adds the `app_users` view (auth.users ⋈ user_roles, gated on the
  caller holding a role) so the picker and the names on the board work
  without the service role. Vets are excluded from the picker. Contacts
  therefore no longer carry a jobs count or a delete blocker for jobs.

- **The must-change-password flag lives in app_metadata and is enforced
  by the request proxy (2026-09-21):** the backlog suggested
  `user_metadata.must_change_password`, but user_metadata is writable by
  the user through `auth.updateUser()`, so a flag there could be cleared
  without ever setting a password (verified against the dev project: a
  signed-in user's `updateUser({ data })` cannot touch app_metadata).
  app_metadata is service-role only, so the flag is set by the admin
  actions that mint a temporary password and cleared by
  `/account/password` through the admin client, only after the user's
  own `updateUser({ password })` has succeeded. Enforcement sits in
  `updateSession()` beside the sign-in gate: a flagged user whose access
  token's `amr` claim includes `password` is redirected to the change
  page from every non-public path; a Google session (`amr` = oauth) is
  left alone, since no password was used and there is nothing to
  replace. The token is decoded, not re-verified, for that one claim —
  getUser() has already validated the session on the same request. The
  temporary password itself is never stored or shown twice; "lost it" is
  answered by issuing another.

- **After death, the bio and photos stay open; nothing else does
  (2026-09-21):** the backlog left 0026's lock allowing nothing until the
  list existed. The list is the four bio columns (bio, temperament, past
  story, behaviour notes) and the photos — the parts of the record that
  describe who the animal was and that people want to add to after a
  death — plus the profile-photo pointer that goes with them. Identity,
  dates, placements, medical rows and the files on blood tests and
  procedures stay locked. 0052 implements it inside the existing trigger
  functions rather than as a role exemption: a `residents` UPDATE passes
  only if the row with the open columns stripped is unchanged (so a save
  that also touches the name is refused, not partially applied), and
  `attachments` rows of owner type `'resident'` pass outright. The
  archive's summary PDF and offline index both show the bio and photos,
  so `refreshDeceasedArchiveIfNeeded()` regenerates them after each such
  edit — best effort, since the edit is already saved and a Drive hiccup
  shouldn't fail it; `archiveDeceasedResident()` was already idempotent.
  Uploads after death land in the archived folder because
  `drive_folder_id` follows the move.

- **Diet is a dated record with a size-driven portion, not a notes field
  (2026-09-21):** the backlog asked for a dietary requirements field; the
  shelter wants history, a current view, and food ordering and budget
  forecasts out of it, so it is modelled on prescriptions (0051):
  `diet_types` is the product list (unit, baht per unit, daily quantity
  for a small / medium / large animal) and `resident_diets` the dated
  rows. Choices worth knowing: (a) meal size hangs off a new
  `residents.size` band rather than weight, because weight may not be
  recorded at intake and a band is what the kitchen actually works to;
  the column is nullable so existing residents aren't invented a size,
  but both the intake and edit forms require one, so a pre-0051 resident
  picks one up the first time their details are saved, and the hub and
  Diet tab nag until then; forecasts treat unset as Medium. (b) The
  per-size quantity lives on the diet type with an optional per-resident
  override, so a price or portion change on the type flows through to
  every resident and the forecast without touching their rows. (c) No
  inline "add a diet type" from the resident form, unlike medications —
  a type needs quantities and a cost, which is management's call. (d)
  Fostered residents are excluded from the food forecast alongside
  deceased and adopted: carers feed at home. (e) The death cascade does
  not end diets (prescriptions are ended because they feed a medical
  forecast that must stop; diets are excluded from theirs by status), so
  the tab and hub read "current" from the resident's state rather than
  the dates, and undoing a death needs nothing restored. (f) Size shows
  on the public adoption pages, as the user asked, beside age and sex.

- **Existing blood tests are classified as CBC, not "unknown" (2026-09-21):**
  0050 makes `blood_tests.blood_test_type_id` NOT NULL and backfills every
  row already in the table to CBC (Complete Blood Count). A nullable
  column or an "Unknown" seed row would have been more honest, but every
  test logged so far was the routine panel by the shelter's own account,
  CBC is the form's default going forward, and a permanent "Unknown" type
  would be one more thing for an admin to merge away later. A row that was
  in fact something else keeps its results text saying so and can be
  reclassified once blood tests get an edit page. The backfill runs under
  the deceased-lock bypass (0026), since a closed record's tests are
  locked against updates and the classification isn't a change to the
  record. The type list has no inline add from the form, unlike procedure
  types: the panels a vet runs are few and stable, and the admin page
  exists from day one, so there is nothing for duplicates to collect from
  — the merge helper is there for parity should one ever appear.

- **Prescriptions are edited in place, not superseded (2026-09-21):** a
  wrong dose or a course a vet cuts short is corrected on the same row
  (`/prescriptions/[id]/edit`, and **End today** on the tab) rather than
  ended and re-entered — there is no audit requirement on prescriptions
  and a duplicate row would double the medication forecast for the
  overlap. Consequences: `updatePrescription` writes every column the
  form carries, so clearing the end date on an expired row makes it
  current again (the edit page says so); End today only appears on a
  current row whose `start_date` is today or earlier, since 0027's
  end-after-start check would refuse it on a future-dated course; and
  the inline "add a new medication / frequency" affordances work in edit
  mode too, since they are the same form. Neither path touches a
  deceased resident's record — the edit page shows the record-closed
  notice and the tab hides the row actions, mirroring 0026's lock.

- **A death recorded in error is withdrawn, not deleted (2026-09-21):**
  the backlog asked whether admins get a proper "recorded in error" path
  and what it should restore. They do, and it is an event: migration 0048
  adds `DeceasedInError` to `placement_type`, and 0049's
  `undo_deceased_placement(resident, reason)` appends one back into the
  placement the death closed (the same enclosure, zone and carer; for a
  resident who was in hospital, the kennel they were due back to is kept
  as `previous_enclosure_id` so return-from-hospital still works). The
  Deceased row is ended by that insert the way any placement ends the
  one before it, and both stay in the housing history with the admin's
  reason. Deleting the Deceased row and reopening the prior one was the
  alternative: cleaner timeline, but `placement_history` is the
  append-only log everything else is derived from (0001, requirements
  Section 4.1), and "a death was recorded and then withdrawn" is a fact
  about the resident worth keeping. The reversal is dated when it is
  made, not backdated, so the history shows the resident as recorded
  deceased between the two dates. That also means a death that *did*
  happen but was recorded with the wrong date can't be fixed this way
  (a re-recorded death has to start after the reversal) — that belongs
  with the "which fields stay editable after death" item, not here.

  **What it restores.** The cascade could not be reversed row by row
  because it left no trace of which rows it touched: an appointment
  cancelled by hand the week before is indistinguishable from one the
  death cancelled, and a prescription's original end date was overwritten.
  So the cascade (now a BEFORE INSERT trigger, which also spares it the
  lock bypass) first records what it is about to do in
  `placement_history.deceased_cascade` on the Deceased row — appointment
  ids, prescription ids with their end dates, `ready_for_adoption` — and
  the undo puts back exactly that and nothing else. Deaths recorded before
  0049 have no snapshot; withdrawing one restores the placement only. The
  lock needs no separate release: it tests the open placement, which is
  no longer the Deceased one.

  **Roles.** Admin only, deliberately narrower than recording a death
  (admin / management / staff): the person who made the mistake asks an
  admin, which is the right amount of friction for reopening a closed
  record. The management dashboard counts a Deceased placement only while
  it is still open, so a withdrawn death drops out of the month and the
  trend.

  **Drive.** Mirror image of the archive, with the same stance on failure:
  the database transition commits first, then the folder moves back under
  `Residents/` and the generated summary PDF and offline index are deleted
  (a "deceased summary" of a living resident is worse than none; both are
  regenerated if a death is ever recorded again). If Drive fails the
  archive columns stay set and the hub shows a retry. Known gap: if the
  original archive never got as far as recording anything (Drive down
  mid-run), a later withdrawal has nothing to flag, and a folder moved
  but not recorded would sit under `Residents/Deceased/` until someone
  looks — judged not worth a column for a double failure.

- **"Resident", never "animal" (2026-09-21):** the customer is particular
  about the word. Every English string, PDF/HTML archive label ("Resident
  ID"), i18n key, identifier and comment that still said *animal* now
  says *resident*; migration 0045 renames `residents.animal_code` to
  `resident_code` (with its unique constraint and sequence), leaving the
  `R-0001` values and Drive folder names as they were. Earlier entries in
  this file keep the column's old name as a matter of history. Left alone
  on purpose: the organisation's name, *Lanna Care for Animals*, and its
  email addresses; the "Chiang Mai Animal Hospital" clinic placeholder;
  the `lanna-animal-care` package/Worker name (renaming the Worker would
  create a second deployment); and the Thai dictionary, which already
  renders resident as สัตว์ throughout because Thai has no natural word
  for a shelter "resident" — a Thai speaker should decide whether that
  should change.

- **Frequencies are schedules, forecast from the start date (2026-09-21):**
  0027 stored a frequency as `doses_per_day` so a forecast could multiply
  by it, and seeded Weekly as 0.143 and Every other day as 0.5. The user
  hit the flaw straight away: a weekly or monthly tablet is a whole dose
  on a particular day, not a seventh of a tablet every day, and the
  average never says which day. Migration 0044 makes a frequency one of
  three kinds — **times a day** (`doses_per_day`, now an integer),
  **every N days/weeks/months** (`interval_count` + `interval_unit`), or
  **as needed** (all null) — with a check that exactly one is set. The
  seeded fractions are converted by value (0.5 → every 2 days, 0.143 →
  every week, and so on, nearest whole days otherwise) before the column
  type changes, and Every 2 weeks / Monthly are seeded. Month intervals
  are calendar months from the start date, clamped at short months the
  way Postgres date arithmetic does (Jan 31 → Feb 28 → Mar 31, since each
  date is start + k months, not the previous date + 1 month).

  **Forecast.** `prescription_doses_between(prescription, from, to)`
  counts the whole doses a prescription has in a window, from its own
  `start_date`: doses_per_day × days of overlap for the per-day kind, the
  dates start + k × interval that fall in the window for the interval
  kind, 0 for as needed. `medication_forecast(from, to)` totals that per
  medication (doses, quantity in the unit, residents) across every
  prescription overlapping the window for a living, non-adopted resident.
  It replaces the `medication_daily_requirement` view, which had to go
  anyway (it read the column being retyped). Both are plain SQL functions
  with the caller's RLS. Asserted in a rolled-back transaction: weekly
  from 21 Sep gives 5 doses in 30 days and 0 in a gap week; monthly from
  31 Jan gives Jan 31 / Feb 28 / Mar 31 / Apr 30; a twice-daily course
  ending after 3 days gives 6; "as needed" adds a prescription but no
  doses.

  **In the app.** The three kinds are one shared client component
  (`FrequencyScheduleFields`) and one parser (`parseSchedule` in
  `src/lib/prescriptions/frequency.ts`), used by the prescription form's
  inline "add new frequency" and by the management page's add form and
  inline edit — the same rules and messages everywhere. Pickers describe
  each option ("Weekly — Every week") and are sorted most-frequent first
  by an average that is only ever used for ordering. The Medications
  table shows *Next 7 days* and *Next 30 days* per medication instead of
  a per-day figure. The section is titled "Frequency options" with an
  intro saying it is the pick-list, because the user reasonably asked
  what a label and doses-per-day were doing on a management page when
  dose and frequency belong to each prescription — the amount does, and
  is set per prescription; this list is only the "how often" vocabulary.

- **Medication management (2026-09-21):** `/management/medications`
  is the CRUD page for the `medication` and `frequency` reference tables
  that the prescription form picks from — the backlog's "Admin page for
  medications and frequencies", built under Management on the user's
  call (a manager owns the medicine list; admin is system configuration).
  Same shape as `/management/vets`: an add form, an inline-edit table,
  delete blocked while anything references the row. Two things are
  specific to medications:

  **Changing a unit is a confirmed action.** The unit lives on the
  medication and every prescription's `dose_quantity` is in that unit
  (0027), so switching "tablet" to "ml" silently redefines every dose ever
  written. The row asks for confirmation, naming how many prescriptions
  are affected, and only when the unit actually changes on a medication
  that has any. Renaming never asks.

  **Duplicates are merged, not deleted.** "Amoxicillin" added inline by
  one person and "amoxicillin 250" by another are the same product, but
  neither can be deleted once prescribed — the prescription is part of
  the resident's medical record (`prescriptions.medication_id`, no
  cascade). `merge_medication(from, into)` / `merge_frequency(from, into)`
  (0043) move every prescription across and drop the duplicate in one
  transaction, SECURITY INVOKER so RLS decides who may: it takes UPDATE on
  prescriptions *and* DELETE on the reference table, which admin and
  management have and staff/vet don't (their call fails at the delete and
  rolls back). Medications only merge within the same `dose_unit`, for
  the same reason the unit change is confirmed; the picker only offers
  same-unit rows and the function refuses anything else. Frequencies merge
  freely — the moved prescriptions take the kept row's `doses_per_day`,
  and the confirm says so. Verified against real rows in a rolled-back
  transaction before applying.

  **What management can do.** 0039's mirror gave management staff's
  read + insert on both tables; 0043 swaps the insert twin for a
  read/write `for all` policy, the same count-preserving trick as 0040,
  so the 0039 drift check still holds. The page also surfaces a
  requirement per medication (first as today's per-day figure from the
  0027 view, replaced the same day by the 7 / 30-day forecast — see the
  entry above), which covers most of the "Medication requirement page"
  backlog item; a days-of-stock projection is still open.

- **"Our work" — project stories on the public site (2026-09-21):**
  migration 0042 adds `public_projects` and `public_project_photos`,
  the project counterpart of the resident pair (0016/0017/0025): plain
  views owned by the migration role (so they bypass the staff-only RLS
  on `project_folders` / `attachments` by design), granted SELECT only
  to `anon` / `authenticated` with every other privilege revoked, and
  `scripts/check-public-views.mjs` now checks all four. Filtered on
  `is_public` **and** `parent_folder_id is not null` — a category row can
  never be a story. The column list is the safety boundary: title (the
  folder `name`, since that is the English title staff chose and the
  Drive folder is named after it) and `name_th`, summary in both
  languages, date, location, category, a `cover_drive_file_id` (the
  chosen cover, else the first photo by sort order — the same fallback
  `project_folder_summary` uses) and a photo count; no `created_by`,
  `uploaded_by`, Drive folder ids or attachment ids beyond the gallery's
  own. `sort_date` (`coalesce(project_date, created_at::date)`) is the
  one "newest first" key so an undated story still sorts sensibly.
  Photos already flow through the proxy: project photos live on
  `attachments` (0034), which `is_known_drive_file` covers.

  **Pages:** `/our-work[?category=…]` lists every published story as a
  card (cover, category badge, date, title, opening line) with category
  chips driven by the URL — shareable links, still server-rendered, the
  shape the `/adopt` filters item asks for. Chips appear only for
  categories that have a story, so nothing on the page leads to an
  empty list; a shared link to an empty category says so rather than
  showing every story. `/our-work/[id]` is the story: category (linking
  to the filter), title, date and location, a gallery that opens on the
  cover with per-photo captions, the summary as paragraphs, and three
  other recent stories. Text is picked by locale with English fallback
  (`localized()` in `src/lib/projects/public.ts`): a story is never
  hidden from Thai readers for lacking a translation, it just reads in
  English. `generateMetadata` emits Open Graph / Twitter tags with the
  cover as `og:image`; the image URL must be absolute for Facebook's and
  LINE's scrapers, and there is no configured site URL, so
  `getSiteOrigin()` (`src/lib/site-origin.ts`) reads the request's
  host / forwarded headers (`NEXT_PUBLIC_SITE_URL` overrides) and passes
  it as `metadataBase`. `/our-work` joins `/adopt` in the proxy's public
  prefixes. `PublicHeader` gained Adopt / Our work links (with
  `aria-current` on the section the visitor is in) and now wraps on
  phones; the home page shows the three newest stories as a **"What we
  do" block directly under Pet of the week**, above "Ready to meet
  everyone?" — the user's call, keeping the top of the page for the hero,
  the numbers and the shelter's own story. Summaries are rendered as
  plain paragraphs split on blank lines, as the `/projects` info card
  does; the "markdown" in the original brief was never implemented on
  the staff side, so the public page doesn't pretend otherwise.

  **Quick removal (user's follow-up):** `/admin/website` lists every
  published story ("Our work — published stories": thumbnail, title,
  category, date, photo count, links to the folder and the public page)
  with a "Remove from website" button, so an admin can pull something
  without hunting through the project tree. It is one-directional on
  purpose: publishing stays on the folder (`/projects/[id]`, "Show on
  website") where the story is written and checked, and the admin action
  (`unpublishProject`) only clears `is_public` — the folder and photos
  are untouched and staff can re-tick it.

- **Pet of the week (2026-09-21):** `site_content.featured_resident_id`
  (0041, nullable FK to `residents`, `on delete set null`) names one
  resident to spotlight on `/`. It sits on the `site_content` singleton so
  the existing public-read / admin-update policies cover it, and the
  public page **never trusts the id alone**: it looks the resident up in
  `public_resident_profiles`, so an animal that is later hidden, adopted
  or dies drops off the home page by the view's own rules (0025) with no
  clean-up job or cascade. The admin chooser on `/admin/website` reads
  the same view for its options (plus `thai_name` from `residents`, which
  the view deliberately omits) and the server action re-checks the choice
  against it, so the picker can't offer — and the action won't store —
  an animal the page would then refuse to show. Rather than a second
  component, `ResidentPicker` gained a `single` prop (radio rows, one
  choice replaces the last) for this and any later one-resident field.
  The card (photo, "Meet <name>", species · breed, first paragraph of the
  bio, "Available for adoption" badge when set) links to `/adopt/[id]`
  and sits **after the story and gallery, just above "Ready to meet
  everyone?"** — the user's call over the RSPCA ACT placement near the
  top: the visitor learns who the shelter is, meets one animal, then is
  offered the rest.

- **Management role and dashboard (2026-09-21):** a fifth `app_role`,
  `management`, sits between admin and staff. In the database it is
  *exactly* staff — 0039 copies every `staff_*` policy in `pg_policies`
  as a `management_*` twin (with a count check so the two can't drift)
  and re-creates the four security-definer functions that keep their own
  role list (`record_attachment`, `set_resident_profile_photo`,
  `delete_resident_photo`, `record_deceased_archive`) with management
  added. The enum value is its own file (0038) because Postgres won't use
  a new enum value in the transaction that added it, and
  `apply-migrations.mjs` runs each file as one transaction — so 0039
  can't be dry-run until 0038 is committed. What management gets beyond
  staff lives in the app: `requireManagementUser()` /
  `assertManagementRole()` / `canManage()` in
  `src/lib/auth/require-management.ts` gate the **Management** nav
  section (admin is a superset and sees it too), which holds
  `/management/dashboard`, `/management/contacts` and `/management/vets`
  — contact and vet management moved out of Admin (the old URLs
  redirect). The split the user asked for: Admin is system configuration
  (security, website, zones, enclosures, immunization types); Management
  is operational management. Vets is the one place management has *more*
  than staff: staff only read `vets`, so 0040 swaps the mirrored read-only
  twin for a read/write policy (same policy count, so 0039's check still
  holds). Every app-side staff check (`DECEASED_ROLES`,
  `HOSPITAL_ROLES`, `REHOME_ROLES`, `MOVE_ROLES`, `canWriteMaintenance`,
  `canWriteProjects`, resident edit, photo write access) now includes
  management. A management RLS probe (fake `auth.users` row + JWT claims
  inside `begin … rollback`) confirmed reads on residents / placements /
  visits, CRUD on contacts, and no access to `user_roles`,
  `site_content` writes or blood-test inserts.

  **The dashboard** (`src/app/management/dashboard`, numbers in
  `src/lib/management/report.ts` as pure functions, same shape as
  `src/lib/vets/stats.ts`) reproduces the shelter's hand-made monthly
  report so it can replace it, one card per line with the names as links:
  intakes, adopted, fostered (split into *new this month* and *continuing
  from before* — the report's "Mangkut – continued"), died, sent to
  hospital, returned to shelter, blood work, vet visits, procedures by
  type; a resident appearing twice shows as "Name (2)". Two of the
  report's distinctions don't exist in the data and are **derived**:
  *initial vs follow-up vet visit* is whether the visit is the resident's
  earliest non-cancelled visit on record (an extra query fetches the
  earlier visits of just the animals seen that month), and *blood work
  "MW" vs "vet visit"* is whether the test is linked to a
  `vet_appointment_id` — labelled "in-house" / "at vet visit" pending
  confirmation of what MW means (backlog). Above the month is a "right
  now" strip (in care = Resident + Hospitalised + Fostered, with a species
  breakdown; in shelter / hospital / fostered / outreach; ready for
  adoption with how many are public; scheduled vet visits in the next 7
  days with overdue ones flagged; open maintenance with blocked flagged)
  and below it a 12-month intakes / adoptions / deaths chart ending on the
  selected month. The month is a `?month=YYYY-MM` search param with
  prev / next links, so it's server-rendered and shareable. Every query
  is bounded (the trend window, the month, open fosters, scheduled visits)
  to stay under PostgREST's 1000-row cap; month boundaries for timestamp
  columns are the server's local time (a follow-up, see backlog). Date
  columns (`blood_tests.date`, `procedures.date`) are compared as text
  so no time zone can shift them.

  **Public stats:** the same migration adds `public_shelter_stats` — a
  counts-only view granted to `anon` the way `public_resident_profiles`
  is (0016/0025, writes revoked) — and `/` shows a three-tile strip
  under the hero (animals in care, adopted this year with the last-7-days
  figure, in vet care), closing the "Shelter impact stats" backlog item.
  A failed query drops the strip rather than the page.

- **Contacts management and the contact list (2026-09-20):**
  `/admin/contacts` is the admin CRUD page for the `contacts` table, the
  same shape as `/admin/vets`; `/contacts` and `/contacts/[id]` are the
  read side, open to every signed-in role (all four already had SELECT on
  `contacts` and `placement_history`). The two halves are deliberately
  different in feel: admin is a desktop table for setting people up, the
  list is a phone tool — search box and type chips pinned at the top,
  cards with a row of one-tap actions (call, LINE, Messenger, WhatsApp,
  email, open in maps) that are plain links with the schemes the phone
  hands off to its apps (`tel:`, `mailto:`, `https://line.me/ti/p/~<id>`
  as assumed in Section 11 item 5, `https://m.me/<username>`,
  `https://wa.me/<number>`, `google.com/maps/search/?api=1&query=…`), so
  they work with no JavaScript and on desktop just open the web
  equivalents. Maps needed somewhere to point at, so 0036 adds a
  free-text `address` column; 0037 adds `messenger_id` (the Facebook
  username) and `whatsapp` (the number the account is on, kept apart
  from `phone` since it's often a different one). A pasted link in any
  of these is used as-is. WhatsApp wants an international number with no
  "+": a number written the local way with a leading 0 is assumed to be
  Thai and gets 66 in its place — the shelter is in Chiang Mai and that's
  how staff write numbers; anything with a country code is used as given. The hub lists the residents currently with a carer (open
  `placement_history` rows with that `carer_id`) and their earlier
  placements, linking into the resident hub — it does not assign anyone.
  Placing a resident stays on the resident hub's Foster / adopt page, and
  the carer picker there now says why only Carer-type contacts appear
  (the table also holds volunteers, suppliers and donors, and
  `placement_history_check_carer_type` rejects any of them). Two guards
  mirror that trigger from the admin side: a contact with placements
  can't be deleted (no cascade on `carer_id`, and the rows are the
  residents' history) and can't have its type changed away from Carer,
  since the trigger only fires when a placement is written and would
  otherwise leave history pointing at a non-carer; a contact assigned to
  a maintenance job can't be deleted either. `Vendor` is labelled
  "Supplier" in the UI — the stored value is unchanged. The inline
  "add a new carer" on the rehome form stays, so staff can record a
  placement with a brand-new carer without an admin.

- **Vets management and the vet hub (2026-09-20):** `/admin/vets` is the
  admin CRUD page for the `vets` table, same shape as the other admin
  lookups. Deleting a vet is refused (server-side, and the button is
  disabled with the reason as its tooltip) while any `vet_appointments`
  row points at it: the FK has no cascade on purpose, since the visits
  are the residents' medical history, and a raw foreign-key error would
  have said nothing useful. `/vets` and `/vets/[id]` are the read-only
  side, open to every signed-in role because every role already had
  SELECT on `vets` and `vet_appointments` — a volunteer at the clinic
  needs the phone number as much as staff do. The hub deliberately adds
  nothing: booking, procedures and so on stay on the resident, which is
  where the record belongs; the hub only links back there. Statistics
  are computed in `src/lib/vets/stats.ts` from one load of the vet's
  appointment rows, with the 3 / 6 / 12 month / all-time selector
  filtering client-side — no stats view or RPC, since a few hundred rows
  a year is nothing to ship to the browser and it keeps the list page
  and the hub reading identical numbers. "Visits" in a period means
  non-cancelled visits dated inside it and not in the future; scheduled
  future and overdue visits get their own card over the whole schedule.
  Procedures, blood tests and prescriptions are counted through their
  `vet_appointment_id` with a PostgREST inner join filtered on the vet
  (`vet_appointments!inner(vet_id)`), one request per table. The
  visits-per-month chart is hand-rolled SVG like `WeightChart`, a single
  series in the app's primary colour with a per-bar tooltip; the visit
  list under it is the same data as a table. `StatCard`'s `href` became
  optional for the hub's plain read-out tiles. `cancelled` was added to
  the appointment-status labels — the enum always had it, the dictionary
  didn't.

- **Sign in with Google (2026-09-20):** the login page now offers
  "Continue with Google" alongside email/password, via Supabase Auth's
  Google provider (PKCE). `signInWithGoogle()` in `src/app/login/actions.ts`
  starts the flow (a server action, so the code-verifier cookie is written
  by the same server client that later exchanges it) and
  `src/app/auth/callback/route.ts` swaps the returned code for a session.
  Roles stay admin-provisioned: the callback checks `current_user_role()`
  and, if the Google account has no `user_roles` row, signs them straight
  back out to `/login?error=no_role` rather than letting a role-less
  session reach `/residents` where every RLS policy would reject it. The
  `auth.users` row is deliberately left in place so the admin sees the
  account on `/admin/security` and can assign a role; the person then
  just tries again. Google accounts whose email matches an existing
  admin-created login are linked to that user by Supabase automatically
  (both emails count as verified), so existing staff keep their role and
  can use either method. `/auth/callback` is a public path in
  `src/lib/supabase/proxy.ts`. The login page also gained a "Back to home
  page" link — previously there was no way back to the public site.
  One-time setup (not in code): Google Cloud console → create an OAuth
  2.0 *Web application* client (the existing Drive client can live in the
  same project) with authorised redirect URI
  `https://<project-ref>.supabase.co/auth/v1/callback`; Supabase →
  Authentication → Providers → Google: enable and paste that client
  ID/secret; Supabase → Authentication → URL Configuration: add
  `http://localhost:3000/auth/callback` and the production
  `https://<domain>/auth/callback` to Redirect URLs (Supabase falls back
  to the Site URL for any `redirectTo` not on that list). Optionally turn
  off "Allow new users to sign up" there to stop unknown Google accounts
  creating `auth.users` rows at all — then they get the generic
  `error=google` message instead of `no_role`, and admins must create the
  login first with the person's Gmail address.
- **Hosting:** Cloudflare Workers (free tier), not Vercel. Chosen to avoid
  Vercel Hobby's non-commercial-use restriction. Deployed via the
  `@opennextjs/cloudflare` adapter (`wrangler.jsonc`, `open-next.config.ts`,
  `npm run deploy`) rather than `@cloudflare/next-on-pages`, since OpenNext
  runs the Node.js-runtime routes this app uses.
- **Google Drive without `googleapis` (2026-09-20):** the first Cloudflare
  deploy attempt (2026-09-19) failed because the `googleapis` SDK's HTTP
  layer (gaxios over Node `http`/`zlib`) doesn't work on the Workers
  runtime even with `nodejs_compat` — the OAuth refresh-token exchange came
  back corrupted, so every Drive call failed and that day's demo went to
  Vercel instead. `src/lib/google/drive.ts` now talks to the Drive v3 REST
  API directly with `fetch` (a ~150-line client covering the five endpoints
  the app uses: list, create folder, multipart upload, get/download,
  delete), with a module-level access-token cache. `googleapis` is kept
  only as a devDependency for the one-off local setup scripts in
  `scripts/`. Side benefit: the photo proxy now needs one Drive request
  per file instead of two, since `fetch` exposes the `Content-Type` header
  on the `alt=media` response that gaxios hid.
- **No `.env.local` in the Worker bundle (2026-09-20):** `@opennextjs/cloudflare`
  snapshots every variable from `.env*` files into
  `.open-next/cloudflare/next-env.mjs` and the Worker uses them as a
  `process.env[key] ??=` fallback for anything not set as a Cloudflare
  secret. Handy for `npm run preview`, but on a deploy it would upload the
  dev Google/Supabase credentials plus `SUPABASE_ACCESS_TOKEN` and
  `DEV_TEST_USER_PASSWORD`, which the app never reads. `npm run deploy` now
  runs `scripts/strip-baked-env.mjs` between build and deploy to empty
  that file. Verified on workerd that the stripped bundle 502s the photo
  proxy with no secrets and works once they're supplied via `.dev.vars`
  (the local equivalent of `wrangler secret put`). `NEXT_PUBLIC_*` values
  are unaffected — `next build` inlines them separately. Consequence:
  every runtime secret must be set on Cloudflare before the first deploy.
- **Google Drive auth model:** the shelter's storage
  (`lannacareforanimals@gmail.com`) is a personal Gmail account, not Google
  Workspace, so domain-wide delegation (as the original doc assumed) is not
  available. Using OAuth2 with a stored refresh token against that one
  Google account instead — functionally equivalent for this use case.
- **Dev vs. production Google account:** development uses
  `lannaanimalfoundationbwm@gmail.com` (an account Lutan has admin rights
  to). Production repoints to `lannacareforanimals@gmail.com` at go-live.
  The account is a config value (env var), never hardcoded.
- **Google OAuth setup (2026-09-18):** OAuth2 client + refresh token minted
  against `lannaanimalfoundationbwm@gmail.com` via a one-time consent flow
  (`scripts/google-oauth-setup.mjs`), verified end-to-end with
  `scripts/google-drive-verify.mjs`. `GOOGLE_DRIVE_ROOT_FOLDER_ID` in
  `.env.local` points at that account's "LCA Health System" folder
  (`1Yn4LTg5cc4oc843sVgn8kvF5sy5fupZy`). At go-live, this whole set
  (`GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`)
  needs to be re-minted against `lannacareforanimals@gmail.com` and the
  equivalent production folder — none of it carries over as-is.
- **Vet access scope (Section 11, item 4):** shelter-wide read access to all
  residents' medical history, not scoped per-resident. Matches the doc's
  own recommendation (medical safety — a covering vet needs full history).
- **Volunteer tier (Section 11, item 5):** yes, added as a 5th role.
  Volunteers can **read everything** (residents, placements, vet history,
  maintenance/projects, contacts), and can **write** only:
  - attachments / photos (any owner type)
  - `ChangeEnclosure` placement_history records (moving an animal between
    enclosures)
  They cannot record any other placement type (Intake, Adopt, Deceased,
  Hospital, Foster, Return to Shelter), and cannot write vet/medical data
  or manage contacts. This is a first-pass boundary — flagged to confirm
  with Lutan once the app is running and volunteers' actual day-to-day
  needs are visible.
- **Resident photo upload (2026-09-19):** added `residents.animal_code`
  (sequential `R-0001`, `R-0002`, …, assigned at intake — see
  `0012_resident_animal_code.sql`; prefix changed from `A-` to `R-` for
  "Resident" in `0022_resident_code_prefix.sql`, 2026-09-20) as the short, human-friendly identifier
  needed because animal names repeat at the shelter and `residents.id`
  (UUID) is unusable in a Drive folder name. Multi-file drag-and-drop/tap
  upload lands in `Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/`
  (Category is one of Shelter/Medical/Foster/Adoption, chosen per upload
  batch alongside a date-taken; `<YYMM>` derives from that date) — this
  matches the pre-existing convention already found in the dev Drive
  account's legacy-migrated folders, confirmed while building this feature
  (see the open item below). Volunteers can manage photos (upload, pick
  profile photo, delete) via three new `security definer` RPC functions
  (`record_attachment`, `set_resident_profile_photo`,
  `delete_resident_photo` — `0013_resident_photo_attachments.sql`,
  `0014_attachment_date_taken.sql`) since that requires writing
  `residents.profile_photo_drive_file_id`, and volunteers otherwise have
  read-only RLS on `residents`. Flagged as an assumption, not confirmed:
  decisions.md's existing volunteer boundary says they may write
  "attachments/photos" without explicitly covering profile-selection.
- **No `date_of_birth` on residents:** removed (0011_drop_date_of_birth.sql).
  The original doc listed `date_of_birth (or estimated age)` as if either
  might be known, but in practice the shelter never has a real DOB at
  intake — every age is a staff guess. `estimated_age_years` (anchored to
  `age_estimated_on`, so displayed age keeps advancing over time rather than
  freezing at the value entered on day one — see `formatAge` in
  `src/lib/format.ts`) is the only age input now.
  - **Anchor moved from `intake_date` to `age_estimated_on` (2026-09-20,
    `0023_resident_age_estimated_on.sql`):** anchoring to intake broke the
    moment staff revised the estimate from the edit form — typing "5" two
    years after intake displayed as ~7. The edit form now shows the age as
    it reads *today* and, only when that number is changed, stores it with
    `age_estimated_on = today`. Deliberately a dedicated column rather than
    the row's last-modified time, so editing the bio doesn't re-anchor the
    age. Intake still sets it to `intake_date`.

- **Photo image proxy (2026-09-19):** stopped rendering resident photos via
  direct `drive.google.com/thumbnail?id=...` URLs. That endpoint has a
  separate, undocumented per-file abuse-throttling quota (distinct from the
  documented, generous 325k-units/min Drive API quota) — a handful of staff
  refreshing a list page in a short window could plausibly trip it for a
  given resident's photo, taking it offline for everyone for up to ~24h.
  This mattered most for the planned public adoption listing (unbuilt), the
  most likely source of an unpredictable anonymous traffic burst.
  Replaced with an image proxy (`src/app/api/photos/[fileId]/route.ts`) that
  fetches a file once via the authenticated Drive API (`files.get` +
  `alt=media`) and serves it with `Cache-Control` headers, plus Cloudflare's
  edge Cache API (`caches.default`) when that global is available at
  runtime — so N pageviews cost Drive at most one request per cache
  lifetime instead of N direct hits. `driveImageUrl()` in
  `src/lib/google/drive-client.ts` now returns this proxy's URL instead of
  a Drive URL, and no longer takes a `size` — the proxy can't ask the Drive
  API for a resized thumbnail the way the old `drive.google.com/thumbnail`
  endpoint could, so it serves the original file and lets the existing CSS
  (`object-cover`/`object-contain` + fixed container sizes) handle display
  sizing. Chose the Cache API over R2 for the edge layer: it's free-tier,
  needs no new billing, and matches the actual need (de-dupe a traffic
  burst against a single file), whereas R2 buys persistence this doesn't
  need. New uploads (`uploadImageToFolder` in `src/lib/google/drive.ts`)
  no longer get "anyone with the link" sharing — they're only reachable
  through the proxy now, which closes off the direct Drive URL as a way to
  bypass the proxy's caching entirely. The proxy itself stays
  unauthenticated (carved out of the blanket auth gate in
  `src/lib/supabase/proxy.ts`, which otherwise 307-redirects every
  signed-out request to `/login`) and instead checks the requested file ID
  against a new `is_known_drive_file()` RPC
  (`supabase/migrations/0015_photo_proxy_lookup.sql`) before calling Drive,
  so it can't be used to fetch arbitrary files from the account — this
  matches, not exceeds, today's access level (anyone who already knows a
  registered Drive file ID could view it before this change too).
  Flagged, not done here:
  - Files uploaded before this change are still "anyone with the link";
    revoking those permissions retroactively is a separate cleanup task.
  - The Cache API layer needs a Workers-compatible runtime to actually
    activate — it's feature-detected and simply no-ops under plain
    `next dev`/Node hosting. Under the `@opennextjs/cloudflare` deploy
    (see the Hosting entry above) `caches.default` is available, so it
    should be live in production — worth confirming on the first
    Cloudflare deploy by checking that repeat requests for a photo don't
    reach the handler.

- **Public welcome page + guest browsing (2026-09-19):** `/` is now the
  public marketing/welcome page (hero photo, shelter story, links to
  `/login` and `/adopt`); the staff dashboard that used to live at `/` moved
  to `/residents`. `/adopt` and `/adopt/[id]` are the "Public/Anonymous"
  RBAC tier's guest-browsing pages (Section 6), reading only from the
  existing `public_resident_profiles` view — never `residents` directly.
  `src/lib/supabase/proxy.ts` now treats `/`, `/adopt*`, and `/api/photos/*`
  as public paths; everything else still 307s a signed-out visitor to
  `/login`. The public `/adopt/[id]` page shows a full photo gallery
  (`public_resident_photos` view, 0017) with click-to-swap thumbnails, not
  just the one profile photo.

  **Landing page content is now admin-editable, not hardcoded (2026-09-19):**
  hero photo, tagline, "Our story" heading/body, contact email/address, and
  the gallery photo strip all live in `site_content` /
  `site_content_photos` (0018) and are edited at `/admin/website` — no code
  change needed to update copy or swap photos. Uploaded photos go through
  the same Google Drive flow as resident photos (`Website` folder under
  `GOOGLE_DRIVE_ROOT_FOLDER_ID`), served via the existing image proxy.
  Initial launch copy/photos (originally sourced from the shelter's
  Facebook page, facebook.com/lannacareforanimals) were seeded into this
  table directly — `public/landing/*` no longer exists, that's not where
  landing-page images live anymore.

  **SQL to run against the production Supabase project before go-live**
  (not yet applied anywhere but the dev project — do this alongside the
  other go-live steps in the Google Drive entry above):
  - `supabase/migrations/0016_public_adopt_listing_access.sql` through
    `0019_site_content_photo_proxy.sql` (0016 public listing grant, 0017
    public photo gallery view, 0018 site_content/site_content_photos +
    RLS, 0019 adds site_content to `is_known_drive_file()` so its photos
    aren't blocked by the image proxy's allowlist). Confirmed working in
    dev, but don't assume the prod project's default privileges match —
    run 0016's grant explicitly rather than relying on that.
  - `0025_public_views_exclude_adopted.sql` (and everything in between,
    0020–0024) — 0025 also revokes anon/authenticated write access on the
    two public views. Run `node scripts/check-public-views.mjs` against
    production afterwards; README step 3 has the details.
  - `site_content` ships with an empty hero/gallery (the dev seed data
    doesn't carry over) — go to `/admin/website` after migrating and set
    the real production hero photo, story copy, and gallery before
    announcing the page publicly, or it'll briefly show a hero-less page.
  - Sanity-check after applying: hit `/` and `/adopt` signed out and
    confirm the page and animals actually load. If RLS/grants are
    misconfigured on the prod project, this fails closed (empty/blank),
    not open — worst case is a bare page, never a data leak. Still worth
    checking before launch rather than discovering it from a support email.

- **Blood test view + Drive attachments (2026-09-19):** blood tests can now
  be logged from a resident's Blood Tests tab (`/blood-tests/new?residentId=`)
  or from a specific logged vet visit (adds `&vetAppointmentId=`, preselecting
  the linked visit and defaulting the test date to that visit's date). Files
  go through the same polymorphic `attachments` table as resident photos
  (`0020_blood_test_attachments.sql` adds `'blood_test'` to
  `attachment_owner_type`) instead of the single `blood_tests.drive_file_id`
  column from the initial schema (dropped) — a lab report is often more than
  one file (front/back of a slip, a multi-page PDF), and this also means the
  future OCR build can iterate every file on a test rather than being
  hard-limited to one. Drive path is
  `Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/<filename>`, matching the
  requirements doc's Section 5.1 convention — one folder per test date
  (unlike Photos' per-month grouping), since a single draw's files should
  land together. Accepts images and PDF (photos stay image-only).
  OCR itself (auto-populating structured values from the attached scan) is
  explicitly out of scope for this build.

  **Role scope, flagged as an assumption, not fully confirmed:** creating the
  `blood_tests` row itself stays limited to vet/admin, per the existing RLS
  (`vet_rw_blood_tests` / `admin_all_blood_tests` in 0001) — staff/volunteers
  can view but not log a new test. This reads Section 6's role table
  literally (blood tests listed only under Vet's read/write scope) rather
  than assuming staff need to log results a vet phoned in; worth confirming
  once this is in front of the person who'll actually use it day to day. Once
  a test row exists, staff/volunteers *can* attach additional files to it
  (e.g. scanning in a paper report that arrives later) — `record_attachment()`
  was extended to include `'vet'` in its role check (it previously only
  covered resident photos: admin/staff/volunteer), and per decisions.md's
  existing "volunteers may write attachments/photos, any owner type" this
  extends unchanged to the new `blood_test` owner type.

  **Fixed in passing:** `attachments` had no RLS policy at all for the `vet`
  role (an existing gap, unrelated to blood tests specifically) — a vet
  reading resident photos "for context" per Section 6 would have silently
  gotten zero rows. Added `vet_rw_attachments` matching the existing
  staff/volunteer "for all" shape.

- **Enclosure browser (2026-09-20):** `/enclosures` and `/enclosures/[id]`
  are the phone-friendly zone → enclosure → residents path; the desktop-only
  zone/enclosure filters on `/residents` stay as they are. Occupancy is
  computed in the page from `resident_list_view` (one `enclosure_id` per
  resident, counted in the request) rather than a new occupancy view — no
  migration needed, and the headcount is small enough that this is cheap.
  If it ever isn't, swap in a `security_invoker` view with a `group by`.
  Capacity thresholds live in `src/lib/enclosures/occupancy.ts`: over
  (count > capacity), full (equal), nearly full (≥ 80%), otherwise space
  available; `capacity` null/0 shows the count only. The Lifecycle
  pseudo-zone (Hospital / Fostered / Adopted / Deceased / Unassigned) is
  included — "who's in hospital" is a real question — but sorted last,
  labelled as a status rather than a physical enclosure, and gets no
  Maintenance card. Maintenance is a disabled placeholder on the hub only;
  building it needs an `enclosure_id` on the `maintenance` table (it only
  has `zone_id` today) — tracked in the backlog.

- **Move resident between enclosures (2026-09-20):** two entry points, one
  rule set. `/residents/[id]/move` (from the hub's Housing card and the
  housing section) is the quick path; the edit form's Housing section does
  the same thing on save when a different enclosure is picked. Both go
  through `moveResidentToEnclosure()` in `src/lib/placements/move.ts`, which
  inserts a single `ChangeEnclosure` row (with `previous_enclosure_id`) and
  lets the existing `close_prior_placement` trigger end the prior placement.
  The picker is zone → enclosure (dependent dropdowns — there will be 100+
  enclosures) and only lists physical zones: Lifecycle pseudo-enclosures are
  entered via their own placement types (hospital, foster, adopt, deceased),
  never by "moving" there, and the server rejects them too. Moving into an
  enclosure that would be nearly full / full / over capacity (thresholds
  from `occupancy.ts`, counting the incoming resident) shows a warning
  dialog but is allowed on confirm — staff know which animals can share.
  Dates: a date-only input is stamped `now()` for today and midday UTC for
  back-dated moves, so it always sorts after a midnight-stamped intake on
  the same day; the server also rejects a move dated before the current
  placement started (the `end_after_start` check would, less helpfully).
  Deceased residents can't be moved. **0024** fixes two things in the
  `close_prior_placement` trigger that the first real non-Intake insert
  exposed: (a) it was `AFTER INSERT`, but the one-active-placement partial
  unique index is checked as the row is written, so *every* move failed
  with a duplicate-key error before the trigger could close the prior row —
  it is now `BEFORE INSERT`; (b) it ran as the caller, so volunteers (who
  may insert `ChangeEnclosure` but have no UPDATE policy on
  `placement_history`) would have had the prior placement silently *not*
  closed — it is now `security definer` with `search_path` pinned. Also
  fixed in passing: the housing history section embedded `enclosures(name)`
  without naming the FK, which PostgREST rejects as ambiguous (there are two
  FKs to `enclosures`), so the list always read "No placement history".

- **Send to hospital (2026-09-20):** three entry points, one page.
  `/residents/[id]/hospital` is linked from the hub's Housing card, the
  housing section, and each vet visit record (which passes
  `?vetAppointmentId=` so the visit's date pre-fills "Date admitted" and
  the visit's date/reason/vet pre-fills the notes — `placement_history` has
  no FK to `vet_appointments`, and adding one for a note-worthy link wasn't
  worth a migration). `sendResidentToHospital()` in
  `src/lib/placements/hospital.ts` inserts a single `SendToHospital` row
  into the Lifecycle/Hospital pseudo-enclosure (looked up by name — there's
  no id constant) with `previous_enclosure_id` = whatever the resident's
  current enclosure is, physical or not, so "Return from hospital" can put
  them back; the same `close_prior_placement` trigger closes the prior row.
  No migration: the enum value, pseudo-enclosure and admin/staff insert
  policies already existed. Role boundary kept as decided above — only
  admin and staff; volunteers (ChangeEnclosure only) and vets (no placement
  writes) see the page's not-authorised message. Worth revisiting if the
  vet role turns out to be used by people who actually admit animals.
  Rejected: already-hospitalised, deceased, future dates, dates before the
  current placement started (same date stamping as moves, via the shared
  `src/lib/placements/dates.ts`). While a resident is hospitalised the
  Housing card switches to an ambulance icon, reads "In hospital · Off-site
  in medical care · Returns to {enclosure}", and hides "Send to hospital".
  Placement history rows now show a translated label per `placement_type`
  (`enums.placementType`) instead of the raw enum. `StatCard` takes
  `actions: []` instead of a single `action` so the Housing card can offer
  both Move and Send to hospital.

- **Return from hospital (2026-09-20):** the reverse of send, at
  `/residents/[id]/hospital/return`, linked from the Housing card and the
  housing section only while the resident is hospitalised — the two
  actions are opposites and exactly one of them is ever shown.
  `returnResidentFromHospital()` (same file as send) inserts a single
  `ReturnFromHospital` row; `previous_enclosure_id` on that row is the
  Hospital pseudo-enclosure so the history reads "Hospital → Kennel 3"
  like a move. The zone → enclosure picker (shared `EnclosurePicker`, with
  the same capacity warning as moves) defaults to the stored
  `active_hospital_previous_enclosure`, but any physical enclosure is
  accepted: a resident back from surgery may need an isolation enclosure
  for a few weeks before rejoining the general population. When the stored
  enclosure can't be offered (deleted, or a Lifecycle status such as
  Fostered — returning to foster would need a Foster placement with a
  carer, not built yet) the picker starts empty with a note saying why.
  Rejected: not hospitalised, deceased, future dates, dates before the
  admission, Lifecycle targets. Same admin/staff role boundary as send.
  With a proper way back, "Move enclosure" is now hidden while in hospital
  and `moveResidentToEnclosure()` rejects hospitalised residents, so the
  edit form's Housing section can't record a `ChangeEnclosure` out of the
  Hospital pseudo-enclosure (it shows the return link instead). Vet visit
  records still only offer "Send to hospital": a discharge isn't tied to a
  visit the way an admission can be.

- **Foster and adopt (2026-09-20):** one page for both,
  `/residents/[id]/rehome`, with a Foster / Adopt toggle (`?type=` picks
  the default; a fostered resident defaults to Adopt because the usual case
  is the carer adopting). `rehomeResident()` in
  `src/lib/placements/rehome.ts` inserts a single `Foster` or `Adopt` row
  into the Lifecycle/Fostered or /Adopted pseudo-enclosure with `carer_id`
  set, so `resident_current_state.current_status` / `current_carer_id`
  come out right with no view changes; `previous_enclosure_id` is the
  enclosure they left so a return can offer it back. No migration: enum
  values, pseudo-enclosures, `carer_id` + its Carer-type trigger and the
  admin/staff insert policies all existed since 0001. Transitions: Foster
  is allowed from Resident/Outreach, Hospitalised (a fostered animal the
  shelter treated can go straight back to its carer — the form pre-selects
  the carer from the placement before the hospital stay) and Fostered
  (change of carer; same carer rejected). Adopt is allowed from the same
  states. Nothing is allowed from Adopted except **Return to shelter**
  (`/residents/[id]/rehome/return`, `returnResidentToShelter()` — a
  `ReturnToShelter` row into a physical enclosure, picker defaulting to
  the enclosure they left from, same capacity warning as moves), which also
  serves fostered residents. Adoption ends the shelter's medical
  responsibility, so "Send to hospital" is refused for adopted residents
  but still offered while fostered. "Move enclosure" is now refused (and
  hidden, including on the edit form) while fostered or adopted, since a
  `ChangeEnclosure` out of a Lifecycle enclosure would misrecord the
  return. The per-status list of offered actions is a single table,
  `availablePlacementActions()` in `src/lib/placements/available.ts`, read
  by the hub card, the housing section and the vet-visit links, so the
  four surfaces can't drift. **Carer picker:** the dev database had no
  contacts at all, and Contacts management isn't built, so the picker
  offers existing Carer contacts *or* an inline "add a new carer" form
  (name required; phone / email / LINE ID optional) that inserts a Carer
  contact right before the placement — two statements, not one
  transaction, on the grounds that a stray carer contact is harmless. Same
  admin/staff role boundary as hospital placements. The foster-carer
  portal role is tracked in the backlog.

- **Adopted residents leave the public pages; fostered ones stay
  (2026-09-20):** `0025_public_views_exclude_adopted.sql` changes
  `public_resident_profiles` and `public_resident_photos` from "not
  deceased" to `current_status not in ('Deceased', 'Adopted')`. Lutan's
  call: an adopted animal is no longer available so it must not be listed;
  a fostered one still is (foster-to-adopt is the common path), so it stays.
  A public "recently adopted" page is a possible later feature and is noted
  on the public-pages backlog item — it would read `Adopt` rows from
  `placement_history`, not these views. Found and fixed in the same
  migration: Supabase's default privileges grant INSERT/UPDATE/DELETE on
  every new `public` object to `anon` and `authenticated`, and
  `public_resident_profiles` is simple enough to be auto-updatable, so
  with the view owned by the RLS-bypassing migration role an anonymous
  `PATCH /rest/v1/public_resident_profiles` was accepted (verified: HTTP
  200 on a no-op filter before, `permission denied` after). Everything but
  SELECT is now revoked on both views. **Any future view granted to
  `anon` needs the same revoke**, and this is worth re-checking on the
  production project at go-live alongside the 0016 grant.

- **Deceased workflow (2026-09-20):** recorded from the resident hub's
  details card (a small icon beside the edit pencil, admin/staff only) →
  `/residents/[id]/deceased`, which takes date of death, cause of death and
  notes, spells out what will happen, and asks for confirmation in a dialog
  before submitting. The insert is an ordinary `Deceased` placement into the
  Lifecycle/Deceased pseudo-enclosure via `src/lib/placements/deceased.ts`,
  exactly like the other placement actions; everything else follows from it.

  **The record becomes read-only, in the database (`0026_deceased_workflow.sql`).**
  Triggers on `residents`, `placement_history`, `vet_appointments`,
  `prescriptions`, `immunization_records`, `weight`, `procedures`,
  `blood_tests` and `attachments` reject every insert/update/delete for a
  resident whose active placement is the Deceased pseudo-enclosure. The user
  will define later which fields may still be edited after death, so the
  starting point is "none" — and being a database rule rather than hidden
  buttons, it holds for a stray deep link, a future feature, or a direct SQL
  session. The workflow's own follow-up writes (the 7.2 cascade, the archive
  bookkeeping) announce themselves with a transaction-local
  `app.deceased_lock_bypass` setting rather than being exempted by role, so
  the exemption can't leak into an ordinary staff write. The UI hides every
  write control anyway (edit form, photo uploader and photo actions, log
  immunization / book vet visit / log blood test, move and hospital) so
  nobody meets a trigger error in normal use. Recording a death is
  deliberately not undoable from the app — flagged below as an open
  question.

  **Two fixes this turned up.** `resident_current_state.current_status`
  never actually returned `'Deceased'`: its first CASE branch tested the
  *zone* name, but the Deceased pseudo-enclosure lives in the Lifecycle
  zone, so the dead read as ordinary `'Resident'` — which would have let a
  deceased animal through the `current_status.neq.Deceased` filters on the
  immunization and vet-visit pickers, and (found when this branch was merged
  with the foster/adopt work) meant 0025's rewritten public views were not
  in fact hiding deceased residents from `/adopt`, since they filter on
  `current_status not in ('Deceased', 'Adopted')`. 0025 read correctly and
  behaved wrongly; this is the fix that makes it do what it says. And `handle_deceased_placement()`
  (0002) ran `security invoker`, but staff have only SELECT policies on
  `vet_appointments` and `prescriptions`, so for the role most likely to
  record a death, "cancel future appointments" and "end active
  prescriptions" silently matched no rows; it's `security definer` now, for
  the same reason `close_prior_placement()` became definer in 0024.

  **Where it can be recorded from.** The record-death icon shows for any
  status except Deceased itself, including Fostered and Adopted — an
  adopter or foster carer reporting a death is a real case, and making
  someone record a Return to Shelter first would put a fictional placement
  in the history. That deliberately sits outside
  `availablePlacementActions()` (which ends the shelter's chain at Adopted)
  because the entry point is the hub's details card, not the Housing card's
  action row. Worth confirming with the shelter.

  **Drive archive.** After the placement commits, the app moves
  `Residents/<Name> (<ID>)/` to `Residents/Deceased/<Name> (<ID>)/` (the
  convention the old `archiveDeceasedResidentFolders` Apps Script polled
  for, now done synchronously at the moment of the write — requirements doc
  Section 5.1), then writes two files into that folder: the deceased summary
  PDF (Section 7.6) and `index.html`, an offline index page. A Drive move
  re-parents the folder, so every Drive file ID already stored stays valid.
  The two halves are deliberately separate units of work: the database
  transition is the source of truth and commits regardless, and if Drive
  fails the hub shows the archive as incomplete with a retry. Every step is
  re-runnable — the move no-ops once the folder is in the archive, and both
  generated files are replaced in place rather than duplicated.

  **`index.html` is the cold-storage play.** The plan is to move deceased
  residents' folders off Drive onto local storage so Drive stays free for
  current residents, so the folder has to be readable on its own: opening
  that file gives the whole animal back (details, medical history, photo
  gallery, file index) with inline CSS and *relative* paths
  (`Photos/<Category>/<YYMM>/<file>`, `Blood Tests/<YYYYMMDD>/<file>`) into
  the folder's own subfolders. No network, no app, no fonts to fetch; Drive
  links sit alongside as a convenience while the folder is still on Drive.
  Photo tiles whose file isn't present fall back to a caption card rather
  than a broken image.

  **Archive artefacts are English-only** (their labels, not the data): a
  permanent record shouldn't read differently depending on the app language
  of whoever recorded the death. Resident data is reproduced verbatim,
  Thai included. The PDF embeds Noto Sans Thai (regular + bold, ~45KB each)
  as base64 data URIs in `src/lib/archive/fonts/` — @react-pdf's built-in
  Helvetica has no Thai glyphs and silently emits unreadable glyph IDs, and
  on the Workers runtime there's no filesystem to read a .ttf from and no
  reason to make the archive depend on a font CDN staying up. SIL Open Font
  License 1.1.

- **Prescriptions (2026-09-20):** one form, `/prescriptions/new`, reached
  from three places — the hub's prescriptions card, the Prescriptions tab,
  and an "Add prescription" link on each row of the Vet Appointments tab
  (which preselects the visit and defaults the start date to it, as the
  blood-test form does). The tab splits records into **Current** (no end
  date, or one today or later — a course dated to start later sits here
  with a "Starts …" note) and **Expired** (end date has passed). Deceased
  residents get no add controls and the form page refuses them up front;
  the 0026 lock would reject the insert anyway.

  **The AppSheet shape had no dose, and its implicit unit was "tablets".**
  `0027_prescriptions.sql` fixes that in the data model rather than in
  notes: a `dose_unit` per **medication** (tablet, capsule, ml, mg, g, mcg,
  IU, drop, sachet, application, dose) and a `dose_quantity` per
  prescription in that unit. The unit lives on the medication, not the
  prescription, on purpose — "Amoxicillin 250mg tablet" and "Amoxicillin
  suspension" are two medication rows, so every prescription of a given
  medication is in the same unit and totals per medication add up. IV
  fluids are simply a medication measured in ml. The vocabulary is a check
  constraint plus i18n enum labels (`t.enums.doseUnit`), like the other
  fixed lists; a reference table would have needed its own admin page and
  Thai labels for no gain at this size.

  **Forecasting.** `frequency` gained `doses_per_day` (twice daily = 2,
  every 8 hours = 3, every other day = 0.5, null = "as needed") and eight
  starter rows, and `medication_daily_requirement` sums
  `dose_quantity × doses_per_day` per medication across prescriptions that
  are current today for residents who are neither deceased nor adopted —
  the same exclusion `immunization_compliance` applies. Recording a death
  therefore drops that resident out of the forecast immediately, and the
  7.2 cascade ending their open prescriptions is belt-and-braces on top.
  The view exists ahead of a page for it (backlog) so the numbers are
  right from the first prescription entered.

  **Cascade adjustment.** The new `end_date >= start_date` check would have
  made 0026's cascade fail for a prescription dated to start *after* the
  death (recorded today, starting tomorrow), rolling the death back.
  `handle_deceased_placement()` now ends such a row on its own start date
  (`greatest(date_of_death, start_date)`) — it never becomes current, and
  the forecast excludes the resident regardless. Verified against real rows
  in a rolled-back transaction before applying.

  **Who can write.** Staff had SELECT-only on `prescriptions` and no policy
  at all on `medication`/`frequency` — so the hub's `medication(name)`
  embed had been coming back null for staff and volunteers. 0027 grants
  staff and volunteers read on both reference tables, staff insert/update
  on prescriptions, and staff + vet insert on medication/frequency so
  either can add a new one inline from the form. Nobody below admin can
  edit or delete a medication, since changing its unit would silently
  redefine every prescription using it. A `vet_appointment_id` FK (no
  cascade, per the 7.2 lesson) links a prescription to the visit it was
  written at.


- **Repo workflow and migration tracking (2026-09-20):** the deceased
  workflow was built in one session, pushed, never PR'd, and the next
  session (prescriptions) had to branch from it because it needed
  migration 0026 — so PR #1 carried both. Three fixes so it doesn't
  recur, all chosen for a single developer working locally:

  - `CLAUDE.md` now states the rules every session follows: start from an
    up-to-date `main`, refuse to branch while a `claude/*` branch is
    unmerged, one branch per feature, and a session ends with its PR
    merged and the branch deleted. A `README` section carries the human
    version.
  - `.githooks/post-commit` pushes after every commit (enabled per clone
    via `core.hooksPath`), so GitHub can't drift from the checkout.
  - `scripts/apply-migrations.mjs` replaces hand-POSTing SQL to the
    Management API. It keeps a `schema_migrations` table in the target
    database, applies only pending files (each in its own transaction with
    its bookkeeping row), and has `--status`, `--dry-run` and a one-off
    `--baseline` used to record 0001–0027 on the dev project, which had
    been migrated by hand. The database, not a memory note, now says what
    has been applied — and the same script does production on go-live.

- **Weight (2026-09-20):** one form, `/weight/new`, reached from three
  places because that's where weighing actually happens: the hub's Weight
  card and the Weight tab (a routine shelter weigh-in), a "Log weight" link
  on each vet appointment row (every visit starts on the scales — the link
  preselects the visit and defaults the date to it, like blood tests and
  prescriptions), and a weight field on the intake form, which
  `record_intake` writes as the first reading in the same transaction as
  the resident (0029). `weight.vet_appointment_id` (0028) is an FK with no
  cascade, per the Section 7.2 lesson, and `weight_kg > 0` is now checked
  so a mistyped zero can't sit on the chart as a collapse.

  The Weight tab leads with three figures — latest, change since the
  previous reading, change since the first — in kg and %, then a line
  chart (`src/components/WeightChart.tsx`, hand-rolled SVG rather than a
  charting dependency: one series, ~250 lines). Two deliberate choices
  there: the x axis is real time, so a six-month gap between readings looks
  like six months rather than one step; and the deltas are neutral in
  colour, since whether "up" is good depends on the animal (a thin intake
  gaining is good, an old dog gaining may not be) and the app has no body
  condition score to judge by. The list under the chart is the table view
  of the same rows, so the chart is never the only way to read a value.
  Below two readings the chart isn't rendered — one point isn't a trend.
  Volunteers still have read-only access to `weight` (0001), so the Log
  weight button fails for them; whether volunteers and foster carers should
  weigh is left with the foster-portal item in the backlog.

  **Found along the way:** the dev database had never received migration
  0006 (the vet-visit booking function and staff policies) even though it
  was baselined as applied, so every booking from `/vet-visits/new` failed
  with "could not find the function schedule_bulk_appointments". 0030
  re-applies 0006 in re-runnable form; it's a no-op on a database where
  0006 did run.

- **Thai dates in the Buddhist Era (2026-09-20):** `formatDate` and its
  siblings had pinned Thai to the Gregorian calendar
  (`th-TH-u-ca-gregory`) on the theory that a +543 year shift could confuse
  medical records. The user's call is the opposite: Thai staff read and
  write BE dates day to day, so Gregorian years in Thai text are the thing
  that reads wrong. Now `th-TH-u-ca-buddhist`: display only, since dates
  are stored and posted as ISO Gregorian and the browser's native date
  inputs stay Gregorian (so a Thai form shows 2569 in text beside 2026 in
  the picker — accepted). The Drive archive documents stay English/Gregorian.

- **Procedures (2026-09-20):** one form, `/procedures/new`, reached the
  same three ways as weight minus intake: the hub's Procedures card and
  tab, and a "Log procedure" link on each vet appointment row (preselects
  the visit, defaults the date to it). Three choices worth recording:

  **The type is a lookup table, not free text.** 0001 had
  `procedures.procedure_type text`; 0031 replaces it with
  `procedure_types` + `procedure_type_id`, seeded with the common ones
  (X-ray, ultrasound, teeth cleaning, spay/neuter, microchipping, wound
  treatment, nail clipping, ear cleaning, grooming, surgery) and
  extendable inline from the form by staff and vets — the same shape as
  medications on the prescription form, and what the blood-test-types
  backlog item asks for. A re-typed name is matched case-insensitively to
  an existing type before a new row is created. Renaming or merging types
  is SQL until an admin page exists (backlog).

  **Staff can log procedures.** 0001 made procedures vet/admin-write
  because they're nearly always a vet's work, but nail clipping, ear
  cleaning and grooming happen at the shelter, so 0031 gives staff
  insert/update (as 0027 did for prescriptions). "Done at the shelter" vs
  "at a vet visit" is simply whether `vet_appointment_id` is set — no
  extra flag; the form's unlinked option reads "No linked visit — done at
  the shelter".

  **Files hang off the procedure.** 'procedure' joins
  `attachment_owner_type` (0031) and `attachment_resident_id()` learns to
  resolve it (0032 — split out because an enum value can't be used in the
  transaction that added it, so the deceased lock covers procedure files
  too). Uploads go through `/api/procedures/[id]/attachments` into
  `Residents/<Name> (<ID>)/Procedures/<Type> <YYYYMMDD>/` — the legacy
  convention from Section 5.1, one folder per procedure so an X-ray's
  images and its discharge sheet stay together. The folder name is kept in
  `attachments.sub_folder` so the deceased archive's relative paths
  survive a type rename. Because an X-ray often arrives after the record
  does, the Procedures tab lets you attach files to an existing row, not
  just right after saving — the blood-test tab still only offers upload at
  creation, which is a gap to close the same way. `BloodTestAttachmentUploader`
  became the generic `AttachmentUploader` (URL and wording as props) so
  both records share one drop zone.

- **Enclosure maintenance (2026-09-20):** migration 0033 turns the 0001
  placeholder `maintenance` table into the real thing. Status vocabulary
  is now `Not Started / In Progress / Blocked / Completed` (user-confirmed;
  the enum values were renamed in place, closing "still open" item 3). A
  job has a nullable `enclosure_id` (a zone-wide job — the path, the fence
  line — sets `zone_id` alone; a trigger derives `zone_id` from the
  enclosure otherwise, so they can't disagree), `estimated_cost` and
  `actual_cost` in baht, a `due_date` (what "overdue" means on the board),
  a sequential `job_code` (`M-0001`, same reasoning as `animal_code`) and
  a cached `drive_folder_id`. `date_completed` is stamped/cleared by the
  same trigger as the status changes. Files use the polymorphic
  `attachments` table (owner type `maintenance`, present since 0001) with
  a new `phase` column (`before` / `after`) — the user asked for before and
  after to be told apart by the app rather than by sub-folders, so they
  sit side by side in the job's folder. `maintenance_photos` (0001) is
  left unused for the same reason blood tests moved off their own column:
  one attachments path, one photo proxy lookup.

  **Drive layout (user-specified):** `Projects/Shelter Projects/Enclosure
  Maintenance/<Zone>/<Enclosure>/<Status>/<M-0001 Title>/<file>`, with
  `Zone-wide` in place of the enclosure name for zone-wide jobs. The job
  folder follows the job: `syncMaintenanceJobFolder()` in
  `src/lib/google/drive.ts` runs on every upload and after every status,
  title or location change, reads the folder's *current* parents from
  Drive and moves/renames it if they don't match — so the database stays
  the source of truth and a move that failed mid-way (Drive 5xx) is
  repaired by the next change rather than needing a manual fix. A job
  that has never had a file has no folder at all (no Drive calls for a
  bare job). Drive folder-name matching is case-insensitive on Google's
  side, which is why the pre-existing `Shelter projects` folder was
  reused rather than duplicated. Note the dev Drive also holds a legacy
  AppSheet tree under the same root (`<Enclosure>/Active|Completed/<date>
  (<id>)/Work to be Done/`) — those jobs aren't in the database. Confirmed
  2026-09-21 that the tree only holds test folders, so no migration is
  needed; were real ones ever to appear they'd get `M-` codes and be
  moved into the new layout by the same sync.

  **UI:** `/maintenance` is a four-column Kanban from `lg` (two columns
  at `md`, native HTML5 drag and drop, no library) and a status-chip list
  below `md`, since touch can't drag; a tap opens `/maintenance/[id]`,
  which has thumb-sized status buttons and separate Before / After photo
  sections with their own uploaders. Colour is split by meaning: the
  column says status (grey / blue `--info` / yellow `--warning` / green —
  two new tokens in `globals.css`), a card's left edge says urgency (red
  overdue, orange due within 3 days). The Completed column shows the last
  30 days by default. `/maintenance/new` keeps the photos on the same
  form as the details — picked while filling it in, uploaded on Save with
  per-file progress and retry, then on to the job — because the user
  didn't want the medical forms' save-then-upload second step. The
  enclosure hub's placeholder card now lists that enclosure's open jobs.
  Roles: staff/admin log, edit and move jobs (RLS from 0001); volunteers
  see everything and may add photos (`volunteer_rw_attachments`), which
  is the split 0001 already encoded.

- **Project work as a folder tree (2026-09-20):** migrations 0034/0035
  turn the 0001 `project_folders` placeholder into a file-system-style
  browser at `/projects`. The user's shape: `/Projects/` at the root, a
  *fixed* second level of twelve categories (Shelter Projects, Community
  Projects, Community Outreach, Visitors and Volunteers, Social Media,
  Puppies, Sterilisations, Donations, Fundraising Campaigns, Events,
  Rescues, Miscellaneous), then user-defined folders to any depth, every
  folder able to hold photos and its own info card (Thai title, story in
  both languages, date, location, cover photo, "show on website").

  **Categories are rows, not a virtual level.** Each is a `project_folders`
  row with `parent_folder_id null` and `name = top_level_category`, seeded
  by 0034. That way `/projects/[id]` and the breadcrumb serve every level
  with one mechanism, and a category caches its Drive folder ID like any
  other folder. Triggers refuse a new root, refuse renaming/moving/
  deleting a category, derive every folder's `top_level_category` from
  its parent (and cascade it down when a folder is moved across
  categories — 0035, after the rollback harness caught that the cascade
  trigger was declared on a column a move never sets), and refuse cycles.
  Sibling names are unique case-insensitively because the name is also
  the Drive folder name. `name` stays the English title; `name_th` is the
  Thai one, picked by locale with English fallback (the free-text
  strategy item in the backlog still applies to the story text).

  **Photos are `attachments` rows** (`owner_type = 'project'`, an owner
  type since 0001), the same call 0033 made for maintenance: one photo
  proxy lookup, one uploader, one set of Drive helpers. `caption`,
  `caption_th` and `sort_order` were added to `attachments` as nullable
  columns only project photos use (precedent: `phase`). `project_photos`
  stays unused like `maintenance_photos`. A folder's cover is
  `cover_attachment_id` (FK, `on delete set null`); the
  `project_folder_summary` view supplies per-folder subfolder/photo
  counts and a thumbnail (cover, else newest photo) so the grid is one
  query.

  **Drive mirrors the tree exactly:** `Projects/<Category>/<folder>/…`.
  `ensureProjectFolderPath()` walks the ancestry using each row's cached
  `drive_folder_id` and finds-or-creates by name only for levels never
  synced (so the pre-existing `Projects/Shelter Projects` that maintenance
  uses is reused, not duplicated). Rename and move update Drive *after*
  the row is saved and report a warning rather than failing the save —
  the database is the source of truth. A folder that has never had a
  photo has no Drive folder (no Drive calls for a bare folder). Only an
  empty folder can be deleted from the app, so a folder action never
  removes a file. In dev the first upload into a fresh three-level path
  took ~45s (three find-or-creates plus the upload); later uploads into
  the same folder are one call.

  **Roles:** staff/admin create, rename, move, describe, publish and
  delete folders (the 0001 `for all` policies); volunteers browse and add
  photos (`volunteer_rw_attachments`), which is the split 0001 already
  encoded — no RLS change was needed. Nothing is public yet: `is_public`
  is stored but the "Our work" page (backlog, Public website) is where a
  `security_invoker`-free public view gets built, following 0025.
- **In-app user manual (2026-09-21):** `/manual`, reachable from the
  sidebar by every signed-in role (the proxy already gates it). The
  user's brief was a first English draft "to get a feel for it", with
  screenshots, knowing it will change as the app does — so the choices
  optimise for cheap regeneration rather than polish.

  **Content is data, not JSX.** `src/lib/manual/en.ts` is a typed tree
  (sections → topics → steps / screenshot / callouts / roles) and
  `src/app/manual/page.tsx` only lays it out. Editing the manual means
  editing prose in one file, and a Thai edition later is a second file
  of the same shape picked by locale — it is *not* in the i18n
  dictionary, because paragraphs of prose would swamp the UI strings and
  the Thai pass should wait until the screens settle. Only the nav label
  (`nav.manual`) is translated today.

  **Screenshots are generated, not hand-made.** `scripts/manual-screenshots.mjs`
  drives the machine's installed Edge/Chrome through `playwright-core`
  (no browser download) against the running dev server: it opens a
  visible window on `/login`, waits for a person to sign in as an admin,
  discovers a plain-status resident, an enclosure, vet, contact and
  project folder from the lists, then captures every screen the manual
  references into `public/manual/` (desktop 1280×800 at 1.5×, full-page
  for forms; one phone capture with the drawer open; the public pages
  from a signed-out context). The script never handles credentials, so
  it needs no test-account plumbing and works against production later.
  File names are the contract between the script and `en.ts`. The images
  are committed so a fresh clone renders the manual; re-run the script
  after a screen changes rather than retouching a PNG.

## Still open (from Section 11 of the requirements doc)

1. Exact per-table RBAC permission matrix beyond the role descriptions —
   the RLS policies in `supabase/migrations/0001_initial_schema.sql` are a
   working first pass, not signed off.
2. Whether `immunization_history` is distinct from `immunization_records`
   in the live data — needs confirmation against the actual Sheets data
   during migration. Current schema has only `immunization_records`.
3. ~~Exact current values for `maintenance.status`~~ — resolved
   2026-09-20: `Not Started / In Progress / Blocked / Completed` (0033).
4. Whether Supabase Storage should be used for anything (e.g. small UI
   assets) alongside Drive — not used yet; default is to avoid it for
   consistency unless a concrete need comes up.
5. Exact current Line-messaging URL pattern for the "tap to message"
   contact action — `contacts.line_id` field exists; confirm the URL
   pattern (`https://line.me/ti/p/~{line_id}` assumed) against the live app.
6. Immunization stock forecast (doses due in 7/14/30/90 days) needs a
   re-vaccination interval per `immunization_types`, which isn't in the
   documented data model — need to confirm this against the live sheet
   before adding an `interval_days` column and a forecast view.
7. **Legacy Drive folder IDs vs. `animal_code` (found 2026-09-19):** the dev
   Drive account's `Residents/` tree already contains real
   legacy-migrated animals folder-named `<Name> (<8-char-hex-id>)` — that
   hex ID is the old AppSheet row ID. New residents entered through this
   app instead get a sequential `animal_code` (`R-0001`, …). When real data
   migration (Section 9 of the requirements doc) actually happens, a
   migrated resident's Drive folder needs to be matched to its existing
   hex-ID-named folder (to avoid creating a duplicate, differently-named
   folder for the same animal) — likely by having the migration script set
   `animal_code` to the legacy hex ID for migrated rows, or by matching
   folders by resident name at migration time and recording whatever ID
   that folder already uses. Not resolved here; flagging so it isn't lost
   before that step is scoped.
8. **No way to undo a recorded death (2026-09-20):** the deceased workflow
   locks the resident's whole record at the database level and its cascade
   (cancelled appointments, ended prescriptions) isn't reversible
   record-by-record, so a mis-click can only be corrected in SQL today. The
   record-death page says so and asks for confirmation. Worth deciding
   whether admins should get a proper "this was recorded in error" path —
   and, separately, which fields the user wants to stay editable after
   death (the locked-by-default choice above is waiting on that answer).

- **Procedure types get their own Admin page, not a shared one (2026-09-21):**
  the backlog suggested combining the procedure-types admin with the
  medications/frequencies one. Medications had already gone under
  Management (a manager's forecast, not configuration), and the frequency
  list has its own open item to move to Admin with an RLS question still
  to settle, so folding them together would have stacked three lists on
  one page and blocked this one on that decision. `/admin/procedure-types`
  follows the one-page-per-lookup pattern the Admin section already has
  (zones, enclosures, immunization types); when frequencies move they get
  `/admin/frequencies` beside it. Merge is a database function
  (`merge_procedure_type`, 0047) like 0043's, so the move-and-delete can't
  half-complete; delete is refused in the action while any procedure
  references the type (the FK has no cascade — the procedure is medical
  record). Renaming or merging doesn't touch Drive: a procedure's folder
  name (`Procedures/<Type> <YYYYMMDD>/`) is read at upload time, so files
  already uploaded stay where they are and later ones go under the new
  name; the merge hint on the page says so.

- **One form for a record and its files (2026-09-21):** `BloodTestForm` and
  `ProcedureForm` used to save first and only then swap in an
  `AttachmentUploader`; staff wanted the files picked with the details.
  The pattern `MaintenanceForm` already had — pick files on the form, save
  the record, post the queued files to its attachment route one at a time
  with progress, move on when they're all up, retry or skip a failed one —
  is now `useDeferredUploads()` in `src/components/DeferredUploads.tsx`,
  with `FileDropZone`, `PendingFileList` and `UploadProgressPanel` around
  it, and all three forms use it. Two consequences worth knowing: the
  forms drive the server action from an `onSubmit` handler inside a
  transition (not a `<form action>`) so the upload round follows the save
  in one place, and the record is committed before the first upload
  starts, so a failed file never loses the record — the panel keeps the
  user on the page to retry, with a link on to the tab if they'd rather
  skip it. With no files picked the form goes straight to the tab; the
  old "saved, now attach" interstitial is gone. Later additions go in
  from the tab's per-row "Attach files" toggle, which the Blood Tests tab
  now has like the Procedures tab. Uploads stay sequential — the routes'
  Drive folder check-then-create isn't safe for two first uploads at once.

- **Free text across languages: a translations table, managers write the
  other language by hand, machine drafts later (2026-09-21):** the UI is
  bilingual but staff-typed prose showed in whatever language it was
  typed. The three options in the backlog item were weighed with the
  user; the chosen shape is a *draft → review → publish* pipeline whose
  draft is written by a human today and by a model later, so the plumbing
  is built once. Migration `0056_translations.sql`:

  **Which fields.** `translatable_fields` lists (table, column, tier).
  Only the *public* tier is in it: `residents.bio` /
  `temperament_notes` / `past_story_notes` (on `/adopt`),
  `project_folders.summary` and `attachments.caption` (on `/our-work`) —
  the text a reader who didn't write it sees. Internal notes (weight,
  vet visit, prescription, intake, cause of death, behaviour) are
  deliberately not listed: nobody will translate those by hand and a
  queue full of "gave 2ml amoxicillin" would be ignored within a week,
  which would leave a Thai vet nurse seeing *less* than today. They join
  as the `internal` tier when the machine phase lands (backlog), shown to
  staff as a labelled machine translation under the original with no
  review step. Promoting a field is a row in the config table, not a
  migration; the queueing trigger reads the config at run time.

  **One side table, not paired `_th` columns.** `translations` holds one
  row per translatable field per record: `text` in the other language,
  `status` (`pending` / `draft` / `approved` / `stale`), and
  `reviewed_source_text`, a snapshot of the original the translation was
  written against. That snapshot is the reason for the table: a paired
  column can't say whether the English changed after the Thai was
  written, so the "go through and update" job would mean re-reading
  every bio. The trigger compares the source against the snapshot and
  flips an approved row to `stale`, and the queue shows old and new
  original side by side so the manager fixes the Thai rather than
  starting over. The queue is therefore a query, not a hunt. Existing
  `summary_th` / `caption_th` (0034) were copied in as approved rows and
  the columns dropped, so translated prose has one home. Short labels
  are different — `residents.thai_name` and `project_folders.name_th`
  are a second value (a Thai name, a folder name that is also the Drive
  folder name), not a translation — and stay as columns; `localized()`
  in `src/lib/projects/public.ts` still serves those.

  **No language dropdown.** `detect_language()` reads the script of the
  text: Thai has its own Unicode block, so one script with a three-to-one
  majority of letters decides, otherwise the script the text *starts* in
  does (a Thai sentence carrying an English drug name has more Latin
  letters than Thai; it starts in Thai). A bio retyped in the other
  language flips the row's direction and clears the old text. Empty or
  purely numeric text counts as English.

  **Who writes it.** The two bilingual managers. `approveTranslation`
  writes the text and approves it in one step (the text is theirs, so
  there is nothing further to review); RLS gives management/admin write,
  every signed-in role read; the trigger is security definer so a staff
  member saving a bio gets a pending row without write access. The
  `draft` status exists for a non-manager's or a model's text and is not
  produced by anything yet. `/management/translations` is the queue —
  stale first, then oldest — with every row's editor open; the same
  `TranslationPanel` sits under the bio on the resident hub and under a
  project story / photo caption for managers, so translating right after
  writing and working through the queue are the same action on the same
  row. Staff and volunteers don't see the panel unless there is a
  translation in their language to show.

  **Who sees what.** Public views expose the approved rows as a
  `translations` jsonb (`{column: {lang, text}}`, `approved_translations()`)
  and `localizedField()` picks by locale with the original as fallback —
  a record is never hidden for lacking a translation (0042's rule, now
  for every field). A draft or stale translation never reaches the
  public. Signed-in pages load rows and show the original as typed; a
  project story / caption still swaps in the approved translation for a
  Thai reader as it did before. `translation_queue` (an ordinary view,
  signed-in roles only) adds the record's label and path so the queue
  page is one query.

  **Not done, by choice.** No machine translation (backlog: Workers AI
  on the same Cloudflare account — the app already deploys there via
  OpenNext, so a cron Worker with the `AI` binding fills `text` with
  `status = 'draft'` and the manager's job changes from "write" to
  "check" — or a local Ollama box if one appears; both zero cost, open
  models). No badge count in the nav (`NavLinks` is a client component
  with no data; the queue page is the job list). `site_content` Thai
  columns (backlog) could go through the same table by giving the
  trigger a `site_content` entry — noted on that item.
