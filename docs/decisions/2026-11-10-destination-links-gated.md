# 24 offered-then-refused links gated; the destination-activity allow-list is empty

Backlog `#d9k2w`. `scripts/check-destination-activity.mjs` (PR #1445) parked 24 findings in
`docs/destination-activity-allowlist.json`. Each is now fixed and its row deleted in the same commit
as its fix; the file holds zero entries and the check reports `FINDINGS: 0`.

**Method.** For each link, the activity was read from the destination page's own
`requirePermission(...)` (never from the link's label) and the control is drawn only when
`can(perms, <that activity>, <level>)` is true. The server and database checks are untouched.

**Shared components.** Every shared component got a `can…` prop that defaults to `false`, and each
caller answers for itself (`canEditVisits`/`canManageDoctors` on ClinicHub, `canManageDoctors` on
ClinicsTable, `canOpenStock` on IngredientDetail, `canOpenProject` on PublishedProjects,
`canOpenMaintenance` on EnclosureGrid/EnclosureHub/EnclosureMaintenance/FacilityMap, `canBrowse` on
ContactsTable, `canOpenReceipt` on AppealGifts, `canMake` on MakeMemeLink). No component was gated for
its strictest caller. `FacilityMap` and `EnclosureMaintenance` receive `canOpenMaintenance` from
`/enclosures`, which reads `maintenance.jobs:read` already.

**Where a link vanished instead of greying.** Where the label was also information (a visit date, a
job title, a contact name), the text stays and only the anchor goes.

**Found, not fixed (outside the 24).** `ClinicHub`'s `canManage` (`clinics.list` edit) still gates the
other controls on that page; it was left as it is. Nothing else surfaced.
