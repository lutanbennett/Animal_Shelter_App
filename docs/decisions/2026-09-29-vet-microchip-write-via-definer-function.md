# 2026-09-29 — Vets set a microchip through a definer function, not through `residents` RLS

Follows `2026-09-29-microchip-number-on-residents-15-digits-staff-only.md` (0113)
and `2026-09-29-microchip-entry-and-scanner-search-first-half.md`. Migration `0116`.

A vet must be able to add or correct a chip from their own interface. Vets read
residents in their clinic's scope (0108) and hold no update on `residents`. Two
ways to give them one:

- **Widen the `residents` update policy for vets.** Rejected. RLS is row-level:
  a policy that lets a vet update a resident row lets them update *every column*
  of it — name, status, bio, adoption fields, the lot. Column-level `grant
  update (microchip_number, microchip_implanted_on)` would narrow it, but the
  app's role model is one database role (`authenticated`) for every user, so a
  column grant would apply to volunteers and every other role too, and the 0026
  deceased lock and 0110's clinic scoping would each need re-deriving in a policy.
- **A security-definer function that writes exactly two columns (chosen).**
  `set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date
  default null)`. The `UPDATE` names `microchip_number` and
  `microchip_implanted_on` and nothing else; there is no dynamic SQL and no
  argument picks a column, so no caller can reach another one. The write surface
  is two columns of one row by construction, not by policy.

What the function does, and why each part is there:

- **Re-checks scope itself.** A definer function bypasses RLS, so trusting the
  caller to have checked would be a hole straight past 0108 and 0110. A vet
  passes only if the resident is in `current_vet_resident_ids()`; a vet with no
  clinic gets the empty set and is refused.
- **Who.** `admin` and `staff`, the roles that can already update `residents`,
  and a scoped `vet`. Management, volunteers and anon are refused: this adds no
  new writer beyond the vet.
- **Refuses a deceased resident**, with the 0026 message and `restrict_violation`,
  checked before the update. The trigger would refuse it anyway; the explicit
  check gives a clear error and means this function cannot become the way round
  the lock if the trigger's column list ever changed.
- **Strips nothing.** The app strips spaces and dashes before calling. The
  15-digit check and the unique-where-set index from 0113 still fail at the
  database, so a caller that forgets is refused, not silently normalised. A
  duplicate surfaces as `unique_violation`, a malformed number as
  `check_violation`, for the feature half to turn into a readable message.
- **Null clears.** Passing null number (and null date) removes a wrong chip; the
  date is overwritten with what is passed, so a correction that omits the date
  clears it. The feature half's form should always send both.
- `execute` is revoked from `public` and `anon`, granted to `authenticated` and
  `service_role`.

Measured, not reasoned: `scripts/check-resident-microchip.mjs` runs the file twice
and, with real JWT claims and `set local role`, asserts a scoped vet writes,
corrects and clears with every other column unchanged, and that an out-of-scope
vet, a vet or staff member on a deceased resident, a duplicate, 14-digit / spaced
/ letter / empty numbers, a volunteer, a clinic-less vet and anon are all refused.
