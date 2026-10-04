# 2026-10-04 — `permissions-sweep-medical`: what was swept, and two departures from #336's pattern

F2, the medical area, of `docs/roles-and-permissions.md` §15. App-side only: no migration
(`0134` stays free for `perm-convert-medical`), no policy. It follows
`2026-10-04-permissions-sweep-residents.md`; **`-rest` should read the two departures below**.

## What moved

| Was | Now |
|---|---|
| `canArchiveMedical(role)` (`medical-archive/kinds.ts`), in the archive and restore actions and `[section]/page.tsx` | `can(perms, "medical.archive")` |
| `loadVetScope`'s `role !== "vet"` | `perms.scopes.clinical !== "own_clinic"` |
| `/appointments`: `requireRole(role === "vet")` | `requirePermission("medical.visits", "read")` plus the scope test (departure 1) |
| `medical` manual topics (eight) | `activity` beside `roles`, as #336 did |
| the ten matching acceptance rows | `needs` |

The truth table of `canArchiveMedical` was already in `scripts/fixtures/legacy-predicates.json`
(captured earlier). The two scope tests are new fixture rows, `loadVetScope_isVet` and
`appointmentsPage` (vet only), and the parity check compares them with the seeded
`scope_clinical = 'own_clinic'` in `0132`. The check is green before and after.

The medication list needed nothing: it was already permission-correct. The hub's medical
pages, `/vet-visits`, `/weight`, `/prescriptions`, `/procedures`, `/blood-tests` and
`/immunizations` carry **no** app-side role test (RLS refuses), so there was no predicate to
move and, as #336 said of `/residents/new`, adding one would be a new refusal, not a sweep.

## Departure 1 — a page gated by a scope is not in the route registry

`/appointments` is `medical.visits` (Read) **with the own-clinic scope** (Appendix A:
`appointments-vet`). Staff, Management and Volunteer hold the activity too, and today are
refused: it is a vet's home. `requirePermission` alone would open it to them, so the page
also refuses when `perms.scopes.clinical !== "own_clinic"`, with the same `refuse()`.

It is **not registered**. `canOpen()` asks the activity only, so a registry entry would give
a staff member a home tile for a page that refuses them. Registering it wants a scope field
on `RouteEntry` that `routesFor` honours; that belongs to `home-screens`, which owns the
registry's shape.

The matching manual topic `appointments-vet` is **not tagged** either: its `roles` is the
vet alone, while the roles holding `medical.visits` are five, so the roles-equal-activity
check would fail. Same reason as `microchip` in #336.

## Departure 2 — the blood-test and procedure file routes stay on `assertPhotoWriteAccess`

The brief named them. Their gate is "any of the five logged-in roles may attach a file to
any owner type" (volunteers included, `decisions.md`: attachments and photos, any owner
type). No medical activity says that: `medical.blood_tests` and `medical.procedures` are
Edit for A/M/S/V and **Read** for a volunteer, so asking them would remove a volunteer's
ability to attach a file, which is a visible change and a policy question (`record_attachment()`
is the database half). It is the same shared list the projects and maintenance routes use,
and the parity check's `UNPAIRED` note already says it waits for the photo split. Unchanged.

## Left, and why

- `residentPhotoSelect(role)` and `contactNameEmbed(role)` in `[section]/page.tsx`: contact
  views, `-rest`. The page still reads `current_user_role` once for them.
- `/management/medications`, `/management/medication-list`, `/management/vets`, the
  `/admin` blood-test, procedure and immunization type pages: `-rest`'s boundary.
