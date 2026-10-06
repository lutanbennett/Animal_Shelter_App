# 2026-10-06 — Draft 2: Lutan's five answers applied on test (`director-draft-apply`)

Backlog: "Apply the Director's first draft of who does what". **The item stays open.** It is done when
the Director has looked at each role on test and signed the draft or marked changes. She has **not
yet looked**; draft 2 is loaded on test only, and production is its own step.

Lutan answered the five questions #380 left, in chat on 2026-10-06, and asked for the wiring to be
done without further questions: "apply what was given… if it doesn't work we will see it on the
screens". This records what was applied and the choices that were not his to make.

## The five answers, as applied

1. **The four marks that were not ticks.** Volunteers row 1 (view residents): **yes, "with no medical"**.
   2IC row 11 (book a vet visit): no. 2IC row 39 (compare stock used with planned): no. Head of
   Medical row 49 (ask the assistant): no. All four are now in `draft-2.json`'s `unclear` as
   **answered** (`answer`, `answeredBy`), so nobody reopens them.
2. **Volunteers keep the residents list.** `volunteer.ticks` gains row 1: `resident.record` at Read,
   the R1 "who and where" footing (`0134`). "No medical" needs no extra work: her sheet gives volunteers
   nothing clinical.
3. **The Head of Medical keeps all five jobs** (medication list and pick list, Record Weight, Add
   Medical Photos, Feed Special Diets, and the `resident.record` read they start from).
4. **Vets stay on hold**: microchip only. Left as drafted; the `vet` note now carries Lutan's words so
   the narrowing reads as a decision, not an oversight.
5. **A volunteer may mark a recurring job done only if it is assigned to them.**

## Why rows 15 and 18 were applied at Read, not ticked

The sheet's row 15 ("Prescribe medication") grants `medical.prescriptions` **Edit**, and row 18 ("Set
a resident's diet") grants `medical.diet` **Edit**. The Head of Medical's jobs (`0136`, `0140`) need
**Read** on both: the medication list and the round's pick list are references, and medication
*given* is not recorded (`docs/roles-and-permissions.md` §14). Ticking the rows would have let her
write prescriptions and change diets, which the shelter gives to a vet. That over-grant would not look
broken on any screen (a form would simply work), so it is the one failure "we will see it on the
screens" cannot catch. Lutan was told and agreed the Read reading.

Row 20 ("Add a photo") grants `photos.resident_add` yes, which is what `0140` gave her, so row 20 is
simply **ticked**: `head_of_medical.ticks` is `[6, 17, 20, 24, 36, 47]`.

## What is new in the mechanism

- **`draft-2.json`** is draft 1 plus the answers. `draft-1.json` is untouched: it is what she sent.
- **`added`**, a fourth section beside `ticks`, `unclear` and `implied`: cells beyond her sheet because a
  built job needs them (`role`, `activity`, `level`, `rowNotTicked`, `because`, `answeredBy`). Two entries,
  both Head of Medical at Read: `medical.prescriptions` (row 15 not ticked) and `medical.diet` (row 18).
  `resolve.ts` loads them with `source: "added"`; if her ticks already give the cell at that level, the
  entry is a no-op. `implied` stays what it was: reads a *tick* starts from.
- **The loader and `/admin/role-draft` label them separately.** Loading them silently would turn the
  preview from "her draft" into "her draft plus our corrections", which defeats the item's point. The
  loader prints "ADDED, NOT TICKED (sheet row 15 not ticked)" per cell and a section of its own; each role
  on the page shows **"Added, not ticked: confirm?"**, and the answered marks now say what was answered.
  Rows 18 and 20 *were* on the sheet (both ticked in the 2IC's column; the scan agrees with the
  transcription), so she saw them and left them blank for this role: this is the draft being
  overridden, Lutan's to do, and it is shown to her as such.

## Applied on test

`node scripts/load-role-draft.mjs --draft 2 --apply`: **4 cells gained, 0 lost, 0 changed level, 4
audit rows** (no actor): `resident.record` read (volunteer); `photos.resident_add`, and
`medical.prescriptions` + `medical.diet` at Read as *added* (Head of Medical). Nothing was lost, so no
built screen depends on something draft 2 took away.

## Row 47 needed no code, and why nobody should build it twice

`record_recurring_job()` (`0141`, body from `0134`) admits a caller holding `recurring.do_own`, then
for any role other than admin/management requires the caller to be among the date's effective
assignees, and otherwise raises *"Only the people this job is assigned to, or management, can record
it."* Verified 2026-10-06, and `check-volunteer-narrowing` now asserts the volunteer is allowed on a
job assigned to them. Lutan's rule is already enforced. **Not covered, and filed separately:** the four
`recurring_*` *read* policies give a `recurring.do_own` holder the whole rota, not just their own rows
(the app filters, the database does not), so a volunteer can now *see* every job.

## The parity re-baseline: what it did and did not cover

Since #380 the permission probes asserted the old seed and were red on dev. The agreed draft is now the
intended state of these roles, so:

**Re-baselined to draft 2** (each marked `RE-BASELINED 2026-10-06` in the file): the volunteer's
expected cells in `check-permission-parity` (3 → 5, and `canUseAssistant(volunteer)` leaves
`NARROWED_BY_R1` because the cell now matches) and in `check-permission-tables` (cell count, the
660-answer table, and the replay's audit count, now computed from the live cells instead of a literal
21); the Head of Medical and 2IC bundles in `check-medical-role` and `check-2ic-role` (jobs.ts cells **plus
her ticks**, read from the draft, not retyped), and the 2IC's weight and prescription reads; the
volunteer's recurring reads in `check-volunteer-narrowing` (five cases move from "removed right,
refused" to "kept by the draft, allowed") and `check-perm-convert-orphans`; and the audit baseline's
test that treated an actor-less cell UPDATE as foreign (it is the loader).

**Deliberately left red: the vet.** The paper (§4) gives vets 13 cells; the draft gives them the
microchip, and Lutan said vets are on hold, so the two genuinely disagree. Flattening it would hide
what the checks exist to show. It stays red and **named**: `check-permission-parity` 21 vet mismatches;
`check-permission-tables` now carries on past the vet (`eq_known`) and ends `HARNESS-KNOWN-RED` listing
every vet line, so the other sections run again instead of aborting at the first; `check-perm-convert-orphans`
7 vet lines (diet rounds, prescription rounds, frequency read). A person has to decide whether vets
keep their reference-data cells while on hold, or whether the paper is rewritten.
