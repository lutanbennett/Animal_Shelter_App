# 2026-10-04 — The volunteer's screens (R1's app half)

`docs/roles-and-permissions.md` §12 R1, the half `0134` left: the screens, the manual, the
walkthrough's volunteer pass. Nobody holds the role (Lutan, 2026-10-04), so this took access
from no one; it is what a future volunteer, and the 2IC and both Heads who will borrow the
volunteer's database rights, will meet. `docs/decisions/2026-10-04-volunteer-narrowing.md` is the
database half and the handover this follows.

## The app's list was short too, in a different way

The schema half found seven function lists where §12 said five. The app layer had the opposite
shape. `check-permission-parity.mjs` named eleven predicates (`APP_PENDING`) that "still say the
volunteer may", and **every one of them was already gone from the code**: the three sweeps had
moved every page and action onto `can()`, so there was nothing to convert. What the list was
reading was the fixture of what each predicate said before. The real gaps were elsewhere, and
found by signing in as a volunteer and typing every address rather than by reading the list:

| Gap | What a volunteer got | Now |
|---|---|---|
| `/residents` | "0 residents": the list read `resident_list_view`, empty for the role | reads `resident_who_and_where` |
| `/residents/:id` | a blank page (`residents` unreadable, so 404 with no words) | its own who-and-where page |
| `/enclosures`, `/enclosures/:id`, the map | counts and occupant lists of zero, from the same view | occupants read through the view |
| `assertPhotoWriteAccess()` | a **hardcoded role list that still said `volunteer`**, run before a Drive upload: the one guard Drive has, since it is not RLS | asks `photos.resident_add`. The routes beside it already asked `can()`; this one did not |
| The menu | Appointments, the vet's fallback for "no tasks", offered to anyone without My tasks | offered only to a login that can open `/appointments` |
| `/no-access` | a button labelled "Go to My tasks" that went to Home | labelled Home |
| Twenty-two resident and medical pages | no guard: a read of an unreadable table, so a blank page or a form that could only fail | refused to the no-access page |
| `/residents/new` | the intake form, for anyone | refused without `resident.register` (this also refuses a vet, who never held it) |

The twenty-two are the eleven under `/residents/:id/…` (edit, move, hospital and its return, rehome and its
return, deceased and its undo, adoption news new and edit, and the tabs of the record, which also ask the
medical cell for a medical tab) and eleven medical create and edit pages (seven new, four edit).
`requireFullResident()` guards the first group and `requirePermission()` the second.

## How a page knows it is showing who-and-where

The scope is not a column yet: `0132` says "the slice that builds the view adds it together with
the view", and `0134` did not add one. So the app asks the question the view itself asks,
`current_user_role() = 'volunteer'` (`readsWhoAndWhereOnly()`, `src/lib/residents/who-and-where.ts`).
It is the one place the app names a role for this, because it is the view's own gate. It is not a
guard on a right: the rights are all `can()`. **When the 2IC and the Heads arrive** (they borrow
`roles.legacy_role = 'volunteer'`, so `current_user_role()` answers `volunteer` for them) they get
this form with no change, and when a `scope_resident_detail` column exists this function becomes
`perms.scopes.residents === 'who_and_where'` and nothing else moves.

The alternative was asking the view whether it returns rows. Rejected: an empty shelter would
answer "no" for a volunteer and send them to pages that read nothing.

## What the volunteer's pages are

- **Residents:** name, Thai name, ID, enclosure, zone, status. No Scan a chip box, no No
  microchip filter, no ticking, no book-a-visit or immunization buttons, no New resident, no
  pencil, no card link, and the search matches name, Thai name and ID but not other names
  (`resident_who_and_where` has none). The chip search is switched off, not left to find nothing:
  a microchip number is not something this role reads.
- **A resident:** photo, name, ID, species, sex, status, enclosure (linking to it) and zone. Its own
  component (`ResidentWhoAndWhere.tsx`), not the hub with parts hidden: the hub reads columns the
  role no longer holds, and a column added to `residents` later stays out of this page until the
  view carries it.
- **Enclosures:** as before, with occupants from the view; the Has open maintenance tick was
  already hidden for a role that cannot read maintenance.
- **Home** (from `home-screens`) fell to Residents and Enclosures on its own once the registry saw
  three cells: **a tile survived no page**. `check-home-screens.mjs` now asserts exactly that pair,
  and its Contacts case, which used the volunteer as its read-only example, builds a one-cell role
  instead (no seeded role reads Contacts without editing it any more).

## Layer 2 of the parity check does not empty, and should not

`APP_PENDING` was written to "fail when an entry no longer differs, so it empties as that stream
lands". With the predicates deleted it can never stop differing: the fixture still says what the
predicate said. Renamed `NARROWED_BY_R1` and reworded: the fixture is the record of what the
volunteer could do before R1, the cells are what they can do now, the two differ on purpose, and
the entry still goes STALE the day a cell is widened again. It prints as "narrowed on purpose",
not "pending". The eleven entries stay.

The acceptance matrix's seed reader (`scripts/lib/permission-seed.mjs`) read only `0132`'s inserts,
so it believed the volunteer still held 24 cells after `0134` deleted 21. It now applies a later
migration's `delete from role_permissions … and activity not in (…)`. Without that the manual's
roles, the matrix and the home check all agreed with a database that no longer existed.

## The manual and the walkthrough

- Nine topics lose the volunteer from their roles (assistant, My tasks, recurring jobs, move,
  maintenance board, projects, vets, contacts, stocktake), and two (placement history, resident
  photos) that said nothing and so read as "everyone" now name who. Callouts on the two topics a
  volunteer still opens (finding a resident, the hub) say what they see. Sentences in six other
  topics that described the volunteer's old rights are reworded, not deleted.
- **Walkthrough pass 5 is rewritten**, and the matrix's boundaries with it. It used to say a
  volunteer "reads medical records"; it now says they open no medical page at all. It is the
  list to run on a phone, in both languages, the next time the role is looked at.

## Found, and not done

- **`/my` opens for a volunteer** with "Nothing is assigned to you". It has no guard of its own; it
  asks what each source lets the reader see. This is **F-21**, kept out of this batch on purpose.
  Worth knowing for batch 45: a recurring job with no screen still lists the volunteer as eligible
  (`reassign_recurring_job` keeps `'volunteer'`, correctly, as "someone who can still sign in"),
  but a volunteer has no `recurring.do_own` cell and `record_recurring_job()` refuses them. So a
  date can be handed to someone who has neither the page that lists it nor the right to finish it.
- **The assistant page** still renders its "can't use" note for a role without `assistant.ask`,
  by design (2026-09-25), rather than redirecting. Left alone: it is a polite refusal, the header
  button is already gone, and it loads nothing.
- Server actions under `/residents/:id/…` and the medical forms still rely on the database to
  refuse (a volunteer's attempt fails at the policy or the function, which the script proves),
  not on a check of their own. Only the Drive routes had to check first, and they all do now.
- **A red the parity check showed in the middle of this work was not this branch's:** layer 1 went from GREEN
  to a STALE on `medical.weight edit (in scope): delete from weight`, with no migration here. `perm-convert-medical`
  (`0135`) was applied to the shared dev database from its own worktree and closed C5. It merged as #348 and the
  merge into this branch is green again (1,924 match, 36 known, 0 mismatch).

## What was and was not tested

A disposable volunteer on dev, signed in by script and then in the browser pane at 375 px in
English and Thai, typing each address: every route a volunteer lost is refused to `/no-access`,
Home is two tiles, the menu is Home, Residents, Enclosures and the three footer links. A disposable
staff and a disposable vet were crawled over the same addresses to see that nothing they hold
moved (the vet is now refused `/residents/new`, which it never held). Not tested: a real device,
the Thai wording by a Thai reader, and any production data.
