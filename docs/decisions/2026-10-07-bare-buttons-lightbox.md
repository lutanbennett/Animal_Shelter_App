# Bare buttons: the ~80 unread files, and the photo lightbox at 375 px

2026-10-07, `claude/bare-buttons-lightbox`. Fourth and last pass after #405, #411
and #432 (the header was #413). Extends `2026-10-07-bare-buttons-groups.md`.

## What was read

Every `.tsx` under `src/` with a raw `<button>`: 200 of them in 90 files at the
start (`dd979395`), each read in place rather than replaced by pattern. The test
for each was the one #432 used: **would someone tap this to do something** (an
action: needs 44 px), or to switch a view, a filter or a choice in a form (a tab,
chip or radio: does not)? After this pass 114 raw buttons remain in 57 files, and
every one is ruled below.

## Moved onto ActionButton / RowActionButton

About 85 buttons. The ones that matter most, because they are tapped on a phone:

- **Uploads and attachments** (`AttachmentUploader`, `PhotoUploader`,
  `DeferredUploads`, `MedicalPhotoUploader`): Retry, Dismiss, remove-before-upload.
- **Blood tests and procedures** (`BloodTestList`, `ProcedureList`): Attach files,
  Close, and the remove x on each attached file. That x was `hidden … group-hover:block`,
  so **on a phone it never appeared at all**: a wrong file attached to a medical
  record could only be removed from a computer. It now shows on phones (hover with
  a mouse, as before) and **asks first** (`t.common.removeFileConfirm`, both
  dictionaries), because it deletes the file and a 44 px target is easy to hit by
  accident. The maintenance job's attachment x got the same confirm for the same reason.
- **Resident records**: archive reason Archive/Cancel (`ArchiveRecordControl`,
  `ArchiveContactControl`), translation Cancel/Approve, Record death and its Cancel,
  adoption-update delete confirm and photo dismiss, the x that goes back from "add
  new" to "choose existing" on the prescription, procedure and intake forms, and
  the optional date's Clear.
- **The assistant**: Confirm / Cancel on every draft card, and the panel's close x.
- **Projects**: new folder Create/Cancel, folder edit Save/Cancel, photo Add, caption
  Save/Cancel, the search clear x, photo remove.
- **Management and Admin setup tables** (eleven: medications, diets, doctors, vets,
  contacts, blood-test / procedure / immunization types, frequencies, zones,
  enclosures): the inline Save / Merge / Cancel all shared one hand-rolled 26 px
  button. They sit behind the larger-screen notice, but the Director runs
  Management from a phone by day and #432 set the precedent with `UnitsPanel`.
- The rest: Undo's yes/cancel in Recent changes, two-step Start and Confirm, the
  website Save changes, Make a shelter friend and its Save, fixed outgoings and
  recurring jobs, stock usage Show, temporary password Copy.

**One new pattern, `RowActionButton tone="overlay"`.** Remove buttons sit on top of
a photo or file thumbnail, where the plain bordered `RowActionButton` would vanish
into the image. The overlay tone is the dark translucent square every one of those
buttons already hand-rolled, now in one place and measured by the check. The
border colour moved from `BASE` into each tone so the overlay's transparent border
does not depend on Tailwind class order.

**Close buttons on dialogs** (assistant panel, folder search clear) follow #432's
lightbox close: a 44 px icon button sized by class, not a `RowActionButton`,
because a bordered box in a dialog's corner looks like a second action.

## Ruled not actions (left as they are)

| Where | What | Why |
|---|---|---|
| `ResidentHub`, `WebsiteTabs`, `StocktakeSheet` tabs, `VetHub` period | tabs | switch a view in place (#405, #432) |
| `ContactList` type chips and Show archived, `CashflowView` categories, `PhotoGallery` folder chips, `FolderGrid` sort, `MaintenanceBoard` Mine | filters | change what is listed, not data |
| `RehomeForm` Foster/Adopt, `AdoptionUpdateForm` channel, `RecordDeliveryForm` kind, `FriendWizard` who/mode, `RecurringJobForm` weekdays, `StocktakeSheet` Same | radio-like choices inside a form | the Save is the action; these are inputs |
| `LanguageSwitcher` EN / ไทย | a two-way toggle | a setting, sized by the header (#413) |
| `PhotoGallery` and `EditResidentForm` photo tiles, `ThumbnailStrip` thumbnails, `AssistantCards` "which one?" cards, `FacilityMap` cards, `FolderGrid` new-folder card, `MoveFolderDialog` tree rows, `PagesAccordion` rows | tiles and rows | the whole card is the target; all are well over 44 px |
| `ThumbnailStrip` arrows | scroll arrows | hidden below `sm`; on a phone you swipe |
| `AssistantConversation` example prompts, `AssistantCards` "use Dr …" | text inside a sentence or list | out by construction, like a link in prose |
| `AccountMenu`, `SignOutButton`, `MobileNavToggle`, `AssistantPanel` opener | the app header | settled by #413 and #432 |

## Already 44 px by their own classes (checked, not changed)

`MapEditor`, `PanZoom`, `WizardChrome`, `FriendWizard` (its `buttonClass` and Save /
Publish), `MaintenanceBoard` move sheet, `MaintenanceForm` save, `MaintenanceJobView`
status, `StocktakeCards`, `StocktakeSheet`, `DeliverySteps`, `PurchasingPhone`,
`WeightKeypad`, `medical/ResidentPicker`, the `Create*Form`s and `AddDoctorForm`,
`LoginForm`, `ForgotPasswordForm`, `EnclosureFilters`, Recent changes filter,
`CsvDownloadButton`, `PrintButton`, `ShareButton`, `PublicNav`, `ShelterFriendCard`'s
`buttonClass`, `MedicalPhotoUploader`'s two big buttons. They carry `min-h-11` or more
(or `py-3` with base text) but are not on the shared components, so the check notes
them rather than measures them. Moving them would change nothing a person sees.

## The photo lightbox at 375 px

Opened on dev at 375 × 812 (admin, a resident with medical photos): the close x,
Remove photo and the Move to folder select and button each fill the dialog's width
or sit 44 px square, the dialog fits without scrolling sideways, and nothing runs
off the edge. **What was not seen**: Set as profile (medical photos never offer
it), and the Remove photo confirm row. The session's attempt to tap further was
refused by the auto-mode classifier as credential materialization, because the
browser pane was signed in by hand-set session cookie, and was not pursued. Those
two states are on the PR's manual list.

## Measures

- Raw `<button>`: 200 in 90 files → 114 in 57 (`git grep -c "<button"` at
  `dd979395` and at this branch).
- `check-phone-width.mjs` after this pass: see the test plan, which carries the
  run's own output. A clean "before" run on the same server was not taken: it
  needed `src/` put back to the base commit in this worktree, and that was refused
  as destructive; no other checkout was serving `main`. The comparison is with
  #411's 38 distinct notes (all roles, both languages), with #413 and #432 in between.
