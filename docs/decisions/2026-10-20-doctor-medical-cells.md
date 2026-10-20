# The doctor role gets its `medical.*` cells (0230)

**Ruling:** Lutan, 2026-10-19, answering "may the visiting vet change diets and prescriptions?" with **Yes**. The expectation in
the harnesses was right and the database was missing cells, so the database changes. This is a ruling, not a stream assuming
today's behaviour was correct.

**What:** `0230_doctor_medical_cells.sql` gives the `doctor` role the thirteen cells of the paper's Doctor column
(`docs/roles-and-permissions.md` §4): `resident.record` (read), `resident.adoption_news` (read), `resident.microchip`,
`visit.book`, `medical.visits/procedures/blood_tests/prescriptions/immunizations/weight/diet` (edit), `photos.resident_add`,
`reference.add_while_recording`. A cell already held is raised, never lowered (dev's doctor had `medical.visits` read and
`visit.book` from the role-home-tiles work, 2026-10-18).

**Why the exact set:** the four harnesses are the specification. The 7 `check-perm-convert-orphans` probes need
`medical.diet` and `medical.prescriptions` edit plus the `frequency_rounds` read (which is `medical.prescriptions` read). The 21
`check-permission-parity` lines were exactly the paper's thirteen cells at both levels.

**Scope kept by the existing policies:** the doctor's `roles.scope_clinical = own_clinic` still limits every write to residents of the
doctor's own clinic. The `frequency_rounds` write stays Admin's (`reference.types`).

**Also:** four `known: N4` entries in `scripts/lib/permission-probes.mjs` (doctor archiving a medical row) were reported STALE
by `check-permission-parity` since 2026-10-16: the database already matched the default, so the entries were removed as that
check itself instructs.

**Not done here, and why:** `check-permission-tables` dies at its section A on stale baselines (66 activities, 45/21 yes-no) before it
reaches the doctor block; repairing those baselines is its own piece of work. `check-permission-parity` is still RED only for
`maintenance.bills` "neither probed nor explained", which the backlog item records as not ruled. `check-medication-rounds` keeps two
back-fill lines red on dev data, unrelated to the doctor.

**Production:** additive; apply `0230` to production before anyone expects the vet to prescribe. To revert, delete those role_permissions rows.
