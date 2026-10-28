# 2026-10-28 — Upcoming visits: Edit gated on its own activity; the walkthrough seam measured

Branch `claude/upcoming-visits-edit-gate`. No migration, no new card, no new activity.

## Part 1 — the fix

`/upcoming-visits` listed every visit with an Edit link (`VetVisitsView.tsx`) for any login that could
read the list. The page the link opens, `/clinic-visits/[id]/edit`, calls `requirePermission("medical.visits")`
with no level, and `require.ts` defaults that to **edit**. So the activity the control must ask is
`medical.visits` at **edit**, read from the page the action lands on, not from the label.

- `VetVisitsView` takes `canEdit?: boolean`, **default false**. The only caller, `upcoming-visits/page.tsx`,
  passes `can(perms, "medical.visits", "edit")`. No other page renders the component.
- `requirePermission` on the edit page is untouched. Hiding is the courtesy; the server still refuses.
- Cards that hold `medical.visits` at read only (so lose the link): `view_medical`, `dashboard`.
  `medical_records` and `book_clinic_visits` hold it at edit and keep it.

### This page's action controls and the activity each asks

| Control | Activity its action asks | Gated? |
|---|---|---|
| Book appointment (`page.tsx`) | `visit.book` | yes, already |
| Edit (per visit) | `medical.visits` edit | **yes, now** |
| Open resident / View (per visit) | read pages (`/residents/[id]`, `/clinic-visits/[id]`) | navigation to read pages, not an action |
| ConfirmList items (calendar import) | list only drawn on `visit.book` | yes, already |

Found, not fixed: none.

## Part 2 — the seam: pages the registry reaches that no walkthrough step opens

Method (re-runnable): take every `path:` in `src/lib/permissions/routes.ts` (`ROUTES`, 46 entries) and
every numbered `Open \`/path\`: it loads` step in `docs/card-walkthrough.md`; list the first set minus the
second. A path named only in a *Refused* step does not count as opened (the page is never seen working).
`NavLinks.tsx` adds only landings and account links (`/admin`, `/management`, `/operations`, `/home`, `/my`,
`/manual`, `/releases`, `/residents`, `/account/password`, `/admin/security`), none of them action pages; the
landings open through `opensAnyIn` and are not counted.

**Result: 22 of 46 registered pages have no walkthrough step that opens them.** `/upcoming-visits` itself is
*not* in this list (a numbered step opens it, walkthrough line 207), so the seam was not "no step opens it" for the
walkthrough as it stands now; the list below is the same fault waiting on other pages.

Menu pages (`menu=true`): `/projects`, `/clinics`.

Not on the menu, but reachable by tile/link: `/appointments`, `/operations/feeding-list`,
`/management/desexing-drives`, `/management/clinics`, `/management/medications`, `/management/diets`,
`/management/stock-usage`, `/management/cashflow`, `/admin/enclosures`, `/admin/zones`,
`/admin/facility-map`, `/admin/immunization-types`, `/admin/procedure-types`, `/admin/blood-test-types`,
`/admin/medications`, `/admin/diets`, `/admin/units`, `/admin/frequencies`, `/admin/recent-changes`,
`/admin/status`.

Of the 22, 20 are never named anywhere in the walkthrough; `/management/medications` and
`/management/stock-usage` are named but not as a loading step.

**Caveat:** this is a count of pages with no *opening step*, not a count of pages with ungated action
controls. Most of the `/admin/*` pages are Admin-only (outside the card system) and reached by Admin, who sees
everything, so their risk is lower. The non-Admin pages (`/appointments`, `/projects`, `/clinics`,
`/operations/feeding-list`, `/management/*`) are the ones where a card-limited login could be offered a control
its card does not grant. That is the part worth a backlog item; it was not audited here (a report, not a sweep).
