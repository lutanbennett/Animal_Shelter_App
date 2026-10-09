# The Translations page: labels beside prose, and Thai on every screen

2026-10-09, `claude/translations-page`. The feature half of **"One place to translate everything"**; the schema half
is `0166` and `docs/decisions/2026-10-08-label-translations-schema.md`. No migration here.

## One list, filtered on the client

The page loads everything once: the whole prose queue (approved too) and every row of `label_translations()`. The
filter (`?show=missing|stale|all`, `missing` by default; the old `?all=1` still opens All) is applied in the browser
over rows the page already holds. That is what lets the counts at the top always describe the whole picture rather
than the filtered slice, and lets a row saved under Missing drop out of the list straight away. At shelter scale
(about 200 labels and 100 prose rows on dev) one load is cheap.

What each filter means:

| | Prose (`translations`) | Labels (`label_translations()`) |
|---|---|---|
| Missing | `pending` or `draft` (a machine draft is not a person's translation) | `missing` |
| Out of date | `stale` | `stale` |
| All | everything | everything, including `as_typed` and `current` |

**"Shown as typed" is never counted and never under Missing.** Medicines, clinics and built-in roles are optional
lists; an empty Thai there is a deliberate answer. They appear only under All, with a line saying so, and the summary
gives them their own muted count ("24 shown as typed") so they are visible without reading as work.

## Groups come from the rows

A label's section is its `label_group`; a prose row's is its table, mapped (`residents` → Residents,
`project_folders` and `attachments` → Projects, `site_pages` → Website, `shelter_friends` → Shelter Friends, and so on;
an unknown table is its own section). `GROUP_ORDER` in `src/lib/translations/labels.ts` only **orders** the sections
the item named; a group nobody listed sorts after them by name. Group titles come from the dictionaries with the key
as the fallback. So a label registered later (batch 81's breed and colour) appears with no code change; it only reads
better once the dictionaries name its group.

A section with nothing to show under the current filter is left out of the body but stays in the summary, so "All
done" is something you can see.

## The link to "where it is used"

`LABEL_SCREENS` lists, per table, the screens a label is typed on, best first. The page links to the **first one the
viewer can open** (`canOpen()` on the route registry), and otherwise says the list is not one they can open and that
translating here is enough. The Director holds `translations.manage` but not `reference.types`, and a link she would
be turned away from is worse than none. A table with no entry simply has no link.

## Writing a label, and "the Thai is still right"

The page writes through `set_label_th()`, so translating asks `translations.manage` and nothing else and can only ever
write a registered Thai column. Measured on dev with a Management login: the Thai of a blood-test type (an Admin list)
saved; a direct update of the same row's English changed nothing; an unregistered column was refused.

`record_label_sources()` (0166) re-snapshots the English only when the Thai **changes**. So when the English changed and
the Thai is still correct, saving the same Thai again would leave the label out of date for ever. The action takes a
`reconfirm` flag for that case and clears the Thai before writing it back, which takes a fresh snapshot. It costs two
audit rows under the translator's name for one deliberate act; the alternative was a schema change to the trigger,
which this stream may not make. Measured: same Thai saved alone stayed `stale`; clear-then-set read `current`.

The save revalidates the whole app (`revalidatePath("/", "layout")`): one diet name is read on a dozen screens, and
guessing which is how one gets missed.

## The field on its own screen

Diets, medicines (optional, with the hint), frequencies, the immunization, procedure and blood-test type lists,
clinics (optional), units (in the units panel) and fixed outgoings each gained a Thai box on add and on edit, and show
the Thai under the English. Not done:

- **Website gallery photos.** Their English alt text has no editor anywhere in the app today, so there is no screen to
  add a Thai box to; Management → Translations is the only door for `alt_th`. Giving the gallery an alt editor is a
  website change, not a translation one.
- **Project folder titles, zones, enclosures, the website's tagline, hero alt and visiting hours, impact labels** already
  had their Thai box (0058, 0124 and earlier).

## Every reader shows the Thai

The rule is "localise at the server boundary": the page or loader that selects a label also selects its Thai and
hands the component a `name` already in the reader's language (`localLabel()`), so components that print `.name`
needed no change. Where a value is also a key — a stock unit's English is what `stock_*.entered` stamps (0118), and the
unit picker's option value — only the shown text changes; the value stays English.

**Never localise a value that feeds an edit form.** The Settings list screens keep showing both languages and edit the
English; only read screens and pickers (whose value is an id) were localised.

`immunization_compliance` was left narrow, as 0166 asked: the Thai for a missing vaccine is read from
`picker_immunization_types` by id, and only when the reader reads Thai.

Left in English on purpose:

- **The deceased resident's archive** (`src/lib/archive/`): a PDF and an offline index written once when the file is
  closed, for the record. Which language a closing record should be written in is its own question.
- **The CSV export and Drive file names**: data and paths, not screens.
- **The assistant's lookups**: it matches what people type, which is the English key.
- **The dashboard's procedure grouping** reads `procedure_types.name` to classify, not to show.

## How the walk was done

The 375 px visual pass needs someone signed in at a phone width, which no session can do here (reading a test
password back is refused). What was done instead, and is repeatable: every label in the tables a Thai reader meets
(diets, medicines, frequencies, the three type lists, units, clinics) was given a temporary marked Thai, each page the
2IC, the Head of Medical and the Head of Maintenance can open (and Management's stock, clinic and resident pages) was
fetched in Thai as a disposable account of that role, and every registered English label still on the page was
listed. It found two real misses (a stock unit on the delivery history and on the medicine stock cards), both fixed;
the rest were typed text (a unit's note, a test result, an address) or a list's own edit screen, which shows both by
design. The marked Thai was removed afterwards. The visual pass is in the test plan for a person.
