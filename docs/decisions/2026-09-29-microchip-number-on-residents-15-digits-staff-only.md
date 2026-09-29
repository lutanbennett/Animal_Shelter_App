# 2026-09-29 — Microchip number on residents: 15 digits, staff-only, locked on death

Extends "Adoption Recommendation fields on residents" (docs/decisions.md,
2026-09-21, migration 0060), which left microchipping out. Nothing in that entry
was wrong: microchipping still is not standard practice in Thailand, and the
shelter does not chip every animal. What changed is the reason to hold the number
at all. Overseas adoptions need it (a chip is the first thing an export permit and
the destination country ask for), and the app should make chipping easy for the
shelters that do it. So the field is optional and null is normal, not a gap to
chase. The 2026-09-21 "no microchip field" reasoning was about the public
Desexed / Vaccinated / Microchipped ticks; the "Microchipped" one can now be a
boolean derived from this column when the feature half lands.

- **15 digits, and only 15 (0113).** The check is `^[0-9]{15}$`, the ISO
  11784/11785 length. 9- and 10-digit legacy chips were considered and ruled out:
  Lutan confirmed 2026-09-29 that the shelter has none. It is a decision, not an
  oversight. Loosening later is a one-line migration; a check that started loose
  could not be tightened over the rows it had let in.
- **Digits only, enforced twice.** The app strips spaces and dashes on save, and the
  check refuses anything left over, so a caller that forgets fails loudly rather than
  storing `985 112-…`. The empty string is rejected too: not chipped is null.
- **Unique where set.** A partial unique index, so a mistyped duplicate is caught
  and the many null rows do not collide. A chip number is globally unique, so the
  same animal turning up at two shelters is a real case for the multi-shelter spike,
  not something this index tries to solve.
- **Locked on death without editing the trigger.** The backlog said to add the
  columns to the 0026 trigger's column list. There is no such list to add to:
  `enforce_deceased_lock()` (0052) names only the columns that stay *open* after
  death (bio, notes, profile photo) and refuses a change to any other. A new column
  is locked by default. That is the safer shape, but it means the requirement
  cannot be read off the migration, so `scripts/check-resident-microchip.mjs`
  asserts it against a real deceased resident, and asserts a bio edit still goes
  through.
- **Never public.** No `public_*` view changes in this PR, and none selects
  `residents.*`. `scripts/check-public-views.mjs` now asserts anon can read
  `microchip_number` and `microchip_implanted_on` from no table or view at all, so
  a later view that carried it would fail the go-live check. The feature half's
  public "Microchipped: yes" must be a boolean, not the number.
