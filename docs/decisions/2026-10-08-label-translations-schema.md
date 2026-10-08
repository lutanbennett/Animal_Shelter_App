# Thai for every label: the audit, and the schema behind one Translations page

2026-10-08, `claude/translations-schema-0166`, migration `0166_label_translations.sql`. The schema half of the
backlog item **"One place to translate everything"**; the page is the next stream (batch 79).

## The rule stays: labels in paired columns, prose in `translations`

The item offered moving labels into the `translations` table so one storage would serve the page. Not taken:

- It is a migration of live data (zone, enclosure, folder and website labels already have Thai in columns), and the
  brief for this stream rules that out.
- Every screen that shows a label reads it as a column today (`zones.name_th` and the views carrying
  `zone_name_th`). Moving them means rewriting every reader, for no gain to the person reading.
- The one thing a paired column could not do — say the English changed after the Thai was written — is now
  answered without moving anything: `label_sources` keeps the English each Thai label was written against, kept by
  a trigger on each registered table. That is the "English snapshot" the item said a label would need.

So labels get what prose already had, side by side with it:

| Prose (since 0056) | Labels (0166) |
|---|---|
| `translatable_fields` — which columns | `translatable_labels` — which column, its Thai column, the page's group, `optional` |
| `translations.reviewed_source_text` | `label_sources.source_text` |
| `translation_queue` view | `label_translations()` (missing / as_typed / stale / current) |
| update `translations` under `translations.manage` | `set_label_th()` under `translations.manage` |

`label_translations()` and `set_label_th()` are security definer and ask **`translations.view` /
`translations.manage`**, not the list's own permission. That is the item's point 4: the Director holds
`translations.manage` but not Settings → Diets, and translating "Standard Kibble + Chicken" is not editing the diet
list. `set_label_th()` can only write a registered Thai column, so it is not a back door into anything else on the
row. The row's own audit trigger still records the write under the translator's name.

Existing Thai labels were snapshotted against today's English, so nothing reads "out of date" on day one; there is
no way to know otherwise.

## The audit: every label a Thai reader can meet

Measured on dev (`information_schema`, sample rows, `pg_depend` for the views), not reasoned from file names.

### Already had Thai, now registered for the page

| Field | Thai column | Group | Edited today on |
|---|---|---|---|
| Website tagline, hero alt, visiting hours | `site_content.*_th` | website | Settings → Website |
| Public impact figure labels | `impact_baselines.label_th` | website | Settings → Website |
| Project folder titles | `project_folders.name_th` | projects | the folder's Rename |
| Zone and enclosure names | `zones.name_th`, `enclosures.name_th` | places | Settings → Zones / Enclosures |
| Role names | `roles.name_th` | roles (optional) | Security → Roles. Built-in roles are named by the dictionaries, so an empty Thai is not missing |

### Had no Thai — column added in 0166

| Field | New column | Group | Why it needs Thai |
|---|---|---|---|
| **Diet names** | `diet_types.name_th` | diets | The item's first ask. Shown on the diet list, a resident's Diet tab, the Head of Medical's special diets, stocktake, purchasing |
| Frequency labels | `frequency.label_th` | setup_lists | "Twice daily" printed raw on a resident's Medical tab and in the prescription picker. (The medication list itself already words the schedule from the dictionaries.) |
| Immunization type names | `immunization_types.name_th` | setup_lists | "Rabies", "Deworming (Praferen)". Also F-11 |
| Procedure type names | `procedure_types.name_th` | setup_lists | "Teeth cleaning", "Spay / neuter". Also F-11 |
| Blood test type names | `blood_test_types.name_th` | setup_lists | "CBC (Complete Blood Count)". Also F-11 |
| Stock unit names | `item_unit_conversions.unit_th` | units | Free text ("bag (20 kg)", "packet") on stocktake and deliveries |
| Fixed monthly costs | `fixed_outgoings.label_th` | money | Read by Management and the Director on the cash-flow page |
| Website photo alt text | `site_content_photos.alt_th` | website | The hero already had `hero_alt_th`; the gallery photos did not |
| Medication names | `medication.name_th` | medications, **optional** | See below |
| Clinic names | `vets.name_th` | setup_lists, **optional** | See below |

**Optional** means an empty Thai shows as **"shown as typed"** (`as_typed`), not **"missing"**. Most medicine names
are drug or brand names that read the same in Thai (Amoxiclav, Bravecto, Gabapentin), and most clinics are proper
names. A few are descriptive ("Subcutaneous Fluids", "Iron Injection", "LCA Onsite blood work"), and those can be
given Thai. The page must say "shown as typed" for the rest rather than leaving them looking forgotten.

### Prose that joins the queue in 0166

| Field | Mechanism | Why |
|---|---|---|
| Recurring job title and description | `translatable_fields` + the 0056 triggers, backfilled | Same shape as maintenance job title and description (0057), which went to the table. The queue labels them "Recurring job · <title>" and links to `/management/recurring-jobs` |

This one is visible as soon as `0166` is applied: the existing Translations page lists them with the other prose,
hence the dictionary labels and the releases line in this PR.

### Need nothing

| Field | Why |
|---|---|
| Diet units (`diet_types.unit`), medicine dose units (`medication.dose_unit`) | Fixed vocabularies, translated by `dietUnitLabel` / `doseUnitLabel` |
| Species, sex, size, status, contact type, photo folder, project category | Enums, translated by the dictionaries |
| Rounds (morning / lunch / evening) | Seeded with their Thai (0137) |
| `residents.thai_name` | A second name, not a translation of the first (0056). Stays on the resident's own screen |
| Resident and contact names, doctors' names, group origins ("Doi Suthep Puppies October 2022") | Names; shown as typed |
| Internal notes (diet, prescription, weight, intake) | The machine-translation phase's (0056, `tier = 'machine'`), not a hand queue |

### Found, not done here: resident breed and colour

`residents.breed` and `residents.colour` are free text a Thai reader sees on the resident page and on `/adopt`. Few
are filled in on dev (four breeds, three colours). Giving them Thai means changing `public_resident_cards` and
`public_resident_profiles`, the public tier's two biggest views, which is its own careful change. Filed on the
backlog rather than folded in.

## The views

A new column is invisible through a fixed-column view. Re-created with the Thai column appended, same audience and
filters, grants restated:

| View | Gains |
|---|---|
| `picker_diet_types`, `stock_diet_types` | `name_th` |
| `special_diet_list` | `diet_name_th` |
| `picker_medications`, `stock_medications`, `medication_list_medications` | `name_th` |
| `picker_immunization_types` | `name_th` |
| `immunization_next_due` | `immunization_type_name_th` |
| `public_site_content_photos` | `alt_th` (public, as `alt` is) |
| `private.translation_queue` | no new column; label and link for recurring jobs |

Not changed, and why:

- `immunization_compliance` (private, carries `immunization_type_name`): the overdue list. Batch 79 should read the
  Thai name from `picker_immunization_types` by id rather than widen a gated private view.
- `frequency_round_status`, `prescription_round_status`: counts, not names on a screen.
- `recurring_job_staffing`: the title's translation lives in `translations`, read through `translation_queue` /
  `approved_translations`.
- Frequency, procedure and blood-test types, unit conversions, fixed outgoings and clinics are read from their base
  tables, whose existing select policies already reach the new columns.

## What batch 79 builds

1. The page: prose from `translation_queue` as today, plus labels from `label_translations()`, grouped by
   `label_group`, filters missing / out of date (`stale`) / all, counts per group, the inline editor calling
   `set_label_th()`, and a link to each label's own screen.
2. The Thai field on each list's own screen (diets, frequencies, the three medical type lists, units, fixed costs,
   medicines, clinics, website photos), so someone adding a diet types the Thai there and then.
3. Every reader shows the Thai to a Thai reader, falling back to the English.
4. `translations.manage` in the permissions catalogue: covers labels whose list the holder cannot open.
