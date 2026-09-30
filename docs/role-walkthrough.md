# Role walkthrough

A full pass over the app **one role at a time**: sign in once as a Vet, do
everything a Vet does end to end, then change role and do the next one. Copy
this to `docs/uat/<yyyy-mm-dd>.md`, fill it in as you go, and commit it on
whatever branch is to hand.

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

Do this first even though the Vet pass is what you want to get to. It seeds the
things the later passes consume, and finding an empty reference list here costs
a minute where finding it mid-Vet-pass dead-ends the pass.

- [ ] Signed in as admin in profile A; `/admin` opens
- [ ] `/admin` says **Photo storage (Google Drive) is connected** — if it is red, every photo step below will fail and you want to know now rather than blame the role
- [ ] Reference lists are non-empty: **Immunization types**, **Procedure types**, **Blood test types**, **Frequencies**, **Zones and enclosures**. An empty one is an Admin-pass finding — note it, populate enough to test with, carry on
- [ ] **Management → Vets** has at least **two** clinics — the Vet pass records against the test account's own clinic and needs a second one to prove other clinics' records are read-only. Write the two names: own `________`, other `________`. Each clinic has a managed **doctors** list (`0102`); on the own clinic, add at least one doctor at **Management → Vets → Doctors** so the visit form has someone to offer
- [ ] **Management → Medications** and **→ Diets** each have at least one item with a stock figure
- [ ] Pick a **test resident** and write its name here: `________`. Use the same one through every pass so the medical, placement and photo history builds up in one place and you can read it back at the end
- [ ] **Give the test resident history from *both* clinics.** A vet sees a resident only if it has a vet visit, prescription, procedure or blood test from their clinic (`0108`). Record, as admin, one vet visit at the **own** clinic (so the resident is in scope) and one visit — plus, if you can, a prescription — at the **other** clinic (so there is a foreign record to find read-only)
- [ ] Set the test account's role to **staff**, then **Management → Recurring jobs**: create a job due **today**, assigned to the **test account**, on a frequency you can see. This seeds the **Staff** and **Volunteer** passes — it is the job each marks done. Note its name: `________`
- [ ] **A vet cannot be given a job.** The assignee picker offers shelter roles only (`claude/recurring-jobs-eligible-assignees`), so once the role is **vet** (next step) open the job form and confirm the test account is **not** in the picker. Before this fix the seed could be done for a vet, which exposed 2026-09-27 findings 5 and 6; that setup is impossible by design now
- [ ] Set the test account's role to **vet**, then check the picker as above
- [ ] **Set the test account's clinic** at **Settings → Security**: on the test account's row, choose the **own** clinic (`user_roles.vet_id`, `0102`). It only takes for an account whose role is `vet`, hence this step comes after the role change. **Without a clinic the vet sees no residents at all** (0.9.0's lead note), and Pass 1 dead-ends on its first line

---

## Pass 1 — Vet

The narrowest role, and the only one that is *external* to the shelter. A vet
sees **their own clinic's residents** and the medical record, and nothing about
running the place. The interesting lines are almost all negative.

**Menu must show:** **Appointments** and **Residents**, then the footer group —
Manual · Release notes · Change password. Nothing else (`src/app/NavLinks.tsx`).
A vet's home is Appointments, not My tasks (#227, `docs/decisions/2026-09-29-vet-appointments-page.md`).
**Menu must NOT show:** My tasks, Enclosures, Maintenance, Vets, Contacts, Projects,
Stocktake, Management, Settings, Security.
**Header must NOT show:** the Assistant button — the vet role is external and
the assistant is closed to it (`0070`).

- [ ] Menu matches the above, exactly — tick only after reading it item by item

### Can do

- [ ] **Signing in lands on Appointments** (`/appointments`), not My tasks. Typing `/my` redirects there too
- [ ] **Appointments** shows the clinic's visits in three groups — **To write up** (date passed, not marked done), **Upcoming**, **Recently done** (last 30 days) — each with a count. A clinic with no visits reads as empty, not broken. Write what it shows: `________`
- [ ] A row's resident name opens that resident; its links log a procedure, blood test, prescription or weight (the last two only once the visit has started) or edit the visit, and the record saved is **linked to that visit**
- [ ] Only **this clinic's** appointments are listed, whichever doctor they are booked with. (A vet account with no clinic set sees an explanation instead — check from Admin → Security if you want to see it)
- [ ] `/residents` **names the clinic** at the top and lists **only that clinic's residents**; the test resident is there. Find it by search
- [ ] **Clinic scoping, negative half:** a resident with no record from this clinic is **absent** from the list, and typing its URL is refused
- [ ] Its hub opens; **info**, **medical** and **placement** tabs all load
- [ ] **Log an immunization** — type, date, vet; it appears in the medical list
- [ ] **Record a vet visit.** The clinic choice offers **only the vet's own clinic**, and the doctor is **chosen from the clinic's roster**, not typed free-hand (`0102`, `claude/vet-visit-form-scoping`). It appears with the doctor's name
- [ ] **Add a prescription** — medication, dose, dates; it appears and reads as current. Try to link it to a visit **in the future**: refused (`0107`)
- [ ] **Record a diet.** Then clear the **end date** on a phone-width window (or a real phone): the date can be emptied and the save keeps it empty (`mobile-date-clear`)
- [ ] **Log a weight**; the weight history updates. Attach it to a visit that **already has a weight**: refused (`0106`). One weight per visit
- [ ] **Log a procedure** — type, date, notes
- [ ] **Log a blood test**, and **attach a file to it**. This is the one Drive-backed write a vet does; if it fails, check `/admin`'s Drive line before calling it a role problem. A PDF shows a file-type icon rather than a broken thumbnail
- [ ] **Add a resident photo** — vets can, and it is easy to assume they cannot. There is **no folder picker**: it files under **Medical** and nowhere else
- [ ] **Manual** opens on the **vet's** view of the roles topic ("Roles — who can do what"), and topics a vet cannot do carry the right role badges
- [ ] **Release notes** opens showing what a vet is affected by, and lists the current version
- [ ] **Change password** page loads

> **Not in this pass yet:** recording a microchip number as a vet
> (`microchip-vet-feature`, `0116`) is not merged. Do not score its absence as a
> failure; it gets a line here when it ships.

### Other clinics' records are read-only

On the test resident's medical tab, the **other** clinic's records still show
(visits, prescriptions, procedures, blood tests) — a vet may read the whole
history. But they are not theirs to change (`0110`):

- [ ] The other clinic's **vet visit**, **prescription**, **procedure** and **blood test** each show, with no working edit or delete
- [ ] Opening **Edit** on one (by button, or by typing the URL) says it is **read-only** rather than opening a form
- [ ] The **own** clinic's records from the Can-do list above are editable
- [ ] In the visit form, the other clinic is **not** offered

### Must not be able to

Reach each by **typing the URL**, not just by looking for a missing button. A
hidden button with an open route is the bug worth finding.

**Every refusal below should land on `/no-access`, inside the app** — the page
that says the role is not permitted, with the app's header and menu around it.
This is the test for 2026-09-27 finding 6 (a refusal used to render the public
home page, which is also what tipped the test site into Cloudflare 1102) and it
is the single thing the last run most wants confirmed. Write what you actually
saw for the first one: `________`

- [ ] `/my` — redirects to `/appointments` (not refused; a vet has no My tasks)
- [ ] `/vets` and a clinic page `/vets/<id>` — refused → `/no-access`
- [ ] `/contacts` — refused → `/no-access`
- [ ] `/enclosures`, and a zone and an enclosure page — refused → `/no-access`
- [ ] `/projects` — refused → `/no-access`
- [ ] `/maintenance` — refused → `/no-access`, like everything else. (It is gated by `requireRole(isShelterRole)`; an earlier version of this script asked whether an empty board read as "no jobs" — that question is gone, the vet no longer gets a board at all)
- [ ] `/stocktake` — refused → `/no-access`
- [ ] `/management` and `/management/dashboard` — refused → `/no-access`
- [ ] `/management/vets/<id>/doctors` — the **Doctors roster screen** is management and admin only; a vet may not open it, and cannot rename, merge or retire doctors
- [ ] `/admin` and `/admin/security` — refused → `/no-access`
- [ ] `/deliveries` — refused → `/no-access` (delivery roles are admin/management/staff)
- [ ] Resident hub shows **no** New resident / Edit / Move / Hospital / Foster / Adopt / Record a death controls
- [ ] `/residents/<id>/edit`, `/move`, `/hospital`, `/rehome`, `/deceased` typed directly — all refused
- [ ] A resident **outside the clinic's scope** typed by URL — refused, not shown
- [ ] **Photo upload to any folder but Medical** — the route answers **403**. With no folder picker there is nothing to click, so this needs the browser's network tools or a `fetch` from the console; if you cannot do that, write "not run" rather than tick it
- [ ] The Assistant slide-over cannot be opened by any route you can find
- [ ] The vet is **not** offered when a recurring job is assigned (checked in Pass 0; look again from the admin profile if the picker was touched)

**Anything odd:**

### What a completed Vet pass lets someone sign

Every vet fix's test plan reads `Manual verification by: pending`, and pending on
precisely the lines above. When this pass has been run and every line ticked or
written up, **Lutan** can sign *Manual verification by* on these plans — the line
names who looked; nobody signs for them, and a plan whose line here failed or
was not run stays pending.

| Test plan (`docs/test-plans/`) | Covered by |
|---|---|
| `vet-scope-navigation` | Menu, and every `/no-access` refusal |
| `vet-clinic-resident-scope` | Residents list names the clinic; scoping both halves |
| `vet-cross-clinic-writes` | Other clinics' records are read-only |
| `vet-visit-form-scoping` | Visit form: own clinic, doctor from roster |
| `vet-doctors-roster-screen` | Roster screen refused to a vet (the roster itself is an Admin/Management pass line) |
| `recurring-jobs-eligible-assignees` | Pass 0: vet absent from the picker |
| `prescription-no-future-visit` | Prescription, future-visit refusal |
| `one-weight-per-visit` | Weight, second-weight refusal |
| `role-based-manual` | Manual opens on the vet's view |
| `release-notes-by-role` | Release notes opens on the vet's view |
| `medical-photos-profile` | Photo: Medical only, no folder picker, 403 |
| `mobile-date-clear` | Diet end date cleared on mobile |
| `file-type-icon` | Blood-test attachment shows a file-type icon |

**Known risk to the run itself:** Cloudflare **1102** on the test site (finding
17) is unresolved — `ORIGIN_HOST` is still empty in `wrangler.jsonc`. Finding
6's fix lightens the CPU path but does not remove the mechanism, so the run may
be cut short. If it is, record where and mark the rest "not run"; do not read a
`curl` from another machine as evidence either way (`docs/uat/2026-09-27.md`
says why).

---

## Pass 2 — Staff

The widest day-to-day role and the longest pass. Everything the shelter does to
a resident, minus the reporting and the reference lists.

**Switch:** profile A → Security → test account → **staff**. Hard refresh B.
**Menu gains:** Stocktake, and the Assistant button in the header.
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
- [ ] Medical: staff can do everything the vet pass did — spot-check **one** write (a weight) rather than repeating all seven
- [ ] **Add resident photos**
- [ ] **Maintenance**: log a job, put it on the board, change its status through to Completed
- [ ] A job assigned to the test account appears on **My tasks**, and the urgent badge counts it
- [ ] **Projects**: add a photo; create a folder and write the story
- [ ] **Stocktake**: count one medication, tick "same as last time" on another, leave a third blank. Afterwards confirm blank meant *untouched* and the tick meant *counted now*
- [ ] **Deliveries**: record a delivery of a medication with a cost dated **before** the stocktake you just did, and another **after**. This and the figures it feeds went out in 0.7.0 unverified
- [ ] **Assistant**: ask it something, and let it **write** — staff have write access. Check the resulting record actually exists
- [ ] `/contacts`: read a contact and its channels

### Must not be able to

- [ ] `/management/*` — redirected: dashboard, cashflow, stock-usage, recurring-jobs, translations, shelter-friends, medications, diets, vets, contacts
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

- [ ] `/admin` opens and **every tile is reachable** — Security, Website, Zones, Enclosures, Immunization types, Procedure types, Blood test types, Frequencies, Contacts, Vets, System status
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
- [ ] **Vets**: add a vet with a doctor name; it appears in the vet-visit picker
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

Sees nearly everything and may change almost nothing. Short pass, high value:
this is where an over-permissive write is most likely to be sitting.

**Switch:** test account → **volunteer**. Hard refresh.
**Menu:** Stocktake present (volunteers walk the shelves), Management and
Settings absent. Assistant button **present** — but read-only.

### Can do

- [ ] `/residents` reads; a hub opens and its tabs read, including medical
- [ ] **Move a resident between enclosures** — one of only two things a volunteer writes
- [ ] **Add a photo** to a resident and to a project — the other one
- [ ] **Stocktake**: count items and submit
- [ ] **My tasks** lists the maintenance jobs they are on, and the Pass-0 recurring job
- [ ] **Mark a recurring job done** — volunteers can, even though they cannot write maintenance status
- [ ] **Assistant** opens and answers a question
- [ ] `/enclosures`, `/vets`, `/contacts`, `/projects` all read

### Must not be able to

- [ ] **Change a maintenance job's status** — buttons absent on My tasks *and* on the board, and the action refused if reached. The manual promises "ask a staff member"; check the app agrees
- [ ] **Log or edit a maintenance job**
- [ ] **Intake**, edit, hospital, foster, adopt, record a death — controls absent, routes refused
- [ ] Any **medical write** — immunization, vet visit, prescription, diet, weight, procedure, blood test. All seven refused; volunteers *read* medical records
- [ ] **Assistant cannot write** — ask it to record something and confirm it refuses rather than writing
- [ ] `/deliveries` — redirected. Volunteers count stock but do not record deliveries
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
- [ ] `/my`, `/residents`, `/enclosures`, `/maintenance`, `/stocktake`, `/vets`, `/contacts`, `/projects`, `/deliveries`, `/management`, `/admin` — **every one** redirected or refused, typed directly
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
