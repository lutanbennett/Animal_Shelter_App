# 2026-10-11 — Record permission gaps: Edit links and the medical create actions

`record-permission-gaps`. App and scripts, no migration. Closes the two "Found while here"
items from `2026-10-10-page-guard-fixes.md`.

## Item 1: was the wrong door reachable?

**No, still not.** Checked against dev's `roles` and `role_permissions` (read-only query),
not by quoting the old note. The only role holding `medical.visits`, `.prescriptions`,
`.diet` or `.weight` at Read is `head_of_medical` (diet and prescriptions), and since `0179`
its `scope_residents` is `who_and_where`. `requireFullResident()` refuses that scope before
the tab renders, so no Edit link is ever drawn for it. This is defence in depth, as written.

Every Edit link on the record tabs (visit, weight, prescription, diet) is now behind
`can(perms, "<activity>")` at Edit. The "End today" buttons share the Edit link's component
and the same activity, so they go with it. Section F's `decides` pin for
`/residents/[id]/[section]` lists the four activities.

## Item 2: the create and "End today" actions

`createWeight`, `createPrescription`, `endPrescriptionToday`, `createDiet`, `endDietToday`
and `bookClinicVisit` start with `can(await loadPermissions(), "<activity>")` at Edit, copied
from the edit actions. Wording is the existing `t.common.notAllowed`; the visit uses
`vetVisits.errors.notAuthorized`, as `updateClinicVisit` does. No new strings.

## Siblings: six named, four more found, spun out

Looked by listing every `actions.ts` under `src/app` whose path names a medical or clinic
area and which contains an `.insert/.update/.upsert/.delete` call, then counting `can(`.
Four writers in the medical paths still ask nothing: `createBloodTest`, `createProcedure`,
`deleteBloodTestAttachment`, `deleteProcedureAttachment`. Out of this quick win; backlog item
added on the `backlog` branch.
