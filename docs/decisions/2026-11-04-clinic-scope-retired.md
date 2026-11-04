# The retired clinic scope is deleted; `/appointments` stays only as a redirect

Stream `appointments-scope-cleanup`, 2026-11-04. Backlog item `#0mw7a`. No migration, no policy change, no card change.

## What was removed (all of it unreachable since `0264`)

`src/lib/clinics/scope.ts` (the `ANY_CLINIC_SCOPE` constant, `scopeAllowsClinic`) and `src/lib/clinics/appointments.ts`
(`loadClinicAppointments`, only the old page used it), plus every `"clinics"` / `"unlinked"` branch that tested them, and the
dictionary strings behind them in both languages: `vetAppointments` (whole block), `vetVisits.noClinicForAccount`,
`otherClinicReadOnly`, `ownClinicHint`, `doctorLockedHint`, `record.otherClinic`, `errors.notYourClinic`, and
`residents.list.vetScope` / `vetScopeNoClinic`. The forms lose the `fixedClinic` / `lockedDoctor` props and `DoctorNameField`
loses `lockedName`.

## The ten files in the brief

| File | Result |
|---|---|
| `src/lib/clinics/scope.ts` | deleted |
| `src/lib/clinics/appointments.ts` | deleted (comment-only mention; its function served only the old page) |
| `src/app/appointments/page.tsx` | now only the card guard and a redirect to `/upcoming-visits` |
| `src/app/clinic-visits/new/{actions,page}.tsx` | dead branches removed |
| `src/app/clinic-visits/[id]/edit/{actions,page}.tsx` | dead branches removed |
| `src/app/clinic-visits/[id]/page.tsx` | dead branch removed; the `medical.visits` **read** guard from #1242 is untouched |
| `src/app/NavPane.tsx` | `appointmentsHref` gone; the entry leads to `/upcoming-visits`, as it always did in practice |
| `src/app/residents/page.tsx` | scope note and its query removed |

## Decisions

- **`/appointments` is kept as a redirect, not deleted.** Its route entry (`medical.visits` read) is what the Appointments
  home tile and the menu entry's `opens()` check ask, and `scripts/check-home-screens.mjs` asserts that tile. Deleting the
  route would have changed who sees the tile and the menu entry: an access change in a cleanup PR. The redirect keeps old
  bookmarks working and the page nobody could use is gone. Removing the route entirely is a separate, card-shaped decision.
- **`NavPane` never linked `/appointments`** for any login (the scope could not be `"clinics"`), so no one lost a link.
- **`doctorName` read check:** it was set only on the unreachable branch. In the actions `doctorName` is now exactly the
  form's value; the old overrides could never run. The edit form's `showBills` now asks only `medical.visits` edit, which is
  what its first half always evaluated to.
- **Found, not fixed:** `revalidatePath("/appointments")` in `admin/recent-changes/actions.ts`, `residents/[id]/archive-actions.ts`
  and `residents/[id]/microchip/actions.ts` now revalidates a redirect; the list it should refresh is `/upcoming-visits`.
  `scripts/fixtures/legacy-predicates.json` still names `loadClinicScope` as a historical record.
