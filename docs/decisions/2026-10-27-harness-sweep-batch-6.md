# Harness sweep, batch 6: a fresh count (2026-10-27)

Read against the **dev** database (`qxkmhwybjggxvsfxsxbd`), at `244a1731`, by running every
`scripts/check-*.mjs` (196) once with a 60 s limit, six at a time, with **no dev server running**.
Runner kept in the scratchpad, not committed.

**Result: 105 green, 76 red, 15 timed out at 60 s.** The "30" in the backlog item was stale.
Caveat: six at a time against a shared database can add noise; the twelve I triaged were re-run one
at a time and failed identically, so those are real. The rest are one reading.

## Not run properly (no dev server): fetch failed
- check-access-requests-card
- check-contact-address-fields
- check-donate-buttons
- check-facility-map-editor
- check-home-screens-live
- check-maintenance-bills-page
- check-map-details
- check-medical-jobs-app
- check-page-guards-live
- check-place-order-roles
- check-residents-sort
- check-upcoming-visits-page
- check-user-theme
- check-who-does-what-page

## Timed out at 60 s (not a verdict)
- check-can-see-drive-file
- check-diets-recipes-schema
- check-diets-servings-app
- check-maintenance-role
- check-medical-archive-roles
- check-medical-role
- check-medical-soft-delete
- check-medication-label
- check-medication-rounds
- check-migration-grants
- check-no-role-column-security
- check-order-and-units
- check-pack-sizes
- check-public-views
- check-script-integrity

## Red (all, including the two on purpose)
- check-2ic-role
- check-access-requests-card
- check-adoption-updates
- check-appeals-schema
- check-assistant-refused-client
- check-audit-log
- check-bills-roles
- check-card-taps
- check-chip-scan
- check-clinic-allow-lists
- check-clinics-readonly
- check-community-dogs-schema
- check-contact-address-fields
- check-contact-visibility
- check-daily-count
- check-diets-app
- check-doctor-clinic-scope
- check-doctor-multi-clinic
- check-doctor-own-clinic-writes
- check-doctor-report-schema
- check-doctor-resident-scope
- check-doctors
- check-donate-buttons
- check-donation-channels-schema
- check-donation-receipts-schema
- check-drive-token
- check-facility-map-editor
- check-features-schema
- check-hidden-public-pages-schema
- check-home-cards
- check-home-screens-live
- check-maintenance-bills-page
- check-map-details
- check-medical-card-reads-record
- check-medical-jobs
- check-medical-jobs-app
- check-menu-coverage
- check-offsite-chip
- check-page-guards-live
- check-perm-convert-orphans
- check-perm-convert-people
- check-perm-convert-photos
- check-perm-convert-residents
- check-perm-convert-settings
- check-perm-convert-work
- check-permission-parity
- check-permission-tables
- check-phone-width
- check-photo-approval
- check-place-order-roles
- check-placement-guards
- check-policy-role-names
- check-prescription-visit-not-future
- check-price-free-pickers
- check-public-stories-schema
- check-resident-id-search
- check-resident-microchip
- check-resident-sections
- check-residents-export
- check-residents-select-all
- check-residents-sort
- check-residents-status-chips
- check-role-can
- check-role-write-policies
- check-schema-drift
- check-security-role-picker
- check-stocktake
- check-test-plan
- check-two-step-session
- check-unit-conversions
- check-upcoming-visits-page
- check-user-theme
- check-view-write-grants
- check-volunteer-narrowing
- check-who-does-what
- check-who-does-what-page

## Verdicts (permissions first)

1. `check-policy-role-names` **fixed**: its four `SCOPE_DELIBERATE` entries (attachments) were stale,
   the policies no longer call a scope function. Entries removed; now GREEN.
2. `check-perm-convert-people`, `-work`, `-settings`, `-orphans`, `check-2ic-role`, `check-bills-roles`,
   `check-donation-channels-schema`: **removed mechanism, not repaired.** They assert a fixed cell matrix
   for the live `management` role (and a fixed role list), but a role is now only the cards it holds, and
   Lutan edits those on dev. Failing "as management: allowed — got 0" says the harness's picture of the
   role is gone, not that the app is wrong. Rule: cut down or delete, never edit to assert a role's cells.
   Not done here: deleting seven files needs a pass over docs that cite them. **Left for the next stream.**
3. `check-perm-convert-residents`: not touched. It fails on `sees_all_residents()`, which reads a role
   column; making it green would add hidden security. Delete or cut down. The two policies it names may
   over-grant: **a question for the card system, recorded, not acted on.**
4. `check-features-schema`: **real finding.** Hard-coded "28 cards" is now 33, and card `who_does_what`
   has no feature row. Needs a features/data decision, not a count bump.
5. `check-role-can`, `check-permission-tables`, `check-doctors`: fixtures assume a role count and a
   doctor clinic that dev no longer has (likely the removed `staff`/archiving mechanisms). Not diagnosed.

## Deliberately left
- `check-who-does-what`, `check-menu-coverage`: red on purpose, stay red.
- `check-resident-sections`: snapshot tool, not a check.
- Everything not listed in a verdict; the 16 doctor-scope harnesses share a cause (the doctor login is
  not at its own clinic on dev) and should be taken as one batch.
- Not triaged: ten were the cap; I stopped at five verdict groups because the rest are investigations.
