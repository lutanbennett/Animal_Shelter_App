# Bare buttons, last three groups (bare-buttons-groups)

2026-10-07, `claude/bare-buttons-groups`. Third pass after #405, #411 and #413.

## Moved onto ActionButton (44 px on phones, 36 px with a mouse)

- **My tasks** (`MyTaskList`): Undo (banner and Done-today strip), Add note, Skip, Done.
  Done needed a green look, so `ActionButton` gained a `success` variant. The
  Not started / In progress / Waiting / Completed pills got `min-h-11` on phones.
- **PhotoGallery lightbox**: Remove photo and its confirm / cancel, Set as profile,
  Move, Show all. The close x is now an icon button, 44 px on phones. The rows
  stack one per line below `sm`, so three buttons fit in the ~300 px dialog.
- **UnitsPanel**: Edit, Delete, Add, Set price, Save, Cancel.
- **Account menu** (`AccountMenu`): `min-h-11` on phones, `md:min-h-9`, same as the
  other header buttons. #413 did not cover it; the Director chose 44 px for the header (q11).

## Ruled chips, not actions (left as they are)

The check still prints these as notes: the resident-page tabs (Overview / Medical,
Foster / Adopt), the Cashflow category filters and the Website admin tabs. Each switches
a view or a filter in place and none changes data.

## Not reached

The check cannot open the photo lightbox, so its buttons are measured by nobody;
it needs a look at 375 px. About 80 files with a raw `<button>` remain unread, so
the backlog item stays open.
