# Icon buttons: Management (2026-10-04)

Second of four area PRs for the backlog item "Turn word-only action links into
icon buttons" (Mobile). It applies the pattern settled in
`2026-10-04-icon-buttons-resident-hub.md` (the rule, the three tiers, the
44 px target, "Edit: <row subject>" accessible names) without redesigning it.
Nothing changes what an action does.

## The audit (src/app/management, about 30 files)

Every link, button and word-only control, one line each. **Navigation** stays
a text link; an **action** becomes a button of the tier that fits.

| Where | Control | Verdict |
|---|---|---|
| medications/MedicationsTable | Edit, Count, Upload / Replace label, Merge, Delete (per row) | row actions: pencil, clipboard-check, image-up, merge, bin (danger) |
| medications/MedicationsTable | Remove label | row action: image-off (not the bin: it takes the photo off, the medication stays) |
| medications/MedicationsTable | Save, Cancel, Merge (confirm) in the edit / count / merge states | form confirm buttons already filled or bordered with words: unchanged |
| diets/DietTypesTable | Edit, Count, Make standard, Delete | row actions: pencil, clipboard-check, star, bin (danger) |
| vets/VetsTable | Edit, Delete | row actions: pencil, bin (danger) |
| vets/VetsTable | vet name, visit count, "N doctors" | navigation: stay |
| vets/[id]/doctors/DoctorsTable | Rename, Same person as…, Mark as left / active, Delete | row actions: pencil, merge, user-minus / user-check, bin (danger) |
| vets/[id]/doctors/page | Back to vets | navigation, standalone: `BackLink` (arrow, 44 px) |
| vets/page, doctors/page | "View the vet list / hub" inside the subtitle sentence | navigation in a sentence: stays |
| contacts/ContactsTable | Edit, Delete, Archive, Restore | row actions: pencil, bin (danger), archive, archive-restore |
| contacts/ContactsTable | name, "in care" count | navigation: stay |
| contacts/page | Add a Shelter Friend | page action: outlined `ActionLink` + plus, word kept |
| contacts/page | "Open the contact list", "Manage Shelter Friends →", archived / friends chips | navigation and filter toggles: stay |
| shelter-friends/page | Add a Shelter Friend | page main action: filled `ActionLink` + plus, word kept on phones |
| shelter-friends/page | "View the Shelter Friends page" in a sentence | navigation: stays |
| shelter-friends/FriendsOrder | Publish / Unpublish, Move up, Move down | row actions: globe / globe-lock, arrow-up, arrow-down |
| shelter-friends/FriendsOrder | friend name | navigation: stays |
| shelter-friends/new/FriendWizard | Open card, View list, Add another (end of wizard) | already buttons; given an icon and 44 px |
| shelter-friends/new/FriendWizard | Choose / Replace logo, Remove logo | secondary actions: image-up, image-off (danger), word kept, 44 px |
| shelter-friends/new/FriendWizard | mode chips, contact picker rows, Back / Next, Save draft / Publish | choosers and wizard navigation: unchanged |
| recurring-jobs/RecurringJobsView | Edit, Pause / Resume, Delete (per job) | row actions: pencil, pause / play, bin (danger) |
| recurring-jobs/RecurringJobsView | Hand back (per covered job) | row action: undo |
| recurring-jobs/RecurringJobsView | New recurring job | main action: already filled with plus and word; 44 px on phones |
| recurring-jobs/RecurringJobsView | "Opens /path" on a job | navigation: stays |
| recurring-jobs/RecurringJobForm, HandOver | Save, Cancel, Hand over, weekday chips | form submit and toggles: unchanged |
| cashflow/fixed-outgoings/FixedOutgoingsEditor | Edit, Delete (per line) | row actions: pencil, bin (danger) |
| cashflow/fixed-outgoings/FixedOutgoingsEditor | Add a line | main action: filled button gets the plus icon and 44 px |
| cashflow/fixed-outgoings/page | Back to cashflow | navigation, standalone: `BackLink` |
| cashflow/CashflowView | category toggles | filter toggles (`aria-pressed`): unchanged |
| cashflow/CashflowView | Download CSV | already icon + word; 44 px on phones |
| cashflow/CashflowView | "N unpriced", links to Admin → Website and Fixed outgoings | navigation in a table and in sentences: stay |
| cashflow/page | 30 / 90 / 365 day windows | filter navigation: unchanged |
| medications/page, diets/page | Stocktake, Stock between counts, Purchasing, Delivery shortcuts | task shortcuts, not links in a sentence: outlined `ActionLink`, icon and word, 44 px (were bare text links with an icon) |
| Create*Form (medication, diet, vet, contact), AddDoctorForm (x2) | Add … submit | main action: filled, now with the plus and 44 px |
| stock-usage/page | Clear (compare filter) | action: x icon + word, 44 px (as the resident hub's Clear search) |
| stock-usage/page | Show, "Record deliveries" in the note | submit stays; link in a sentence stays |
| purchasing/page | period chips, lead-time toggle, "Stocktake" in a banner | filter navigation and a link in a sentence: stay |
| purchasing/page | Download CSV, Print | already icon + word; 44 px on phones (shared `CsvDownloadButton`, `PrintButton`) |
| purchasing/PurchasingPhone | period tiles, Count them, Print, Download | **phone-first, already big icon + word buttons (#334): audited, unchanged** |
| medication-list/page | round tiles, Pick / List view | **phone-first, already big tiles: audited, unchanged** |
| dashboard/page | previous / next month | navigation, already icon-only; 44 px on phones. "This month": navigation, stays |
| dashboard/ReportCard | resident names | navigation: stay |
| translations/TranslationQueue | Show / Hide approved | filter toggle (as "Show" on a filter notice): stays |
| translations/TranslationQueue | Open record | navigation to the record: stays |

The stocktake card-by-card and deliveries screens live outside
`src/app/management` and keep their own area.

## Icon map additions (`ACTION_ICONS`)

Added as generic meanings, not per page, so the next two areas reuse them:

| Key | Icon | Used for |
|---|---|---|
| count | ClipboardCheck | count stock (same icon as the Stocktake nav entry) |
| merge | Merge | fold one medication or doctor into another |
| uploadImage | ImageUp | add or replace a photo on a record |
| removeImage | ImageOff | take a photo off a record (the record stays) |
| moveUp, moveDown | ArrowUp, ArrowDown | reorder |
| makeStandard | Star | make this the default diet |
| deactivate, activate | UserMinus, UserCheck | a doctor who has left, and back |
| pause, resume | Pause, Play | put a recurring job on hold, and back |
| publish, unpublish | Globe, GlobeLock | on the public website, and off |
| handBack | Undo2 | give a covered job back |

`RowActionLink` / `RowActionButton` gained an optional `hint`: the tooltip when
it should say more than the word (why Delete is disabled: "has prescriptions",
"has visits"). The accessible name stays "Delete: <row>", and the reason is the
description, so the explanation the old `title` carried is not lost.
`ArchiveContactControl` gained `iconOnly` for the table row; the contact's own
page, which belongs to a later area, is unchanged.

## Choices worth knowing

- **Disabled delete keeps its reason.** The old buttons put "has N prescriptions"
  in `title`; the icon buttons put it in `hint`, so it still shows on hover.
- **Not every Remove is a bin.** The bin is only on Delete, which destroys a
  medication, diet, vet, doctor, contact, job or fixed line (each already behind
  a confirm). Remove label, Mark as left and Archive are reversible or leave the
  record, so they take image-off, user-minus and archive.
- **Publish / Unpublish is icon-only.** It repeats on every friend row, so it
  follows the row rule; the word is in the tooltip and the accessible name, and
  the badge beside it ("On the website" / "Draft") says the state in words.
- **Move up / down already named the friend** ("Move X up"), so they take no
  `subject`.
- **The actions cell holds its width on desktop** (`md:min-w-…`). Without it
  the table's auto layout stacked five 36 px icons in a column, and the row
  tripled in height.
- **Friend rows wrap their buttons under the name on a phone.** Three 44 px
  buttons beside a 12-character name overlapped the badges at 375 px; the name
  column now has a 10 rem floor, so the group drops to its own line.

## Known limits

- No automated 375 px check exists yet (`check-phone-width.mjs`, batch 50);
  overflow and 44 px were measured by hand with a script in the browser pane,
  in English and Thai. Wrapping defect found: the friend rows above, which the
  script would have caught. Another argument for pulling it earlier.
- Management desktop-only pages (the large tables) were checked for the new
  buttons at desktop width; at 375 px they show the "Best on a larger screen"
  notice, which this area does not change.
- `TranslationPanel`, the shared panel inside the translations queue, is in
  `src/components` and is left to the "rest" area.
