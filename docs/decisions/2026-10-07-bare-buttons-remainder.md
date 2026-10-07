# Bare `<button>`s under 44 px: the eight #405 left, and the rest ruled

2026-10-07, `claude/bare-buttons-remainder`. Extends the audit in
`2026-10-07-bare-buttons-44px.md` rather than replacing it. **The backlog item is
not ticked**: the app header is still Lutan's decision, and the buttons the check
cannot reach are ruled below, not all converted.

## Done: the eight, plus what sat beside them

Each moved onto a shared component, so `check-phone-width.mjs` now fails if it
drops under 44 px again. No behaviour changed, only how the control is drawn
(the resident page's `name-card-taps` work is unaffected: the same handlers run).

| Control | Was | Now | Where |
|---|---|---|---|
| Remove <resident> (the chip's ✕) | 7 × 20 | `RowActionButton`, danger, 44 × 44 on phones | `ResidentPicker` |
| Record chip / Correct | 91 × 16 | `ActionButton` compact | `MicrochipLine` |
| Add a new carer | 106 × 20 | `ActionButton` | `CarerPicker` |
| Choose an existing carer instead | text link, ~20 tall | `ActionButton` (same picker, same problem) | `CarerPicker` |
| Select residents | 133 × 34 | `ActionButton` | `ResidentPicker` |
| Add more | 100 × 34 | `ActionButton`; the leading "+" is dropped from the word (the icon is the plus) | `ResidentPicker` |
| Change | 77 × 34 | `ActionButton` (edit icon) | `ResidentPicker` (single mode) |
| Show anyway | 116 × 38 | `ActionButton` | `LargerScreenNotice` |

**#405's table put "Show anyway" in `CapacityWarningDialog`. It is not there**: the
note the check reports comes from `LargerScreenNotice` (the "best on a larger
screen" notice on Contacts, Vets and the other Management setup pages). The
capacity dialog's own buttons were also bare, so both were converted.

Also converted, because they are the same pattern in the same files and are
dialog buttons the check cannot render: Cancel / Done / Close in the resident
picker; Cancel / confirm in `CapacityWarningDialog` and `ConfirmDialog` (the
shared "are you sure?", so every delete confirmation in the app); Cancel / Move
here in `MoveFolderDialog`; Cancel in `MicrochipForm`; the three retry-archive /
retry-restore buttons in the deceased banner.

Judgement calls worth knowing: the selected-resident chip is now a `rounded` box
(was a full pill), because a 44 px square button cannot sit inside a pill; "Show
anyway" is a plain secondary button, not primary, since it reveals a page rather
than submitting; `ConfirmDialog`'s confirm is `danger` with the existing
`delete` icon, matching its red styling (it is also used for non-delete
confirmations; the icon is decorative).

## Evidence: the same check, before and after

All roles (admin, management, staff, vet, volunteer, head of medical, head of
maintenance), English and Thai, 338 page views, same dev server, same
throwaway-login method. The script prints notes merged across roles:

| | before | after |
|---|---|---|
| distinct bare-button notes | 52 | 38 |
| component actions measured for tap size | 1590 | 1612 |
| overflowing pages | 0 | 0 |
| component actions under 44 px | 0 | 0 |

Gone from the notes: Add a new carer, Remove ✕, + Add more, Record chip, Select
residents. The full run above was taken before "Show anyway" was converted (it was
the one control misattributed in #405); a targeted run on `/management/contacts`
and `/vets` (admin, English and Thai) afterwards lists only the three header
buttons, in both languages. Thai produced the same set as English (longer
labels, same heights), so nothing is under 44 px in Thai that is not also in
English. The +22 measured actions are the converted buttons now counted.
(The per-role split of #405's table is not reproduced: this script version
prints one merged list.)

## The header: not touched

Open menu 36 × 36, Assistant 34 × 30, Sign out 20 × 20 are unchanged and
`AppHeader.tsx` is `header-name-role`'s file. Lutan's decision (question 11 in the
Director brief) is not recorded; the recommendation in #405 stands.

## The buttons the check cannot reach: ruled

"Cannot reach" covers dialogs, states the seed does not create, and the map and
stocktake editors. Raw `<button>` is still in ~90 files. I read the eight with the
most buttons (about a third of all of them): most carry a 44 px minimum already
(`min-h-11`, `min-h-12`, `py-3`). **The other ~80 files were not read**; they are
the sweep's surface. The real remainders in the eight, each with a ruling:

| Where | Buttons | Size (by class) | Ruling |
|---|---|---|---|
| `PhotoGallery` lightbox | close ×, Remove photo, confirm / cancel remove, Set as profile, Move | `py-1.5` ≈ 32 px, × bare | **Leave, backlog.** It is a row of three buttons plus a prompt in a modal; at 44 px it wraps and needs a layout, not a class swap. Hand-measure when done |
| `PhotoGallery` folder chips, "show all" | chips | ≈ 28–36 px | **Leave: filter chips**, same ruling as #405's chips |
| `UnitsPanel` | add / edit / save / cancel (`text-xs py-1.5`) | ≈ 30 px | **Leave, backlog.** Compact admin table cell on a desktop-only page behind the larger-screen notice |
| `MyTaskList` | Undo, Skip, Add note, Mark done (`rounded-full text-xs py-1`) | ≈ 26–30 px | **Backlog, and the one I would do next:** volunteers tap these on a phone all day. They are a designed row of pills, so the choice (icon-only 44 px? two rows?) is Lutan's |
| `MapEditor` (facility map) | tools, undo, finish, cancel | `min-h-11` already | **Fine** |
| `StocktakeSheet` | steps, save | `min-h-12`–`min-h-14` | **Fine** |
| `WizardChrome`, `FriendWizard`, `MaintenanceBoard` | steps, next / back | `min-h-11` / `py-3` | **Fine**, except FriendWizard's step pills (`py-2`, ≈ 36) and chips — **leave: steppers** |
| Tabs and radios (Overview / Medical, Foster / Adopt, cashflow chips, website tabs) | | 30–38 | **Leave: not actions**, per #405 |

I did **not** hand-measure these with a browser; sizes are read from the classes,
so "fine" means "carries a 44 px minimum in its source", and the three "backlog"
rows are my estimate. That is the honest limit: a list of the rest, with the next
one named, rather than a claim that all are measured.
