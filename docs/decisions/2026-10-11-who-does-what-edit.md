# Who does what: an Admin changes a box (`who-does-what-edit`)

2026-10-11. Last stream of the grid feature Lutan prioritised on 2026-10-10.

## What was built

- **Editing.** On Settings → Who does what an Admin, in a session verified with the authenticator app, picks a
  new answer in any box. `src/app/admin/who-does-what/actions.ts` (`setCell`) writes `role_permissions` as the
  admin's own session, so the table's own rules (`0132`: Admin at aal2) are the enforcement and the audit
  trigger puts the change in Recent changes. Same pattern as the outreach-writers action it replaces.
- **The §6 fixed rules are held on the server, not only hidden in the page.** `setCell` refuses a non-Admin, a
  session without 2-step, a role that is `kind = 'fixed'` (Admin's column, the public viewer) or does not open
  the app, a key not in the catalogue, a level the activity does not take, and a doctor's clinic box. "There is
  always an Admin able to edit" holds because Admin's column is a rule and no cell can reach it.
- **Management still sees the grid and cannot change it.** `opensWhoDoesWhat` is unchanged.
- **Who may write outreach notes** is now the *Outreach notes* row (`community.outings`). The Security section,
  its component, its action and its dictionary strings are gone; nothing was configured that the grid cannot
  show, because it was the same cell.
- **`/admin/role-draft` redirects to the grid, it is not deleted.** The draft file and loader are untouched, the
  Director's draft history and `2026-10-06-director-draft-apply.md` still point at the page, and `/home/[role]`
  links to it. Nothing the page showed is lost that the grid does not show (it read the same cells).

## The prerequisite rule mechanism, and why it exists

`FIXED_FOR_NOW` exists so the grid never lies. Once boxes can be changed, a box that cannot work becomes a way
to lie *by editing*: set it, it saves, nothing happens. So some combinations must be refused with a reason.
`src/lib/permissions/prerequisites.ts` states them (§4 rule 5, §6 rule 9), pure and importable by the action, the
page and the check script:

- `stock.correct` needs Edit on `stock.medications` **or** `stock.diets` (`record_stock_correction()`, `0178`).
- `recurring.do_any` needs `recurring.do_own` (`record_recurring_job()` lets `do_any` record your own).

Behaviour: turning the dependent on without a prerequisite is refused; turning the last prerequisite off while the
dependent holds is refused; turning a dependent off is always allowed (the way out). Only rules the change touches
are judged, so an unrelated box is never blocked by a combination that already exists in the column.

It is **not** in `catalogue.ts`'s `requires`: that field must equal `permission_activities.requires` (a lint check)
and filling it needs a migration. If a later migration fills it, this file becomes the place to generate it from.

An existing combination the rules forbid (today: the 2IC's Yes on `stock.correct`, with no list box) is not
silently rewritten: the grid shows it with a warning and names it under *Boxes that need another box*, and the
check script accounts for it as a prerequisite-rule box rather than a `FIXED_FOR_NOW` one.

## Before and after (`node scripts/check-who-does-what.mjs`, dev)

| | before | after |
|---|---|---|
| boxes measured | 306 | 306 |
| obeyed | 184 | 184 |
| wrong | 27 | 27 |
| sticky | 15 | 15 |
| `FIXED_FOR_NOW` entries | 7 | 5 |

No box moved: nothing about what the database does changed, and none was meant to. What moved is who explains the
two boxes (`second_in_command stock.correct`, `management recurring.do_own`): a refused combination, not a note.

## What is left, and why

`FIXED_FOR_NOW` is the three entries that stay (`clinicRule`, `whoAndWhere`, `nameAndPhone`) plus two that need SQL
and could not be done here (one migration per batch, and `0180` is `perm-drop-enum`'s):

- `notAskedYet` → backlog `perm-split-activities`: visit booking, job progress and project publishing are three
  splits that no policy reads. Nothing wrong today (the same roles hold both cells of each pair).
- `databaseWider` → backlog `perm-narrow-policies`: nine policies accept either of two cells. Not shown on the grid.

So the original done-when's last clause, *every box not on the §6 list can be changed*, is true of the grid (every
such box saves) and not of every policy behind it for those two entries. The amendment was recorded on the item
before this stream started.

## Release-time hazard

No migration, but **a box changed on production bites immediately**: `has_permission()` reads live, by design.
The feature is live the moment it deploys and a mis-set box takes effect at once. Every change is in Recent changes
and reversible by setting the box back.
