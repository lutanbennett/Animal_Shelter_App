# 2026-10-07: a "see translations" cell replaces `sees_all_translations()`

**Decision.** `0154` adds the activity `translations.view` (Yes/No, area management, sort 56) and gives
it to management and staff. The `translations` read policy now asks
`has_permission('translations.view') or has_permission('translations.manage', 'read')`, and
`sees_all_translations()` is dropped. Nothing else called it (`grep` over `src/`, `scripts/`, `worker/`
and every migration found only `0150` and the docs).

**Why this is better than the stand-in, not only tidier.** `0150` could not ask `has_permission()` alone,
because staff held no cell for reading translations, so it asked `sees_all_residents()`, and that is true
for `public_viewer` (scope all, legacy role not volunteer). `check-app-access-gate` caught
`public_viewer reads 76 rows of translations`, and the fix was a second condition (`roles.opens_app`).
Now `public_viewer` is kept out by `has_permission()` itself, because it holds no cells. The rule that
a scope function is only safe beside a cell no longer has a counter-example on this table.
`check-app-access-gate` reads `translations` as `public_viewer`: it still reports 0 rows.

**Name and level.** `translations.view`, Yes/No, as `audit.view` is: "may look at this", with nothing
to choose between Read and Edit, so the matrix shows a tick. It is *read only by meaning*: the
Translations page and every write stay on `translations.manage`, which is still management's alone.
Staff gain no edit control (the page asks `translations.manage`; staff are redirected to `/no-access`,
as before).

**Why the policy keeps `translations.manage` at Read.** So a role given the manage cell but not the view
cell still reads what it translates, exactly as in `0150`. The alternative, a prerequisite
(`requires`) from manage to view, would change the matrix's rules for one table; nothing else states one yet.

**One tightening.** A *custom* role with `scope_residents = all` and no cell used to read every row
through `sees_all_residents()`. It now needs the cell. No such role exists; the harness fixture that
asserted the old behaviour (`c_floor_all`) was replaced by a role holding only the new cell.

**Left alone.** `vet_read_translations` and `volunteer_read_translations` are `perm-convert-vet`'s.
`translations_maintenance_select_perm` (0141) already asks `has_permission`.

**Not probed.** `translations.view` is in `NO_DB_PROBE`, not `PROBES`: a read probe would mark the vet
and volunteer, who read through their legacy policies, as differences that are not this cell's. The
cell is exercised under every login by `check-perm-convert-settings.mjs` and `check-app-access-gate.mjs`.
The probe count is therefore unchanged; the `check-permission-tables` constants moved
(56 activities, 37/19 yes-no/level, management 49 and staff 38 cells, 672 answers).

**For "one place to translate everything".** The cell that project needed to let people *see* the
text exists. Letting staff *translate* is a separate cell (`translations.manage` stays the write).
If that project makes translating a shared job, the shape is a level activity that replaces the
pair, `translations.text` Read/Edit, with `translations.view` becoming its Read; not built here.
