# Role walkthrough

A full pass over the app **one role at a time**: sign in once as a Doctor, do
everything a Doctor does end to end, then change role and do the next one. Copy
this to `docs/uat/<yyyy-mm-dd>.md`, fill it in as you go, and commit it on a
feature branch and open a PR — no exceptions to the branch-and-PR route.

It is **not** under `docs/test-plans/`, and must not be moved there. That
directory is the per-feature gate `scripts/check-test-plan.mjs` enforces, and a
walkthrough filed there would satisfy a feature PR's gate with no feature
verified — the same reason `docs/release-smoke-test.md` lives outside it.

## How this differs from the other two lists

| | Covers | Run when |
|---|---|---|
| `docs/test-plans/<feature>.md` | One change, in isolation | Every PR |
| `docs/release-smoke-test.md` | The main paths, on the real build | Every production release, ~10 min |
| **This** | **Every role's whole job, end to end** | Before a milestone — go-live, a customer demo, after a big batch of merges |

The per-feature plans cannot catch a role seeing something it should not,
because each is written from inside one feature. The smoke test cannot either,
because it is run by one person in one role. **Role confusion is the defect
class this list exists to find**, so each pass has a *Must not be able to*
section, and those lines matter more than the positive ones.

---

## Before you start

| | |
|---|---|
| Site | |
| Version reported by `/api/releases/current` | |
| Database | |
| Test account | |
| Role-switching account | |
| Run by | |
| Date | |

### The role-switching mechanic

One account changes role between passes rather than six accounts existing. That
works because **the app reads the role fresh on every server render** —
`current_user_role()` is a database function called per request, not a claim
baked into the sign-in token. So:

1. **Two browser profiles, side by side.** Profile A signed in as the admin who
   changes roles. Profile B signed in as the test account, which stays signed in
   all day.
2. In A: **Settings → Security**, find the test account, set its role.
3. In B: **hard refresh** (Ctrl-F5). No sign-out, no re-sign-in. Next.js caches
   rendered segments client-side, so an ordinary refresh can show you the last
   role's page.
4. **Confirm the switch before testing anything** — the menu is the tell. Each
   pass below opens with what the menu must look like.

Two things to know rather than discover:

- **Never change your own account's role away from `admin`.** Security is
  admin-only; you would lock yourself out of the page that undoes it. That is
  why there are two accounts.
- Writes to `user_roles` need a 2-step-verified session under `0100`, but the
  Security page writes through the service-role client, which bypasses RLS. Role
  changes work today. If one is refused, that is a **finding**, not expected
  behaviour — log it and say so.

### Pass 0 — setup, as admin

Do this first even though the Doctor pass is what you want to get to. It seeds the
things the later passes consume, and finding an empty reference list here costs
a minute where finding it mid-Doctor-pass dead-ends the pass.

- [ ] Signed in as admin in profile A; `/admin` opens
- [ ] `/admin` says **Photo storage (Google Drive) is connected** — if it is red, every photo step below will fail and you want to know now rather than blame the role
- [ ] Reference lists are non-empty: **Immunization types**, **Procedure types**, **Blood test types**, **Frequencies**, **Zones and enclosures**. An empty one is an Admin-pass finding — note it, populate enough to test with, carry on
- [ ] **Management → Clinics** has at least **two** clinics — the Doctor pass records against the test account's own clinic and needs a second one to prove other clinics' records are read-only. Write the two names: own `________`, other `________`. Each clinic has its own **Doctors** list (`0102`), at **Management → Clinics → <clinic> → Doctors**
- [ ] **Management → Medications** and **→ Diets** each have at least one item with a stock figure
- [ ] Pick a **test resident** and write its name here: `________`. Use the same one through every pass so the medical, placement and photo history builds up in one place and you can read it back at the end
- [ ] **Give the test resident history from *both* clinics.** A doctor sees a resident if it has a clinic visit, prescription, procedure or blood test from a clinic they work at now (`0108`), or a clinic visit where they were the doctor (`0172`). Record, as admin, one clinic visit at the **own** clinic **with Doctor left blank** (so the resident is in scope through the clinic alone, which the Doctor pass relies on) and one visit — plus, if you can, a prescription — at the **other** clinic (so there is a foreign record to find read-only)
- [ ] Pick a **second resident** with **no** record from either clinic, and write its name here: `________`. The Doctor pass uses it for a clinic the doctor has left
- [ ] Set the test account's role to **staff**, then **Management → Recurring jobs**: create a job due **today**, assigned to the **test account**, on a frequency you can see. This seeds the **Staff** and **Volunteer** passes — it is the job each marks done. Note its name: `________`
- [ ] **A doctor cannot be given a job.** The assignee picker offers shelter roles only (`claude/recurring-jobs-eligible-assignees`), so once the role is **Doctor** (next step) open the job form and confirm the test account is **not** in the picker. Before this fix the seed could be done for a vet login (the role's name until `0172`), which exposed 2026-09-27 findings 5 and 6; that setup is impossible by design now
- [ ] Set the test account's role to **Doctor**, then check the picker as above
- [ ] **Link the test login to a doctor** at **Settings → Security**. The **Doctor (sets the clinics)** control shows on the test account's row only once its role is Doctor, hence this step comes after the role change. Either **Link to an existing doctor…** — one who works at the **own** clinic and nowhere else — or **Create a doctor from this login…** with **Works at** set to the own clinic only. The row then reads **Works at** `<own clinic>`. **That doctor's clinics are the login's clinics** (`0127`, which replaced the per-login clinic, `user_roles.vet_id`, of `0102`); the clinics themselves are changed on each clinic's Doctors list, not here. A login that reads **Not linked to a doctor** sees no residents at all (0.9.0's lead note), and Pass 1 dead-ends on its first line. Doctor linked: `________`
- [ ] **The own clinic's Doctors list is not empty.** On 2026-10-02 the test account's clinic (**Novel**, 14 residents in scope) had **no doctors** — the only lists with any were `[roster] Test Clinic` and `Mae Wang`. The list fills itself from doctors' names typed on visits (0.8.1), and Novel's visits were recorded without one, which is how a clinic ends up with residents and no doctors. Open **Management → Clinics → `<own clinic>` → Doctors** and confirm the doctor linked above is listed (it also exercises the Doctors list the Doctor pass checks is refused)

---

## Pass 1 — Doctor

The narrowest role, and the only one that is *external* to the shelter. A doctor
sees **the residents of the clinics they work at**, plus any resident they were
the doctor for, and the medical record, and nothing about running the place. The
interesting lines are almost all negative.

**Menu must show:** **Appointments** and **Residents**, then the footer group —
Manual · Release notes · Change password. Nothing else (`src/app/NavLinks.tsx`).
A doctor's home is Appointments, not My tasks (#227, `docs/decisions/2026-09-29-vet-appointments-page.md`).
**Menu must NOT show:** My tasks, Operations (and so none of Enclosures,
Maintenance, Clinics, Contacts, Projects, Stocktake), Management, Settings, Security.
**Header must NOT show:** the Assistant button — the Doctor role is external and
the assistant is closed to it (`0070`).

- [ ] Menu matches the above, exactly — tick only after reading it item by item

### Can do

- [ ] **Signing in lands on Appointments** (`/appointments`), not My tasks. Typing `/my` redirects there too
- [ ] **Appointments** shows the clinic's visits in three groups — **To write up** (date passed, not marked done), **Upcoming**, **Recently done** (last 30 days) — each with a count. A clinic with no visits reads as empty, not broken. Write what it shows: `________`
- [ ] A row's resident name opens that resident; its links log a procedure, blood test, prescription or weight (the last two only once the visit has started) or edit the visit, and the record saved is **linked to that visit**
- [ ] Only **this clinic's** appointments are listed, whichever doctor they are booked with. (A Doctor login that is not linked to a doctor sees an explanation instead — on **Settings → Security** its row reads **Not linked to a doctor**. In dev, `medphotos-vet@example.test` and the `release-role-test-…` account were left unlinked, so this is testable without unlinking anything; check their rows first)
- [ ] `/residents` **names the clinic** at the top and lists **only that clinic's residents**; the test resident is there. Find it by search
- [ ] **Clinic scoping, negative half:** a resident with no record from this clinic is **absent** from the list, and typing its URL is refused
- [ ] Its hub opens; **info**, **medical** and **placement** tabs all load
- [ ] **Log an immunization** — type, date administered, administered by; it appears in the medical list
- [ ] **Book a clinic visit** — **Book clinic visit** on the resident's **Clinic Visits** card, which opens **Book Clinic Visit** (`/clinic-visits/new`). The clinic is **only the doctor's own** — with one clinic it is shown fixed, with "Your account belongs to this clinic" under it — and **Doctor** is filled in with the linked doctor's name and cannot be changed (`0102`, `claude/vet-visit-form-scoping`, `0127`). It appears on the resident's **Clinic Visits** page (`/residents/<id>/clinic-visits`) with the doctor's name
- [ ] **Add a prescription** — medication, dose, dates; it appears and reads as current. Try to link it to a visit **in the future**: refused (`0107`)
- [ ] **Record a diet.** Then clear the **end date** on a phone-width window (or a real phone): the date can be emptied and the save keeps it empty (`mobile-date-clear`)
- [ ] **Log a weight**; the weight history updates. Attach it to a visit that **already has a weight**: refused (`0106`). One weight per visit
- [ ] **Log a procedure** — type, date, notes
- [ ] **Log a blood test**, and **attach a file to it**. This is the one Drive-backed write a doctor does; if it fails, check `/admin`'s Drive line before calling it a role problem. A PDF shows a file-type icon rather than a broken thumbnail
- [ ] **Add a resident photo** — doctors can, and it is easy to assume they cannot. There is **no folder picker**: it files under **Medical** and nowhere else
- [ ] **Manual** opens on the **Doctor's** view of the roles topic ("Roles — who can do what"), and topics a doctor cannot do carry the right role badges
- [ ] **Release notes** opens showing what a doctor is affected by, and lists the current version
- [ ] **Change password** page loads

- [ ] **Record a microchip** (#232, `0116`). Under the resident's name on their page, and at the top of their appointment, the control reads **Record chip** (or **Correct** if one is already set). 15 digits; spaces and dashes are accepted. It saves and the number shows on the page
- [ ] **A long pass can sign you out, and that is expected.** The session inactivity timeout (#261, 0.12.1) ends an idle session; the sign-in page says why and returns you to the page you were on. Sign back in and carry on. It is **not** a finding — log it only if the sign-in page does *not* explain, or does not return you to where you were

### Other clinics' records are read-only

On the test resident's medical tab, the **other** clinic's records still show
(visits, prescriptions, procedures, blood tests) — a doctor may read the whole
history. But they are not theirs to change (`0110`):

- [ ] The other clinic's **clinic visit**, **prescription**, **procedure** and **blood test** each show, with no working edit or delete
- [ ] Opening **Edit** on one (by button, or by typing the URL) says it is **read-only** rather than opening a form
- [ ] The **own** clinic's records from the Can-do list above are editable
- [ ] In the visit form, the other clinic is **not** offered

### A clinic the doctor has left

Decided 2026-10-09 (`docs/decisions/2026-10-09-clinics-and-doctors.md`, `0172`):
a doctor goes on seeing every resident they were the doctor for, at a clinic they
have since left, but may change records only at the clinics they work at now. Do
this last in the pass: for the few minutes it is set up, the login also works at
the other clinic.

- [ ] In profile A, on **Management → Clinics → `<other clinic>` → Doctors**, choose the test login's doctor under **Choose a doctor from another clinic…** and press **Add to this clinic**. Then **Book clinic visit** for the **second resident** from Pass 0 at the other clinic, with that doctor as **Doctor**. Back on the other clinic's Doctors list, **Mark as left** that doctor; it moves under **No longer at the clinic**, and the test account's row on **Settings → Security** again reads **Works at** `<own clinic>` only
- [ ] In profile B, hard refresh: the **second resident is on `/residents`** and its page and **Clinic Visits** open — a doctor still sees the residents they treated at a clinic they have left
- [ ] **Its record is read-only to them:** the visit has no working Edit (typing `/clinic-visits/<id>/edit` says it is read-only), and logging a weight or recording a chip for it is refused rather than saved. In the visit form, the other clinic is still **not** offered
- [ ] **The test resident is still listed.** Its own-clinic visit has **no doctor recorded** (Pass 0), so it is in scope through the clinic alone — the rule that keeps a visit with no doctor visible to every doctor at that clinic

### Must not be able to

Reach each by **typing the URL**, not just by looking for a missing button. A
hidden button with an open route is the bug worth finding.

**Every refusal below should land on `/no-access`, inside the app** — the page
that says the role is not permitted, with the app's header and menu around it.
This is the test for 2026-09-27 finding 6 (a refusal used to render the public
home page, which is also what tipped the test site into Cloudflare 1102) and it
is the single thing the last run most wants confirmed. Write what you actually
saw for the first one: `________`

- [ ] `/my` — redirects to `/appointments` (not refused; a doctor has no My tasks)
- [ ] `/clinics` and a clinic page `/clinics/<id>` — refused → `/no-access`
- [ ] `/contacts` — refused → `/no-access`
- [ ] `/enclosures`, and a zone and an enclosure page — refused → `/no-access`
- [ ] `/projects` — refused → `/no-access`
- [ ] `/maintenance` — refused → `/no-access`, like everything else. (It is gated by `requireRole(isShelterRole)`; an earlier version of this script asked whether an empty board read as "no jobs" — that question is gone, the doctor no longer gets a board at all)
- [ ] `/stocktake` — refused → `/no-access`
- [ ] `/management` and `/management/dashboard` — refused → `/no-access`
- [ ] `/management/clinics/<id>/doctors` — a clinic's **Doctors** list (**Management → Clinics → <clinic> → Doctors**) is management and admin only; a doctor may not open it, and cannot rename, merge or mark doctors as left
- [ ] `/admin`, `/admin/security` and `/admin/recent-changes` (#277, 0.13.0) — refused → `/no-access`
- [ ] `/deliveries` — refused → `/no-access` (delivery roles are admin/management/staff)
- [ ] Resident hub shows **no** New resident / Edit / Move / Hospital / Foster / Adopt / Record a death controls
- [ ] `/residents/<id>/edit`, `/move`, `/hospital`, `/rehome`, `/deceased` typed directly — all refused
- [ ] **No Remove control** on a weight, a prescription, a clinic visit or an immunization record (`0124`, #278). Admin, management and staff are offered it; a doctor never is (`canArchiveMedical`, `src/lib/medical-archive/kinds.ts`, checked again server-side in `src/app/residents/[id]/archive-actions.ts`)
- [ ] **A resident whose only record from this clinic was archived** (by admin or staff) has left the doctor's list — `0124` drops an archived visit from the doctor's resident scope (`current_vet_resident_ids()` then; `current_clinic_resident_ids()` and `current_doctor_resident_ids()` since `0172`). Check it reads as **absent** (gone from `/residents`, URL refused), not broken. Needs a resident seeded for it in Pass 0, or skip and write "not run"
- [ ] A resident **outside the clinic's scope** typed by URL — refused, not shown
- [ ] **Photo upload to any folder but Medical** — the route answers **403**. With no folder picker there is nothing to click, so this needs the browser's network tools or a `fetch` from the console; if you cannot do that, write "not run" rather than tick it
- [ ] The Assistant slide-over cannot be opened by any route you can find
- [ ] The doctor is **not** offered when a recurring job is assigned (checked in Pass 0; look again from the admin profile if the picker was touched)

**Not a UI line — leave it for the security review:** `0124`'s own comment says
RLS was not changed, and only admin and the vet role (Doctor since `0172`) have a
DELETE policy. The app decides who is offered Remove; a doctor cannot archive
through the UI, but whether a doctor can still hard-delete their own clinic's
visit through the API is a defence-in-depth question. Do not tick or fail it here.

**Anything odd:**

### What a completed Doctor pass lets someone sign

Every vet fix's test plan (the role was named vet until `0172`) reads `Manual verification by: pending`, and pending on
precisely the lines above. When this pass has been run and every line ticked or
written up, **Lutan** can sign *Manual verification by* on these plans — the line
names who looked; nobody signs for them, and a plan whose line here failed or
was not run stays pending.

| Test plan (`docs/test-plans/`) | Covered by |
|---|---|
| `vet-scope-navigation` | Menu, and every `/no-access` refusal |
| `vet-clinic-resident-scope` | Residents list names the clinic; scoping both halves |
| `vet-cross-clinic-writes` | Other clinics' records are read-only |
| `vet-visit-form-scoping` | Visit form: own clinic, doctor filled in |
| `vet-doctors-roster-screen` | Doctors list refused to a doctor (the list itself is an Admin/Management pass line) |
| `recurring-jobs-eligible-assignees` | Pass 0: doctor absent from the picker |
| `prescription-no-future-visit` | Prescription, future-visit refusal |
| `one-weight-per-visit` | Weight, second-weight refusal |
| `role-based-manual` | Manual opens on the Doctor's view |
| `release-notes-by-role` | Release notes opens on the Doctor's view |
| `medical-photos-profile` | Photo: Medical only, no folder picker, 403 |
| `mobile-date-clear` | Diet end date cleared on mobile |
| `file-type-icon` | Blood-test attachment shows a file-type icon |

**Known risk to the run itself:** Cloudflare **1102** on the test site (finding
17) is unresolved there. The Pi took **production** on 2026-10-01 (0.11.0), so
`lannacare.org` (`ORIGIN_HOST` = `pi.lannacare.org`) is off the CPU-limited
path; `test.lannacare.org` is not — `ORIGIN_HOST` is `""` in the `test` and
`uat` environments of `wrangler.jsonc`, so it still renders in the Worker.
`docs/pi-hosting.md` (lines 108–111) describes the optional test target that
would fix it. Finding 6's fix lightens the CPU path but does not remove the
mechanism, so a run on the test site may be cut short. If it is, record where and mark the rest "not run"; do not read a
`curl` from another machine as evidence either way (`docs/uat/2026-09-27.md`
says why).

---

## Pass 2 — Staff

The widest day-to-day role and the longest pass. Everything the shelter does to
a resident, minus the reporting and the reference lists.

**Switch:** profile A → Security → test account → **staff**. Hard refresh B.
**Menu gains:** Stocktake (a tile on Shelter Operations since 2026-10-08), and the Assistant button in the header.
**Menu must still NOT show:** Management, Settings, Security.

- [ ] Menu matches
- [ ] The Pass-0 recurring job is on **My tasks** again if its frequency brings it round; if not, note that it is absent and expected

### Can do

- [ ] **Register a new resident (intake)** end to end — the flagship staff task. Name it something obviously disposable
- [ ] The intake **capacity warning** behaves, if the enclosure chosen is at or near capacity
- [ ] **Edit** a resident's details and see the change on the hub
- [ ] **Move** the new resident between enclosures; **placement history** records it
- [ ] **Send to hospital**, then bring back; both show in placement history
- [ ] **Foster**, then **adopt** — or rehome — the disposable resident
- [ ] **Adoption updates**: add one for the adopted resident, with a photo
- [ ] **Record a death** on the disposable resident (last, since it ends its story)
- [ ] The deceased resident **disappears from `/adopt`** on the public site
- [ ] Medical: staff can do everything the Doctor pass did — spot-check **one** write (a weight) rather than repeating all seven
- [ ] **Add resident photos**
- [ ] **Maintenance**: log a job, put it on the board, change its status through to Completed
- [ ] A job assigned to the test account appears on **My tasks**, and the urgent badge counts it
- [ ] **Projects**: add a photo; create a folder and write the story
- [ ] **Stocktake**: count one medication, tick "same as last time" on another, leave a third blank. Afterwards confirm blank meant *untouched* and the tick meant *counted now*
- [ ] **Deliveries**: record a delivery of a medication with a cost dated **before** the stocktake you just did, and another **after**. This and the figures it feeds went out in 0.7.0 unverified
- [ ] **Assistant**: ask it something, and let it **write** — staff have write access. Check the resulting record actually exists
- [ ] `/contacts`: read a contact and its channels

### Must not be able to

- [ ] `/management/*` — redirected: dashboard, cashflow, stock-usage, recurring-jobs, translations, shelter-friends, medications, diets, clinics, contacts
- [ ] `/admin/*` — redirected
- [ ] **Withdraw a death recorded in error** — admin only. Control absent, route refused
- [ ] Cannot create, edit or delete a **recurring job** — staff only do the ones given to them

**Anything odd:**

---

## Pass 3 — Admin

Everything, and the only role that sees Settings. Pass 0 already touched some of
this; do not re-tick it from memory.

**Switch:** test account → **admin**. Hard refresh.
**Menu gains:** Management, Settings, and Security in the footer group.

### Can do

- [ ] `/admin` opens and **every tile is reachable** — Security, Enclosures, Zones, Facility map, Immunization types, Procedure types, Blood test types, Frequencies, Recent changes, System status. Website is a tile on `/management` since 2026-10-08
- [ ] **Security**: the user table lists accounts with roles; create a throwaway user and read its temporary password notice
- [ ] Change that throwaway's role, then archive or remove it
- [ ] **Access requests** section behaves, if any are pending
- [ ] **2-step verification** page: read what it says. The UI is in flight, so record the state it is actually in rather than assuming: `________`
- [ ] **Website**: change something public and see it on the public site
- [ ] **Zones and enclosures**: add a zone, add an enclosure to it, see it in `/enclosures`
- [ ] **Immunization / procedure / blood-test types**: add one of each, see it offered in the resident medical forms
- [ ] **Frequencies**: add one, see it offered when creating a recurring job
- [ ] **System status** renders, and its figures are not obviously wrong
- [ ] **Withdraw the death** recorded in Pass 2 — admin-only, and the one thing only this role does. The resident comes back and reappears on `/adopt`
- [ ] Drive status line still green

### Must not be able to

Admin has no ceiling, so these are about not breaking things:

- [ ] Deleting a reference type that is **in use** is refused or handled, not silently orphaning records
- [ ] Removing the **last admin** is refused

**Anything odd:**

---

## Pass 4 — Management

Staff's job plus the reporting and the reference lists. The section most likely
to be wrong in ways only arithmetic shows.

**Switch:** test account → **management**. Hard refresh.
**Menu:** Management present, **Settings absent**, Security absent.

### Can do

- [ ] `/management` landing page shows its tiles and each is reachable
- [ ] **Dashboard** renders its figures, and they are plausible against what you know is in the database
- [ ] **Contacts**: create, edit, archive a contact; an archived contact drops out of the pickers the rest of the app uses
- [ ] **Shelter Friends**: add one and see it where it surfaces
- [ ] **Clinics**: add a clinic at **Management → Clinics**, then a doctor on its **Doctors** list; the clinic is offered in **Book Clinic Visit** and the doctor is suggested for it
- [ ] **Medications**: add one; set a stock count; a blank cell clears the count to "not counted" — the *opposite* of the stocktake sheet's blank. Check both meanings hold
- [ ] **Diets**: add one; the **food forecast** recalculates
- [ ] **Stock between counts**: the deliveries from Pass 2 appear, the **Difference** column is arithmetically right, and **CSV** downloads and opens. Untested from 0.7.0 — take the time here
- [ ] **Recurring jobs**: create one, assign it to a **team**, hand a single date to someone else with a reason, and set one job to **wait for** another. Then check on My tasks that "Waiting for …" shows and clears when the first is marked done
- [ ] **Cashflow** forecast renders
- [ ] **Translations**: change a public string and see it on the public site in the other language
- [ ] Everything from the Staff pass is still available — spot-check intake and a medical write

### Must not be able to

- [ ] `/admin` and `/admin/*` — redirected
- [ ] `/admin/security` — redirected
- [ ] Cannot withdraw a death

**Anything odd:**

---

## Pass 5 — Volunteer

Rewritten 2026-10-04 for R1 (`0134` and `volunteer-read-only`): the volunteer used to see
nearly everything and change almost nothing; now they see **who each resident
is and where they live**, and the enclosures, and nothing else. Short pass; the
must-nots matter most, because every one of them is a right that used to
exist.

**Switch:** test account → **volunteer**. Hard refresh. On a phone, 375 px, in
English and then Thai: there are no PCs on site.
**Menu:** Home, Residents, Shelter Operations (its page has one tile, Enclosures),
then Manual, Release notes and Change password. **No** Stocktake, Assistant button,
Maintenance, Projects, Contacts, Clinics, Management or Settings.

### Can do

- [ ] **Home** is two tiles, Residents and Enclosures, and each opens
- [ ] `/residents` lists name, ID, enclosure, zone and status; search by name or ID; On-site / Off-site and the zone chips narrow it
- [ ] A **resident's page** shows photo, name, ID, species, sex, status, enclosure and zone, with a link to the enclosure, and nothing more
- [ ] `/enclosures` and an enclosure's page read, with the residents who live there; a resident opens its who-and-where page
- [ ] **Manual** and **Release notes** open, and the manual's volunteer topics say the same

### Must not be able to

- [ ] **Anything else on a resident** — breed, age, bio, notes, flags, microchip, carer, dates, photos, adoption news: not on the page, not in the list, not found by a chip search
- [ ] **Intake**, edit, move, hospital, foster, adopt, record a death — controls absent, routes refused when typed
- [ ] Any **medical** page, read or write — the tabs of the record and the seven "new" pages (immunization, clinic visit, prescription, diet, weight, procedure, blood test): refused
- [ ] **Add or set a photo** on a resident, a project or a maintenance job, or attach a file to a record: no control, and the upload refused
- [ ] `/stocktake` and `/deliveries` — refused. A volunteer does not count stock
- [ ] `/maintenance`, `/projects`, `/contacts`, `/clinics` — refused, and none of them is a tile on Shelter Operations or on Home
- [ ] **Assistant** — no button in the header, and no answers from `/assistant`
- [ ] `/management/*`, `/admin/*` — redirected

**Anything odd:**

---

## Pass 6 — Public viewer

Not a staff role at all: a sign-in that gets past the site lock and then sees
only the public website. Two minutes, and the one role where a leak is visible
to people outside the shelter.

**Switch:** test account → **public_viewer**. Hard refresh.

- [ ] **No app menu at all** — the nav does not render
- [ ] Lands on the public home page, not My tasks
- [ ] `/my`, `/residents`, `/enclosures`, `/maintenance`, `/stocktake`, `/clinics`, `/contacts`, `/projects`, `/deliveries`, `/management`, `/admin` — **every one** redirected or refused, typed directly
- [ ] Public pages all open: `/`, `/adopt`, one `/adopt/[id]`, `/donate`, `/foster`, `/volunteer`, `/our-work`
- [ ] A resident QR link (`/r/<code>`) opens the **public** profile, not the internal hub
- [ ] `/account/password` still opens — the one app-chrome page a public viewer needs
- [ ] No deceased or adopted animal on `/adopt`

**Anything odd:**

---

## Once, at the end — not per role

- [ ] **Language switch** to Thai on two or three pages, including one with a
      form, and back. Untranslated strings are findings
- [ ] **Phone width** — the hamburger drawer opens, the footer group comes last
      behind its divider, and a resident hub and one form are usable
- [ ] **Dates are right for Thailand.** Recurring-job dates, "overdue by N days",
      stocktake dates, delivery before/after. Workers run in UTC, so this is
      wrong for part of every day and invisible on `next dev`. Worth doing
      deliberately during Thai evening, when the two dates differ
- [ ] **Browser console clean** across everything visited — no errors
- [ ] Set the test account back to its resting role: `________`

## Result

Result: <pass | pass with accepted defects | fail>

Automated checks by: <name or `n/a: <reason>`>

Manual verification by: <**only the person who actually looked**, or `n/a: <reason>`>

### What was found

| # | Role | What | Where | Severity | Raised as |
|---|---|---|---|---|---|
| | | | | | |

### Left unchecked

| What | Why | Who picks it up |
|---|---|---|
| | | |
