# Icon buttons: the resident hub and its tabs (2026-10-04)

First of four area PRs for the backlog item "Turn word-only action links into
icon buttons" (Mobile). The look set here is the pattern the Management,
maintenance and "rest" areas copy.

## The rule the audit applied

A **navigation** link in a sentence, a list or a table (a resident's name, an
enclosure's name, "Show" on a filter notice) stays a text link. An **action**
(Add, Edit, Log, Remove, Restore, End, Register, Clear) becomes a button:

1. the page's main action: filled `ActionLink` with icon and word (already so
   on every hub tab; unchanged),
2. a secondary action beside other content: outlined `ActionLink` or a bordered
   icon + word button,
3. an action repeated on every row: icon-only `RowActionLink` / `RowActionButton`
   (src/components/RowAction.tsx), 44 px square on phones (36 px with a mouse), a
   tooltip with the word, and an accessible name "Edit: <row subject>"
   (e.g. "Edit: 4.2 kg · 2 Oct") so a screen reader can tell rows apart.

Destructive actions keep their confirm step; the adoption-update delete takes
the red `danger` tone. Nothing changes what an action does.

## The audit (resident hub area, 32 text links)

| Where | Link | Verdict |
|---|---|---|
| residents/page.tsx | "Show" on deceased/adopted match notices (x2) | navigation in a sentence: stays |
| residents/page.tsx | Register as a new resident (chip not found) | action: primary ActionLink + add icon |
| residents/ResidentsTable.tsx | resident name | navigation: stays |
| residents/new/WizardChrome.tsx | Edit on a review group | action: bordered icon + word button (client button, not ActionLink) |
| [id]/ResidentWhoAndWhere.tsx | enclosure name | navigation: stays |
| [id]/edit/EditResidentForm.tsx | upload photos; return from hospital / carer (x3, all inside sentences) | navigation in a sentence: stay |
| [id]/[section]/page.tsx, vet visits | Edit, Log blood test, Add prescription, Edit/Log weight, Log procedure, Send to hospital (x7 per row) | row actions: icon buttons (pencil, droplet, pill, weight, scissors, ambulance) |
| [id]/[section]/page.tsx, weight | Edit | row action: pencil |
| [id]/adoption-updates/AdoptionUpdateActions.tsx | Edit / add photos, Delete | row actions: pencil, bin (danger) |
| components/RecordRowActions.tsx | Edit, End today (prescriptions, diets) | row actions: pencil, calendar-x |
| components/ArchiveRecordControl.tsx | Remove, Restore (immunizations, visits, prescriptions, weights) | row actions: archive, archive-restore |
| weight/WeightForm.tsx | Edit that reading (same-day notice) | secondary action: outlined ActionLink + pencil |
| medical/ResidentPicker.tsx | Clear search | action: x icon + word, 44 px |
| medical/photos, medical/weight, weight/, prescriptions/, diets/ | Back to … (x9) | navigation, standalone: stays a text link, now `BackLink` with an arrow and 44 px |
| [id]/[section]/page.tsx | "Back to <resident>" at the top of every tab | navigation: untouched (muted, not primary); a candidate for BackLink in a later area |

## Icon map (src/components/hub-icons.ts, `ACTION_ICONS`)

One icon per generic meaning, extended rather than chosen per page:
add = Plus, edit = Pencil, delete = Trash2, archive = Archive, restore =
ArchiveRestore, endToday = CalendarX2, back = ArrowLeft, clear = X. Domain
actions reuse the existing maps: blood test = SECTION_ICONS["blood-tests"],
prescription = SECTION_ICONS.prescriptions, weight, procedure, hospital =
PLACEMENT_ICONS.hospital.

`ActionLink` also gained a 44 px minimum height/width on phones.

## Known limits

- "Remove" in the medical archive is a reversible archive, so it takes the
  archive-box icon, not the bin; the bin is reserved for a real delete.
- No automated 375 px check exists yet (`check-phone-width.mjs`, batch 50);
  Thai wrapping is checked by hand.
