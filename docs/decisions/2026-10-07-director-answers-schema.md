# 2026-10-07 — Four of the Director's answers that were schema (`0155`)

On 2026-10-07 Lutan sat down with the Director and answered a 13-question decision brief. Four answers were small schema
changes, and CLAUDE.md folds them into one PR ("if two streams both need schema, their migrations go in one schema PR"). They
are one sitting, so one file keeps the reasoning together. **One section per brief question**, so the chain from the sitting
to the code can be followed: question number → answer → what `0155_director_answers_schema.sql` and the app now do.

| Brief question | Backlog item | Answer | Section of `0155` |
|---|---|---|---|
| q6 + q7 | Contacts: who should see a carer's phone and address? | Management and the 2IC; the 2IC sees name and phone, no address | 2 |
| q8 | Management cannot record a microchip | Management can (option A) | 1 |
| q12 | Who may see a Shelter Friend's card | Staff keep it; delete N3 (option A) | 3 |
| q5 | Does the 2IC record immunizations, and see what a vaccine costs? | She records them and must not see the price (option C) | 4 |

## q6 + q7 — carer contacts: Management and the 2IC, and what that does and does not close

**The answer.** Option **A** of the contacts item (*"management only"*), plus the 2IC by name, and from q6 the 2IC sees **name and
phone, no home address**. Management: everything. 2IC: name and phone. Staff and volunteers: nothing.

**What was built.** A new Yes/No cell, `contacts.browse` (catalogue sort 57), held by Management and the 2IC (Admin implicitly).
`/contacts` and `/contacts/[id]` ask it (`requirePermission("contacts.browse")`, the route registry, so the menu entry follows).
It is its own cell, not a change to `contacts.directory`, for the reason in the next paragraph. The 2IC's `scope_contacts` moves
from `name_type` (a vet's id, name, type: no phone) to `name_phone`, the scope the two pages already honour by reading
`volunteer_contacts`. `0134` had revoked that view from every session when the volunteer lost the address book and kept it "for a
role given that scope later"; this is that role, so `0155` re-grants it and gates its rows on `contacts.browse` **and** the login
not reading the whole address book (`sees_all_contacts()`, `0147`), which is exactly the 2IC. A real volunteer holds no cell and
reads no row, as since `0134`.

**The good news the brief understated: the carer pickers keep working for staff.** Option (a) leaves the RLS alone, and the cell
that gates the pages is not the cell the policies ask. So a staff member doing an intake or a rehome still chooses a carer, and a
foster pick-up still names one; what staff lose is the **directory** (the browsable list with phones and addresses). The brief's
*"staff and volunteers can no longer phone a carer at all"* is true of the directory and not of the pickers. The counter-case the
item records (*"a volunteer doing a foster pick-up needs the carer's number"*) is real and is now "ask Management", as the Director
accepted; if it bites, the fix the item names is a narrower read (name and phone for that role), not a reversal.

**The bad news: the concern that started the item is not closed by A alone.** The item's whole worry was *"a volunteer shouldn't be
able to look up a carer's home address"*. With the RLS left alone, **a staff login can still read every contact's phone and
address by sending the request by hand with its own token**, exactly like findings C9 and C10 (*the pages refuse both, so nothing
on screen shows it; a request sent by hand would be answered*). A volunteer cannot (they hold no contacts cell). So A gives
**screen privacy, not data privacy**. Option (c), a `picker_carers`-style view for the pickers and then a narrowed
`contacts_select_perm`, is the data-level fix. **It was not built** (Lutan chose A; (c) is a view, a policy and a pass over every
reader) and is filed on the `backlog` branch as *"Carer contacts: close the data hole behind the pages"*, so the decision is
recorded rather than quietly assumed to have closed the concern. The contacts item itself stays **open** with a status line.

## q8 — Management can record a microchip

**The answer.** Option A, also the roles paper's recommendation: the handbook was right and the system was wrong.

**What was built.** The item describes three edits: the function's role list, `MICROCHIP_WRITE_ROLES`, and a line in
`scripts/check-resident-microchip.mjs`. **Two of the three had moved on.** `MICROCHIP_WRITE_ROLES` no longer exists in
`src/lib/residents/microchip.ts` (it survives only as a fixture row in `scripts/fixtures/legacy-predicates.json`, which now says
Management `true`): the app already asked `can(perms, "resident.microchip")`, so the form was already Management's to show if the
cell said so. What was still wrong was the cell (Management held none) and `set_resident_microchip()` (`0116`), which named admin,
staff and vet. `0155` gives Management the cell and rewrites the function to ask `has_permission('resident.microchip')`, which
also takes a role name out of a function body; the vet's own-clinic scope is not a cell and stays as `0116` had it. The harness
gained a Management write (and a refusal on a deceased resident). The roles paper's §4 row for `resident.microchip` now says Yes for
Management, and `check-permission-tables` no longer asserts the old "none today".

## q12 — staff keep the Shelter Friend card, and N3 goes

**The answer.** Option A, with a reason that settles it: *"staff can see it on the website anyway as anonymous, so no need to hide
this."* The Friends band is public, so hiding a Friend's card from staff in the app protects nothing.

**What was built.** A Yes/No **Read** cell, `friends.view` (sort 58), held by Management and staff. `shelter_friends_select_perm`
is now `friends.view` or `friends.manage`; the second half `0147` carried (*"contacts.directory Read and sees_all_contacts()"*) is
gone, so the policy asks cells only. **Known tightening N3 is deleted** from `scripts/lib/permission-probes.mjs`, and that probe is
now keyed to `friends.view` (a probe asks the cell its policy asks; the old one asked `friends.manage`, which staff do not hold,
which is why it was a known tightening in the first place). One difference worth saying: a custom role with the full contacts
scope and `contacts.directory` Read used to read friends through the old second half and now needs the cell; none exists on dev or
production.

**An honest consequence of q6/q7.** After the contacts pages became Management's and the 2IC's, **no staff screen reads a Shelter
Friend any more** (the card lived on the contact hub). So the cell is a statement about the data, as the Director put it, rather than
a screen staff will see. It is still the right shape: it keeps the database and the Director's answer in step, and it is the cell
someone ticks if staff are ever given a Friends page.

## q5 — the 2IC records vaccinations and must not see what a vaccine costs

**The answer.** Option C: keep `medical.immunizations` Edit on the 2IC, but give the picker a price-free view, exactly as `0151`
did for medicines and diets.

**What was built (copying `0151`, not inventing a second pattern).** `picker_immunization_types`: **id, name, is_mandatory,
interval_months**. The brief said "id, name and dose"; **the table has no dose column** (`0001` + `0007` + `0071`: name, mandatory
flag, interval, cost). `interval_months` is needed because the recording action reads it to compute the next-due date, and
`is_mandatory` drives the form's hints; neither is a price. Rows for a login holding `medical.immunizations` Read or `reference.types`
Read (the old table audience), so every screen that showed a vaccine name still does. **App first:** the Log immunizations picker,
the recording action's embed, the resident page's and section's embeds and the archive record now read the view under the same alias
(`immunization_types:picker_immunization_types(name)`), so the row types did not change. **Then the policy:** `immunization_types_select_perm`
asks `reference.types` Read only (the cell that is meant to see a price: Settings → Immunization Types). Insert, update and delete
are `0148`'s, unchanged. The vet's `vet_rw_immunization_types` is untouched, so the vet still reads cost: that is C3, the vet half
the parked clinics work owns, and it stays recorded as a known tightening rather than being "tidied".

**One audience caveat, as in `0151`.** On dev the 2IC holds `medical.immunizations` because dev carries the Director's draft matrix; on
production she holds nothing until the draft is applied. The view admits by cell, so it follows whichever is true.

## Parity: before and after

Baseline given in the brief: **1,913 / 26 / 21**. **That did not reproduce**: at this checkout the harness runs 253 probes (2,024
answers), not 245 (1,960). The brief's figure came from an earlier checkout, so probes added on `main` since are the likely cause (not re-measured), and `0151`'s own run hit
the same drift. The migration is already applied to dev, so a clean "before" cannot be re-run against it; the honest account is the
delta by cause, below, measured after.

After (`check-permission-parity`): **1,971 match / 23 known tightening / 21 mismatch**, 9 harness faults.

- **21 mismatches: unchanged and all the vet's.** All 21 lines read `vet: the default says ALLOWED, the database REFUSES`
  (`visit.book`, the `medical.*` cells, `photos.resident_add`, `reference.add_while_recording`, `resident.adoption_news`): the
  Director's draft against the paper, which Lutan declined to convert (q4). **It stays red and was not tidied**; none of the 21
  lines touches contacts, friends, microchip or immunizations.
- **Known 26 → 23 is not all this PR's.** What this PR moves is **N3 (staff, `friends.view` read) leaves the list**: staff's
  answer is now an ordinary match. The remaining two are not attributable to anything this PR touches, and I could not measure them: the migration is applied.
- **A new Read cell for staff on `shelter_friends`** → the friends read probe is keyed to `friends.view`; staff now match.
- **Management gaining microchip write** → the microchip probe's Management answer changes from "none, none" to "cell, database"
  and still matches; the Layer 2 fixture row (`MICROCHIP_WRITE_ROLES`, management) flips to `true` and still matches its paired cell.
- **`contacts.browse`** is not probed: the pages are its only reader and the database has no statement that answers it (reason in
  the probe file's "not probed" list, which now stands at 11 of 58).
- `check-policy-role-names`: **vet 54, unchanged** (GREEN). `check-permission-tables` ends **HARNESS-KNOWN-RED** on the same vet lines.
  Its counts moved on purpose: 58 activities; Management 52 cells (49 + `contacts.browse`, `friends.view`, `resident.microchip`);
  staff 39 (38 + `friends.view`); 696 answers (6 roles × 58 × 2). `check-role-can` had a stale 660 and now says 696.

## Left alone, on purpose

- **The vet's immunization read, and the vet half of C10 for Friends.** The parked clinics work.
- **`check-contact-visibility` and `check-2ic-role`** were already red before this PR (the first replays `0126` over a later
  `app_users`, the second compares the live dev matrix with `jobs.ts` while dev holds the draft). Not touched.
- **Production apply is Lutan's, before the deploy**, because the app reads `picker_immunization_types` and asks the two new cells.
  `--dry-run` then apply `0155`, from the main checkout. The `-- consumer:` header names every reader.
