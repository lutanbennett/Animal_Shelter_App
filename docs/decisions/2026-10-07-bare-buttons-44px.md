# Bare `<button>`s under 44 px: what was converted, what was ruled, what is left

2026-10-07, `claude/bare-buttons-44px`. Backlog: "Bare `<button>`s under 44 px on
phones, found by the 44 px check". **The item is not ticked.** It was filed as
"about 200 notes in 114 files"; that was larger than any single icon-button area
and the planner's "small" was wrong. This PR converts the one pattern that
accounts for most real actions and records a ruling on everything else, so the
next person inherits judgement rather than re-making it.

## What was done

- **28 plain primary submit buttons** (`rounded bg-primary px-4 py-2 …`, 36 px)
  became `<ActionButton variant="primary">`: Save changes, Save prescription /
  diet / procedure / blood test, Record foster, Move resident, Send to hospital,
  Book vet visit, Record immunizations, Change password, Filter (residents), and
  the same button in the maintenance, delivery, recurring-job, weight, vet-visit
  edit, adoption-update, return-to-shelter, hospital-return and undo-death forms,
  the chip form and the assistant input. `ACTION_ICONS` gained `save` and
  `filter`; the assistant's button uses the existing `send`.
- **Four more actions** (secondary variant): Add zone and Add enclosure
  (immunization form), Show window (forecast picker), Copy link (tag links).
- Each of these now carries `data-action`, so `check-phone-width.mjs` **fails**
  if one drops under 44 px again.

## Evidence: the same check, before and after

Nine runs (role × language), same dev server, same throwaway logins.

| role / language | notes before | notes after |
|---|---|---|
| staff, en / th | 28 / 28 | 12 / 12 |
| admin, en / th | 43 / 43 | 26 / 26 |
| management, en | 35 | 18 |
| vet, en | 4 | 2 |

No page scrolls sideways, and every component action is at least 44 px, before
and after. Thai produced **the same notes** as English, only with longer labels
(the widths differ, the heights are the same), so no control is under 44 px in
Thai that is not also under it in English. The full outputs are pasted in the
test plan. Component actions measured rose (staff 166 → 182, admin 183 → 200).

## Audit: every remaining note, ruled

Rule from `2026-10-06-phone-width-44px.md` and the four icon-button areas:
navigation and non-actions stay as they are; an action becomes a component.

| Note (as seen, en) | Size | Ruling | Why |
|---|---|---|---|
| Open menu | 36×36 | **Action, header — Lutan's call** | Shared by every signed-in page; see below |
| Assistant | 34×30 | **Action, header — Lutan's call** | as above |
| Sign out | 20×20 | **Action, header — Lutan's call** | as above |
| Overview / Medical (resident hub) | 156×36 | Not an action | Tab switch between two views of one page |
| Foster / Adopt (rehome) | 156×36 | Not an action | `role="radio"`; chooses which form below is submitted |
| Vet visits / Vaccinations / Medication / Maintenance / Food / Fixed outgoings | ~100×30 | Not an action | Chips that filter or switch a table |
| Home page / Pages / Gallery / Projects / Contact & settings (admin website) | ~80×38 | Not an action | Tabs (`WebsiteTabs`); #379-sized already, 38 px. Raise to 44 if the sweep wants uniform tabs |
| Show anyway | 116×38 | **Action, not converted** | `CapacityWarningDialog`; modal, secondary. Next batch |
| Select residents | 133×34 | **Action, not converted** | `ResidentPicker` opens a picker. Next batch |
| + Add more | 100×34 | **Action, not converted** | Adds another row to the vet-visit form. Next batch |
| Change | 77×34 | **Action, not converted** | Swaps a selected value for the picker. Next batch |
| Add a new carer | 106×20 | **Action, not converted** | Inline text-style button, 20 px tall; the smallest real action left in `main` |
| Record chip | 91×16 | **Action, not converted** | Inline pencil-and-text beside the chip number; 16 px tall |
| Remove <resident> (×) | 7×20 | **Action, not converted** | Removes a chosen resident in the vet-visit form; **a 7 px-wide target is a real mis-tap hazard** — worth doing first next time |

"Not converted" means a real action that does not fit `ActionButton` as it is
(inline, compact, or icon-only inside a chip) and wants its own decision on
whether it is a `RowActionButton`. They were not forced onto a component that
changes their look.

## Remaining count

About half of the notes are gone (staff 28 → 12, admin 43 → 26). Of what is left
in `main`, none is a plain save/submit. The rest is tabs, chips and radios
(ruled not actions) plus the eight actions in the table above. The original
"about 200" counted raw `<button>` occurrences across all pages and
roles; the pages the check reaches with seeded rows produce the 43 above. Raw
`<button>` elements the check cannot reach (rows needing seeded data it does not
create, dialogs, the map editor, stocktake sheet internals) were not audited.
The *Mobile responsiveness sweep* should keep that as its remaining surface.

## Header — a recommendation for Lutan, nothing changed

Measured on every page: **Open menu 36×36, Assistant 34×30, Sign out 20×20.**

- **Sign out at 20×20** is the smallest control in the app, on every page, and it
  signs you out. A mis-tap means signing in again (annoying, not data loss), and
  a tiny target also means a thumb that wants it has to aim. It is the only one I
  would change: raise it to 44×44 as an icon button, with a confirm only if
  mis-taps are really happening.
- **Open menu and Assistant** are within 8–14 px of 44 and get used all day;
  raising them to 44 should fit the header at phone width. At desk width the
  header must not grow, so use `md:` classes as `ActionButton` does.
- All three are shared with the login screens' header, as #379 found for the
  language switcher, so one change is felt everywhere. His call; not made here.
