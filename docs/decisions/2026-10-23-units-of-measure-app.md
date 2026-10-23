# 2026-10-23 — Units of measure, the app half (Settings → Units)

Builds on `2026-10-23-units-of-measure-are-data.md` (the table, 0252). No migration in this stream.

- **A rename of a unit rows already use is REFUSED, not cascaded.** `diet_types.unit` and
  `medication.dose_unit` store the unit's name as text. A cascade would have to rename the unit row and every
  ingredient and medicine in one transaction; PostgREST has no multi-table transaction and a migration (an
  RPC) was out of bounds, so it would be several writes, and a failure half-way leaves rows on a name the
  table no longer lists. Worse, a rename is the one edit that can turn 50 g into 50 kg without anyone seeing.
  The screen says which ingredients and medicines use the unit and the route that is safe: add the new unit,
  move the items over, archive the old one. The **Thai name** is display-only and always editable; a unit
  nothing uses can be renamed freely.
- **Archive is refused while any ingredient or medicine has the unit**, naming them (first eight, then
  "…"). That is stricter than the table's trigger (which would allow an archived unit to stay on existing
  rows) because the brief asked for it; restoring always works. Changing a unit's tag away from a list it is
  used on is refused the same way.
- **The save checks read the table.** Ingredient create/update, medicine create/update and the prescription
  form's new-medicine path check `usableUnit` (live, tagged for that list); the 0252 trigger remains the
  database's own refusal for any route. A row opened on a unit that has since been archived or retagged still
  shows it in its picker (`UnitSelect` adds the current value) and saves unchanged, as the trigger allows.
- **Labels come from the table, with no dictionary list.** `enums.dietUnit` / `enums.doseUnit`,
  `DIET_UNITS`, `DOSE_UNITS`, `isDietUnit`, `isDoseUnit` are deleted. `getT()` and `I18nProvider` (fed by the
  root layout, once per request) fill `t.enums.unitNames` from the units table, Thai name for a Thai reader,
  so every page prints a new unit by its own name with no edit to that page, and an unknown stored value prints
  as stored. `dietUnitLabel` / `doseUnitLabel` **remain as aliases of one `unitLabel`**: deleting them means
  editing `src/app/deliveries/` and `src/app/management/purchasing/`, which another stream owns this batch.
  A follow-up can inline them. They no longer carry a list, only a lookup.
- **Cost accepted:** the old labels were "can(s)", "tablet(s)"; table names are plain ("can"), so a count
  reads "3 can" rather than "3 can(s)". Lutan can type any name he likes on the Units screen. And the root
  layout now reads the units table on each request (one small query, deduplicated with React `cache`).
- **`each` reads as the number.** A recipe line, the Feeding list, the special-diets list and the resident
  Diet page print "Egg 1.5", not "1.5 each Egg" (`isCountUnit` / `withUnit`, `recipe-book.ts`). It is decided
  on the printed label, so a Thai reader, whose unit is ชิ้น, still sees "1 ชิ้น Egg", which is natural Thai.
  `kg` is still not seeded (see the schema decision); an admin adds it on the screen if wanted.
- **Not touched, as required:** `src/app/deliveries/`, `src/app/management/purchasing/`. Checked by reading
  (and fetching in dev) that a new unit's name reaches the stocktake sheet, the delivery form and purchasing.
