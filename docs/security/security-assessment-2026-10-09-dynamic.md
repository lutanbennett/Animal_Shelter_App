# Security assessment, addendum: the dynamic half (2026-10-09)

The 2026-09-30 assessment (`security-assessment-2026-09-30.pdf`) read the code. It listed
*"Dynamic testing against a running instance"* under *Not reviewed*. This addendum is that test: it
asked the **running dev database** what each kind of login can actually read and change, rather
than what the policies appear to say. Dev and test only; production was not touched.

## In plain words

- **Nothing new is open to the public.** A visitor with no login reaches only the public website's
  own views and five harmless functions (the shelter's date and time zone, whether a Drive file is public, and the caller's own role), exactly what `check-public-views.mjs` already checks
  (250 checks, 0 failures today).
- **A person with no role, an archived (offboarded) person, and the public-viewer login** see only
  the website's text and pictures, the names of the medicine rounds, and the facility map layout.
  They cannot change anything through the tables.
- **Four things turned up that no check had asked about.** Each is now its own backlog item:
  1. **A vet login can read, rename, add and delete every project and maintenance photo record**
     (146 rows on dev), not just its own clinic's. *Medium.*
  2. **Any signed-in login, even one with no role, can reset which rounds a medicine is given at**,
     if it knows the prescription's id. It changes the medication list quietly. *Medium-low.*
  3. **Every signed-in login, including the public viewer and archived people, can read the
     facility map tables.** *Low.*
  4. **A vet login sees the name and role of every login in the system** (not their emails). *Low.*
- **Two things you will see in the results are already known and decided**, so they are not
  findings here: staff can read `contacts` directly (being fixed as `carer-contacts-picker-view`,
  batch 81), and the vet keeps its access through the clinic scope rather than through its cells
  (`docs/decisions/2026-10-09-perm-convert-vet.md`), which is why the vet's parity lines are red.

## Method

`node scripts/probe-role-surface.mjs` (new, in this PR). It does not assert a list. For every
table and view in `public` (the only schema the Data API exposes: a request for `storage`,
`private` or `extensions` is refused with `PGRST106`, and `pg_graphql` is not installed) that
`anon` or `authenticated` holds any grant on, 100 relations, it asks under each principal's own
JWT, in one rolled-back transaction per principal:

| | |
|---|---|
| read | rows `select count(*)` sees |
| update | rows `update … set <first column> = <itself>` reaches, then undone |
| delete | rows `delete` reaches (cascades included), then undone |
| insert | a copy of a real row with a fresh id: refused by RLS, or got past RLS (inserted, or stopped later by a constraint or trigger), then undone |

Principals: `anon`; a login with **no role**; an **archived** staff login; `public_viewer`;
`volunteer`; `staff`; `vet` (linked to a clinic as a doctor); the three configured roles
(`head_of_maintenance`, `head_of_medical`, `second_in_command`); `management`; `admin` at `aal1`
and at `aal2`. Every role in the `roles` table is covered.

Functions were taken separately, because they cannot be probed generically: every function in
`public` that `anon` or `authenticated` may execute (102), and for the 33 that run as their owner
(`security definer`) and are not triggers, whether the body asks who the caller is. The ones that
do not were then called as a login with no role.

Separately, over HTTP with the anon key: the exposed schemas, `/graphql/v1`, the OpenAPI root
(refused), an `rpc` call (refused), Storage (`/storage/v1/bucket` and an object list both return
`[]`), and the auth settings (on dev: Google and email enabled, `disable_signup: true`).

## What each principal reaches (internal tables and views, `public_*` excluded)

| principal | relations it reads | writes it can make |
|---|---|---|
| anon | 0 | none |
| no role / archived / public_viewer | 5: `site_content`, `site_content_photos`, `site_pages`, `facility_maps`, `rounds` | none through the tables (but see surprise 2) |
| volunteer | 15 (who-and-where, enclosures, zones, recurring jobs, `app_users` without emails) | none |
| head_of_maintenance | 19 | maintenance jobs, assignees, photos; 2 maintenance attachments |
| head_of_medical | 36 | weights |
| second_in_command | 45 | stock, prescriptions, immunisations, maintenance, rounds |
| vet | 44, scoped to its clinic except as below | its clinic's visits, prescriptions, blood tests, diets, doctors; the `immunization_types` list and new medicines, frequencies and procedure types (C3, C7 in the roles paper: known); **all project and maintenance attachments** (new) |
| staff | 67 | the shelter floor, as the cells say |
| management | 70 | as the cells say |
| admin (`aal1`) | 78 | everything except `roles`, `role_permissions`, `user_roles` |
| admin (`aal2`) | 78 | everything, including the three above |

Three inserts looked as if they got past RLS only because a trigger or check stopped the copied row first (`maintenance`, `placement_history`, `project_folders`). Re-tried with valid rows as a no-role login, a volunteer and the Head of Medical: `maintenance` and `placement_history` are refused by RLS, and `project_folders`' trigger cannot see the parent folder, so nothing is written.

Things the probe confirmed hold, worth knowing so nobody "fixes" them: an `aal1` admin cannot
change roles or grant a role (the `*_requires_aal2` policies); no principal below admin can insert
a `user_roles` row naming itself admin; `schema_migrations`, `audit_log`, `permission_activities`,
`roles` and `role_permissions` answer nobody but admin; every internal view that runs as its owner
(`app_users`, `current_placement`, the pickers, the stock and medication-list views) returns nothing
to the no-role, archived and public-viewer logins.

## The four surprises

### 1. The vet's attachment policies are a deny-list (Medium)

`vet_read_attachments`, `vet_update_attachments`, `vet_delete_attachments` and
`vet_write_attachments` (0110, carried unchanged by 0167) let a clinic login through for any
`owner_type` **not** in `('resident', 'blood_test', 'procedure')`, and `vet_can_write_attachment()`
ends `else true`. Project and maintenance photos are the other two types, so they fall through.
Under a vet's JWT on dev: reads 144 project and 2 maintenance attachment rows, renames all 144,
deletes all 146, and inserts a new project attachment. `vet_read_translations` has the same shape
(`table_name <> 'residents'`), so the vet also reads the Thai translations of maintenance jobs,
recurring jobs, project folders, Shelter Friends and site pages.

Why no check saw it: `check-perm-convert-vet.mjs` and the parity probes test the vet against
clinical rows, which is where the scope was designed to bite; nothing asked about project photos.
Why it is not covered by the vet decision: that decision kept *"today's access"* deliberately, but
the access it meant was clinical. Project photos are the shelter's public-facing pictures.

Attacker: an outside clinic's login, or anyone holding its session. Impact: project pictures on
the public site can be removed or replaced by a hand-made request; no screen offers it. Mitigation:
turn the four policies (and the translations one) into allow-lists, which is a re-runnable
migration of a few lines; about an hour with a harness. Whether the vet should see project photos
at all is Lutan's call, so the item asks.

### 2. `reset_*_rounds()` can be called by anyone signed in (Medium-low)

`reset_prescription_rounds(uuid)`, `reset_frequency_rounds(uuid)` and `reset_diet_rounds(uuid)`
(0137, 0138) run as their owner, ask nothing about the caller, and are granted to `authenticated`.
Only triggers call them; no app code does. As a login with **no role**, which reads 0
prescriptions, `reset_prescription_rounds(<id>)` replaced a prescription's custom rounds (`morning`)
with its frequency's defaults (`morning,evening`). `check-medication-rounds.mjs` asserts that
`norole` cannot write `prescription_rounds` through the table, which is true, and so did not look
through the function.

Attacker: anyone with a login, including an archived former volunteer, who has a prescription,
diet or frequency id (ids are UUIDs, so they need to have seen one). Impact: the medication list
shows a dose at the wrong round, silently. Mitigation: `revoke execute … from authenticated` on the
three (the triggers that call them also run as owner, so nothing in the app changes); ten minutes
plus a harness line.

### 3. The facility map tables answer every signed-in login (Low)

`facility_maps_read` (0142) and `map_rooms_read` (0157) are `to authenticated using (true)`, kept
on purpose when the writes converted (0150, 0158). That includes `public_viewer`, a login with no
role and an archived person, which the app-access gate otherwise keeps out of every internal table.
It is the shelter's layout (plan geometry, which enclosure is where), not personal data. Mitigation:
add `has_app_access()` (or `has_shelter_floor()`) to the two read policies. `rounds` is open the same
way, but `check-medication-rounds.mjs` asserts it on purpose and it holds only the round names, so
it is not filed.

### 4. A vet sees every login's name and role (Low)

`app_users` hides emails from vets and volunteers but not names, roles or `archived_at`, so an
outside clinic's login lists all 57 people with a login and what role each holds. The volunteer
sees the same, which the recurring-jobs pickers need; the vet has no screen that uses it.
Mitigation: narrow the view for a clinic login to the doctors of its own clinic, or decide it is
fine and write that down.

## Not covered

- **Production.** Every number here is dev. Production's auth settings (above all whether
  `disable_signup` is on there, which decides whether a stranger's Google sign-in can become a
  no-role login) were not read; Lutan can check *Authentication → Sign In / Providers* by hand.
- **Inserts are probed with one copied row**, so a scoped insert policy may allow other rows; the
  vet's project-photo insert above was tested by hand with a project row for that reason.
- **Functions that run as the caller** were not called: RLS applies inside them, so they reach what
  the table probe already shows.
- **Storage**: no buckets and no storage policies exist; files live in Google Drive, whose routes
  are covered by the 2026-09-30 report.
- **Rate limits, brute force and Cloudflare** are out of scope (the original item says not to fuzz).

Raw matrix: `node scripts/probe-role-surface.mjs --json` regenerates it; the run behind this
addendum was on dev at `main` + this branch, 2026-10-09.
