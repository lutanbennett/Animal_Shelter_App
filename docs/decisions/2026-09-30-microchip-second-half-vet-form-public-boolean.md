# 2026-09-30 — Microchip, second half: one chip form for vets and staff, a public boolean, a nudge

Closes the microchip work begun in
`2026-09-29-microchip-number-on-residents-15-digits-staff-only.md` (0113),
`2026-09-29-microchip-entry-and-scanner-search-first-half.md` (PR 221) and
`2026-09-29-vet-microchip-write-via-definer-function.md` (0116).

- **One form, `MicrochipForm`, writes through `set_resident_microchip()` for
  everyone outside Edit resident and intake**, staff and admin included, not
  only vets. The hub, the Vet appointments and Procedures tabs, a visit's Edit
  page and the post-procedure prompt all use it, so there is one set of error
  messages. Edit resident and intake still write the column directly with the
  rest of the record, as PR 221 built them; staff hold update on `residents`
  and those forms save many columns at once.
- **The app strips and always sends both fields.** 0116 strips nothing and
  overwrites the date with what it is given. `readMicrochip()` removes every
  non-digit and returns an explicit `null` date for a blank field, so a number
  correction with the date field cleared really clears it, and one with the
  date left in place re-sends it. The manual says so in a callout.
- **Each refusal has its own words**, keyed on the SQLSTATE PostgREST
  returns: `23001` restrict_violation (deceased), `42501`
  insufficient_privilege (a vet out of scope), `23514` check_violation
  (malformed), `23505` unique_violation (duplicate), plus `P0002` for a
  resident that no longer exists. Anything else goes through `runAction` to
  the "something went wrong, reference …" message, not a raw database error.
  `scripts/check-public-microchipped.mjs` pins the mapping; 0116's harness
  pins that the function raises those conditions.
- **Who is offered the pencil:** admin, staff, vet (`MICROCHIP_WRITE_ROLES`),
  the roles 0116 lets through. Management is not; the function would refuse
  it. A vet who can see a hub is in scope already (0108), and the function
  re-checks. Never offered on a deceased resident.
- **The procedure prompt matches the type name on `/microchip/i`**, so the
  0031 seed "Microchipping" and a shelter-added "Microchip implant" both
  trigger it. It defaults the implant date to the procedure's date unless a
  chip is already on file, and "Not now" goes on to the Procedures tab as
  before. It is shown only to roles that may set the chip.
- **Public: a boolean on `public_resident_profiles` only (0117).** Appended
  after `ideal_home`, re-created from the live definition so the
  schema-qualified `private.*` names and the grants carry over.
  `public_resident_cards` (`/r/<code>`) is deliberately left without it:
  nothing asked for it there, and every public surface carrying a chip fact is
  one more place to hold the line. `check-public-views.mjs` still refuses anon
  the number and date on every public object, and now also asserts
  `is_microchipped` reads as a boolean.
- **The dashboard counts in-care residents without a chip** (Resident,
  Unassigned, Hospitalised, Fostered: the same "in care" as the rest of that
  row), with the chipped count as its detail. The page reads the number only
  to turn it into `has_microchip`; nothing past that line holds it.
- **"No microchip" on `/residents` excludes the chipped by id.** The list
  reads `resident_list_view`, which does not carry the column, and changing
  that view is schema the brief did not budget for. Chipped residents are the
  few in Thailand, so their ids are the short list. If chipping becomes
  common, add the flag to the view and filter on it instead.
- **The archive carries the number.** The deceased summary PDF and offline
  index are internal records, like the hub; the number is staff-only, not
  secret from staff.
- **No Thai manual text:** the manual is still English-only (as in PR 221).
  The new dictionary strings have Thai.
