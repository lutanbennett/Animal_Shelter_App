# Icon buttons: everything else, and the whole sweep (2026-10-05)

Fourth and last area PR for the backlog item "Turn word-only action links into
icon buttons" (Mobile). It covers maintenance, projects, enclosures, contacts,
vets, vet visits, deliveries, stocktake, login, our-work, adopt and the shared
`TranslationPanel`, and it closes the item.

## The sweep in one place

| Area | Scope | PR | Decision file |
|---|---|---|---|
| 1 | resident hub and its tabs | #361 | `2026-10-04-icon-buttons-resident-hub.md` (the rule) |
| 2 | Management, ~30 files | #367 | `2026-10-04-icon-buttons-management.md` (most of the icon map) |
| 3 | `/admin`, plus `ActionButton` | #371 | `2026-10-05-icon-buttons-admin.md` |
| 4 | everything else (this file) | `icon-buttons-rest` | this file |

The rule, from area 1: a **navigation** link (in a sentence, a list or a table)
stays a text link; an **action** becomes a button. The page's main action is a
filled `ActionLink` with icon and word; a secondary action is an outlined
`ActionLink` / `ActionButton`; an action repeated on every row is an icon-only
`RowActionLink` / `RowActionButton` with a tooltip and an accessible name
"Edit: <row subject>". 44 px on a phone, 36 px with a mouse. Destructive actions
keep their confirm step and a real delete takes the red `danger` tone. Nothing
changes what an action does.

**What is left on purpose.** About 27 `text-primary` links remain under
Management and about 17 under `/admin`, and a resident's name, an enclosure's
name or a "Show" on a filter notice stays a link everywhere. Those are
navigation, not a gap. A later sweep that greps `text-primary hover:underline`
and treats every hit as a miss would undo the audit.

### The final icon vocabulary (`ACTION_ICONS` in `src/components/hub-icons.ts`)

| Meaning | Keys |
|---|---|
| create / change / remove | `add` Plus, `edit` Pencil, `delete` Trash2 (only where something is destroyed) |
| keep but set aside | `archive` Archive, `restore` ArchiveRestore, `endToday` CalendarX2 |
| leave / dismiss | `back` ArrowLeft, `clear` X |
| lists and stock | `count` ClipboardCheck, `merge` Merge, `makeStandard` Star |
| photos | `uploadImage` ImageUp, `removeImage` ImageOff, `moveUp` / `moveDown`, `moveLeft` / `moveRight` |
| people | `deactivate` / `activate` UserMinus / UserCheck, `link` / `unlink` Link2 / Unlink |
| state | `pause` / `resume`, `publish` / `unpublish` Globe / GlobeLock |
| undo and hand-back | `handBack`, `undo` Undo2 (same glyph, different meanings) |
| checks and messages | `refresh` RefreshCw, `send` Send, `approve` / `deny` Check / Ban |
| sign-in security | `issuePassword` KeyRound, `resetTwoStep` ShieldOff, `allowTwoStep` ShieldCheck |
| **added here** | `manage` Settings (go to the Management or Admin editor for a list), `copy` Copy |

Domain actions (log a weight, send to hospital) stay in `SECTION_ICONS` /
`PLACEMENT_ICONS`. Three components carry the look: `ActionLink`, `ActionButton`
(area 3) and `RowAction` (area 1).

**The lesson for the next sweep of this kind.** Both keys added here were generic
meanings that should have been in the map from the start. `manage` is the "Edit
in Management / Settings" shortcut that sits on four pages; `copy` was a local
`Copy` import inside `CopyTagLink`, so the same meaning was drawn by a bespoke
button in one place and not at all elsewhere. Look for a component that imports a
lucide icon directly for an action: that is a meaning missing from the map.

## The audit (this area)

| Where | Link or control | Verdict |
|---|---|---|
| maintenance/MaintenanceJobView | Edit details (small pencil link) | secondary action: `ActionLink` + edit |
| maintenance/MaintenanceJobView | Delete job | `ActionButton` danger + bin (it deletes the job, its photos and the Drive folder; confirm kept) |
| maintenance/MaintenanceJobView | Add before / after photos | secondary: `ActionButton` + image-up (x when open) |
| maintenance/MaintenanceBoard | Everyone's jobs (empty state) | `ActionButton` + x: it clears the "mine" filter |
| maintenance/MaintenanceBoard | Clear (filters) | `ActionButton` + x, as Clear everywhere else |
| maintenance/MaintenanceBoard | New job | already filled with a plus; 44 px on a phone |
| maintenance/MaintenanceBoard | Mine / Everyone, status chips | choosers, not actions: kept, 44 px on a phone |
| maintenance/MaintenanceBoard | Move (per job) | already icon + word, 44 px: left alone |
| maintenance new, edit | Back links on the read-only notice | `ActionLink` + back |
| maintenance, vet-visit forms | Cancel, "← Back" links | navigation: stay, tap area raised to 44 px on a phone |
| maintenance/MaintenanceForm | Save, Next, step dots | form controls: unchanged |
| projects/FolderView | Rename, Move, Delete folder | were 32 px bordered buttons: `ActionButton` (edit, folder-input, bin danger) |
| projects/FolderView | Edit (project info card) | `ActionButton` compact + edit |
| projects/PhotoSection | × on a photo | row action: bin, 44 px (it deletes the attachment) |
| projects/PhotoSection | Edit caption / Add caption, Set / Clear cover | row actions: `RowActionButton` edit or plus, star; named for the photo |
| projects/FolderGrid | New folder, Create, Cancel | tile and form controls: unchanged |
| deliveries/DeleteDeliveryButton | Delete (per delivery) | row action: `RowActionButton` bin, danger, named "Delete: <item>" |
| deliveries/page | Stock usage link | navigation to a report: stays |
| stocktake | To list (x2) | already icon + word at 48 px, in-page navigation: left alone |
| contacts/page, ContactHub, vets/page, VetHub (x2), EnclosureHub | Manage in Admin / Manage doctors | action: `ActionLink` + manage, word kept |
| enclosures/EnclosureHub | Log maintenance | main action: filled `ActionLink` + plus |
| enclosures/EnclosureHub, EnclosureGrid | View all jobs, zone-wide jobs | navigation: stay |
| enclosures/EnclosureFilters | Clear | `ActionLink` + x; Apply raised to 44 px |
| components/CopyTagLink | Copy link (per enclosure, per resident) | row action: `RowActionButton` + copy, was 24 px |
| components/PlaceZoneChips, contacts/ContactList, adopt chips | filter chips | choosers: kept, 44 px on a phone |
| components/ArchiveContactControl | Archive / Restore (contact hub) | `ActionButton` + archive / restore icons (reversible, so not the bin) |
| contacts/ShelterFriendCard | Publish / Unpublish | `ActionButton` + globe / globe-lock |
| contacts/ShelterFriendCard | Edit profile | `ActionButton` + edit |
| contacts/ShelterFriendCard | Remove Shelter Friend status | `ActionButton` danger + bin (deletes the profile row; the contact stays; confirm kept) |
| contacts/ShelterFriendCard | Upload / Replace logo, Remove logo | image-up; image-off danger (the profile stays, so not the bin) |
| contacts/ShelterFriendCard | Preview, View on site | already icon + word; 44 px |
| components/TranslationPanel | Add / Edit translation | `ActionButton` compact + plus / edit |
| components/TranslationPanel | Clear | `ActionButton` danger compact + x (the word is Clear) |
| components/TranslationPanel | Cancel, Save / Approve | form controls: unchanged |
| login | Sign in, Google, Forgot password, Request access, Back | submit and navigation: stay, raised to 44 px; the three pages' links are tappable now |
| adopt, our-work | in-sentence links, cards, the category link | navigation: stay |
| adopt | filter chips | chooser: 44 px |
| vets, vet-visits | visit rows, resident names, Back | navigation: stay |

## The 44 px offer from `phone-width-check`: declined

The backlog item "Add 44 px tap targets to `check-phone-width.mjs`, if
`icon-buttons-rest` wants it" stays open. Reasons:

- The script's job is a clean answer to one question, "does this page scroll
  sideways?", and it fails only on a real overflow. A tap-target check needs a
  different standard (what counts as exempt: an inline link in a sentence, a
  list's name links, a hidden file input, the language switcher in the shared
  header) and every exempt decision is a judgement. Mixed into that script it
  would either fail on routine pages or carry an exemption list that needs
  upkeep, which turns a UI PR into a tooling PR.
- What was needed for this area was cheap without it: a scratch Playwright run
  signed in as a disposable admin that listed every non-inline link or button
  under 44 px on each page. It found everything fixed here (maintenance filter
  chips at 30 px, the photo, archive and copy buttons, the login links).
  Re-running it after the fixes showed only name links and the app-tone
  language switcher.
- The script is still useful as it is: it was run for overflow on this area's
  pages in English and Thai and stayed clean.

If a later pass wants the measurement automated, the exemption rules above are
the design work; the loop is already there.

## Choices worth knowing

- **"Manage in Admin" is an action; "Stock usage" is not.** The first goes to
  the editor for the list on the page you are looking at (you went there to
  change it), the second to a report. Both are links, but a verb that begins an
  edit gets the button.
- **Reversible removals do not get the bin.** Archive and Restore take the
  archive icons; Remove logo takes image-off; Remove Shelter Friend status,
  Delete job, Delete folder, Delete delivery and a project photo (each destroys
  a row or a file) take the bin.
- **Choosers stay choosers, at 44 px on phones.** Filter chips and the Mine /
  Everyone switch are not actions. They only got the tap height.
- **Pages that were not behind a desktop-only notice were measured at 375 px.**
  Maintenance, deliveries, stocktake and enclosures are phone field tools; no
  page in this area scrolled sideways in English or Thai, and the public pages
  were checked signed out.

## Known limits

- Name links in lists and tables (a contact, an enclosure, a vet's resident,
  "Front Zone 1" on a job) are 20 to 36 px tall. They are navigation.
- The wizard step dots on a new maintenance job are 26 to 30 px; they are
  navigation within the form and a separate change if wanted.
- The English / Thai switcher in the app header is 24 px tall on a phone; it is
  shared by every signed-in page and the login screens and is not part of this
  sweep. The public site's own switcher is already 44 px.
- A project folder with photos, and the Shelter Friend card's edit state, were
  built and typechecked but not exercised with a click in this session (no such
  row was in dev), so a person should look (test plan).
