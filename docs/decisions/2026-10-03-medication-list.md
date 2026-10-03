# The medication list: a reference to read, and the four small questions answered

2026-10-03, `claude/medication-list`. Spec: `docs/roles-and-permissions.md` §14.
Lutan's ruling that shaped it: *"We will not record medication given, the head of
medical can purely just view what medicine should be given."*

## What was built, and what was deliberately not

Management → Medication list (`/management/medication-list`): every resident with
a prescription that falls today, grouped by zone then enclosure, each with photo
and name, then each medicine with its label photo, the amount and how often. One
read of `prescriptions` (with `medication`, `frequency`, `residents`) and one of
`resident_list_view` for where each resident lives. **No migration.**

It is read-only by construction: a server component with no form, no server action
and no client component. There is no "given", "skipped" or "refused", no reason, no
timestamp and no history, because the round was ruled out. **The consequence is
recorded, not overlooked:** the system holds no record that a dose was given, by
whom or when. If a record is ever wanted (a clinic asking whether a course was
finished, a controlled medicine), it is a new backlog item that starts from this
list, not a gap in this one. *Stock between counts* goes on comparing stock used
with what was *planned*.

## Who opens it, and where the tile lives

The page uses `requireManagementUser()` (admin and management), the audience §14
names for "as soon as it ships". Nothing new was invented: no activity, no role
check of its own, and nothing reads `has_permission()` yet. Staff can read
prescriptions through RLS today, but the backlog item's own wording opened the
list to Management and Admin first, and the Head of Medical's role does not exist
until R2 (`medical-role`).

The tile sits on the Management landing page, between Vets and Medications,
because the Head of Medical's home screen does not exist yet. **What moves when
`home-screens` lands:** the tile becomes the Head of Medical's, and the guard
changes from `requireManagementUser()` to the Read check on
`medical.prescriptions` that R2 introduces. The page body does not change.

## The four small questions

**Residents not on site (in hospital, fostered, out in the community):** *listed
apart*, in a closing section "Not in an enclosure today", with their status. Left
off would mean a hospitalised animal on a course of medicine simply vanishes, and
the person with the list would have to guess whether that was a mistake. Listed
apart, it is plainly "not here". The section's note says their medicine is not
given here. Deceased and adopted residents are left out; a resident with no
placement on record is listed apart as "No enclosure recorded".

**"Every 2 days" and the like:** *shown only on the days it falls due*, worked out
from the start date, as §14 proposed. `src/lib/medication-list/due.ts` mirrors
`prescription_doses_between()` (0044): the first dose is on the start date; days
and weeks repeat from it; months are calendar months from the start date, the 31st
clamping to the end of a short month. Per-day frequencies are always due. A
prescription with **no schedule** ("as needed", or no frequency) is *shown*,
labelled "As needed", never hidden: it has no day to fall on, and hiding it would
look like a missed animal. `scripts/check-medication-list-due.mjs` loads the real
file and asserts both edges of each boundary (day before, day of, day after; the
31st in a 30-day month and in February in leap and non-leap years). A course that
ends today is marked "Last day of the course". A prescription that starts in the
future is not "current today" and is not shown.

**Times of day:** none invented. `frequency` holds a count per day and no clock
times, so the list says "3 × a day" and no more. If the shelter gives medication in
fixed rounds, that is the Head of Medical's knowledge, not the system's.

**No signal in the kennels:** not solved, noted. The page says so in one line at
the foot ("open this list at the office first and carry it round"). The list is
read-only and fully server-rendered, so a copy loaded at the office stays readable
while walking; whether a phone keeps the tab alive across the kennels, and whether
the photos still show, is for someone to check on site once.

## Walking order

Zones and enclosures have no sort column, and §14 forbids a migration, so "walking
order" is **zone name, then enclosure name, with numbers compared as numbers**
("Kennel 2" before "Kennel 10"). Residents within an enclosure are by name. The
shelter's names carry their own order today ("Front Zone - White", "Brown Enclosure
4"); if the real walking route differs from alphabetical, an explicit order is a
schema change for a later item, and `loadMedicationList` is the one place to add it.

## Phone-first

Built and checked at 375 px from the first screen, in English and Thai. One column
of flex lists (not a bare `grid`, the cause of the sideways scrolling that
`2026-10-03-phone-width.md` describes), `min-w-0` and `break-words` on every name,
80 px photos for animal and label, large type for the name and the amount. The
Thai translation of a zone or enclosure name is used when one is set, and the
English name otherwise.
