# 2026-10-10 — Page guard fixes: the four medical edit pages and the record hub

`page-guard-fixes`. App and scripts, no migration. Closes the two findings in
`2026-10-10-parity-layer-3-pages-outside-the-registry.md`.

## The four edit pages: Edit on the page and in the save

`/weight`, `/prescriptions`, `/diets` and `/clinic-visits` `[id]/edit` now guard at Edit,
and section F's four `known` entries went in the same commit (they turn STALE the moment a
page is fixed, so the two cannot land apart).

**The save actions ask too.** `saveWeightEdit`, `updatePrescription`, `updateDiet` and
`updateClinicVisit` start with `can(await loadPermissions(), "<activity>")` at Edit, the
pattern `deliveries` and `donations` already use, and return the existing wording
(`t.common.notAllowed`; `vetVisits.errors.notAuthorized` for the visit). No new strings.
The database stays the backstop: those tables' update policies ask Edit (`0135`, `0145`).
Before, a direct call by a Read-only login got "failed to save", because RLS filters the
update to zero rows rather than refusing it.

**Not done here, on purpose:** the create and "End today" actions in the same files ask
nothing either and lean on RLS the same way. They are not behind a page that opened at the
wrong level, so they are a follow-up on the backlog, not part of this fix.

### Wrong door, not a leak: measured

The brief asked to confirm this rather than assume it. `scripts/check-page-guards-live.mjs`
prints what each login's own client reads of the sample rows. On dev:

- The **volunteer** reads none of the four tables and not `residents` (0134). On dev it
  also holds none of the four cells any more (someone has edited the role there; by
  migration, `0132`, it holds all four at Read). Either way it was already refused.
- The **Head of Medical** reads the weight, prescription and diet rows but not `residents`.
  So before this fix the edit page read the row, then failed to read the resident and
  returned **404**: a wrong door that showed nothing, not a form full of data. Now it is
  the no-access page.

The pages only ever render what the login's own Supabase client returns, so they cannot show
more than RLS allows. A wrong door, as the item said.

## The record hub: `requireFullResident()`, after the redirect

`/residents/[id]` calls `requireFullResident()`, the guard every one of its sub-pages uses,
**after** `readsWhoAndWhereOnly()` sends a who-and-where login to `/r/`. The other order
would refuse a volunteer who holds no `resident.record`, turning a working journey into a
no-access page.

Section F moves the hub from `EXEMPT` to `PINNED`. A pin of the guards cannot see their
order, so section F also gained one check that the redirect comes before the guard; swapping
the two lines turns lint red (test plan).

**What actually changed for the role the item worried about.** The item expected an empty or
partial record. Measured with a throwaway configured role (opens the app, one unrelated cell,
no `resident.record`, legacy `management` so it does not answer 'volunteer'): before, the
hub read nothing under RLS and fell back to the **public card** (`/r/`), the same fallback a
doctor gets for another clinic's resident. Now it gets the no-access page. That is what the
item asked for: a role that holds no read of the record is told so, rather than quietly shown
the stranger's view. No live role is affected: on dev every role that opens the app holds
`resident.record` (Admin implicitly), and the two who answer 'volunteer' still reach `/r/`.

## Found while here

The record tabs show a row's Edit link to anyone who can open the tab, without asking Edit
(`src/app/residents/[id]/[section]/page.tsx`). No live role reaches that today with Read only
(the Read-only holders answer 'volunteer' and cannot open the tabs), but a configured role
holding a medical activity at Read would now follow the link to the no-access page rather than
to a form that fails. Better than before; still a link that should not be there. Backlog.
