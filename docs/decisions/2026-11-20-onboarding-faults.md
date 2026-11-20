# 2026-11-20 — onboarding faults 1 and 2 (`#onbrb`)

Both were found by the onboarding rehearsal (`2026-11-20-onboarding-rehearsal.md`).

## Fault 1: Who does what crashed on a shelter whose only role is Admin

**Cause, two halves.** `loadRoles()` leaves Admin (`kind = 'fixed'`) out, correctly: Admin holds no cards and is not a
column. A new shelter therefore has no roles to list. `page.tsx` then read every role table with `role?.id ?? ""`, and
an empty string is not a uuid, so Postgres threw `invalid input syntax for type uuid: ""`.

**Fix.** Only `page.tsx` changed: when there is no role, the five per-role reads are skipped, so an empty string can no
longer reach the database whatever `loadRoles()` returns. `loadRoles()` was left alone on purpose: the filter is right,
and putting Admin into the list would draw a card column for a role that holds no cards, which the card rules forbid.
The page already drew everything role-specific behind `role &&`, and "Create a role" behind `canEdit` alone, so with the
reads skipped a shelter's first role can be made. No access rule was touched.

## Fault 2: `shelter-export.mjs` refused

`product_admins`, `product_admin_lookups` and `product_admin_login_grants` have no `shelter_id` and were in neither
`docs/tenancy-shared-tables-registry.json` list. The registry refusing was correct; the tables were never classified.

**What should a shelter's export contain from a table that belongs to the platform?** Nothing. They are classified
`exportTreatment: "none"`, the same as the installation-monitoring tables, and recorded in `tables` with the reason:
`product_admins` is the list of console logins; the other two are audit rows of what a product administrator did, and
`product_admin_login_grants` carries `for_shelter` and an email, so a shelter's export would carry another person's
console activity. `own-row` is wrong (no row belongs to a shelter) and `all` is wrong (it would hand every shelter the
platform's administrators). The check itself was not loosened.
