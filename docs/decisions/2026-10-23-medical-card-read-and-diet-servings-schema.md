# Schema for the Medical records card page (0249) and for one-amount-per-serving diets (0250)

Status: schema landed in one PR (CLAUDE.md allows one migration branch at a time and both features are
three batches deep). The app halves are separate streams. Nothing reads either migration's new objects yet.

## 0249: a medical-edit login may READ the record

**Problem** (`2026-10-22-medical-card-opens-the-record.md`): `residents_select_perm` and
`placement_history_select_perm` (0144) ask `sees_all_residents()`, false for `who_and_where`, so the card
page would open blank.

**Shape.** New `may_open_resident_record()` = `sees_all_residents()` OR a live `who_and_where` role whose own
`role_permissions` include an **edit** (`level >= 2`) of some `medical.*` activity. Used on those two **read**
policies only, still ANDed with `has_permission('resident.record', 'read')`. Every write policy keeps
`sees_all_residents()`.

**Why it does not widen 0134.** The volunteer and the Head of Maintenance hold no `medical.*` edit, so they
still read a resident only through `resident_who_and_where`. The vet is `own_clinic`, not `who_and_where`, so
the vet's `vet_*` policies are untouched. The scope and the medical edit have to be on the same role row.
It is keyed off the rights a role holds, not off role names, so a configured role with a medical edit gains
the read and a role without one does not.

**Live dev roles that gain it:** `head_of_medical` (weight), `second_in_command` (diet, immunizations,
prescriptions, weight) and card-only logins made with a medical edit. Unchanged: admin, management, doctor,
volunteer, head_of_maintenance. Production's `roles` could not be read from this session (production reads
are refused here), so the same list is to be confirmed on production at apply time; the function is driven
by the rows, so it will do whatever production's rows say.

**Left out on purpose, reported not built.** Resident photos/attachments (0152/0189/0223) and
`adoption_updates` still ask `sees_all_residents()`. A card login will see the page without them.

## 0250: diets, one amount per serving

`diets.servings_small/medium/large` (1 / 1.5 / 2) and `diet_ingredients.qty_per_serving`. A serving is one
day's food (Lutan, 2026-10-22), so the forecast has no meals-per-day factor, and nothing is rounded before the
total. Back-fill: `qty_per_serving = qty_small / servings_small` (Small = 1 serving).

**The forecast functions are deliberately not touched.** They keep reading `qty_small/medium/large`, so no
forecast number moves when this lands, which is the only way the out-of-proportion lines stay Lutan's call.
Switching them is the app half's first schema step (a function-only migration), after he has ruled. A bridge
trigger keeps `qty_per_serving` in step with edits the old app makes to `qty_small`, so nothing is stale in
between.

**Out-of-proportion lines** (Medium and Large not 1.5x and 2x Small within 0.005) are printed as NOTICEs when
the migration is applied, and by `scripts/check-diets-per-serving-schema.mjs`. On dev, 8 of 9 lines. Each is
Lutan's decision: keep the Small-based serving or set a different servings figure on that diet.

Proof: `scripts/check-medical-card-reads-record.mjs` and `scripts/check-diets-per-serving-schema.mjs`, each a
rolled-back transaction on dev that applies the file's own text.
