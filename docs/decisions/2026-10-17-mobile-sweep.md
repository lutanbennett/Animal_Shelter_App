# The full mobile sweep: what was looked at, what changed, what was not seen

2026-10-17, `claude/mobile-sweep`. Lutan: "For the sweep let's do the full sweep, not the light sweep."

## What was done

All 121 page routes under `src/app` were taken to 375 px in English and Thai and given a
recorded verdict in `docs/mobile-sweep-inventory.md` (generated from the filesystem, so none
is missed). 117 are `ok` or `fixed`; 4 are `not checked`, each with its reason.

Two kinds of check, because they catch different things:

- `scripts/check-phone-width.mjs` measures: sideways scroll, text under 16 px, 44 px actions.
  It was run for admin, management, 2IC, doctor, volunteer, head of medical and head of
  maintenance. Coverage went from 57 signed-in pages and 8 public pages to about 100 and 16.
- Looking: every page was photographed with the new `--shots=<dir>` and read by eye, in Thai
  (the longer language), for anything cramped, clipped or overlapping that a width number
  cannot see.

## What changed in the check, and why

- **It now presses "Show anyway".** Ten admin pages (`LargerScreenNotice`) show a notice on
  phones in place of the page. The check had only ever measured the notice, so their real
  content, the part an admin reaches by pressing the button, had never been looked at.
- **The public site is checked for sideways scroll.** Its pass only measured tap size.
- **It names culprits that have no width of their own** (a clipping box, a squeezed column) by
  hiding boxes until the scroll stops. Two of the defects below reported "no single element".
- **Seeded residents get explicit codes.** Dev's code sequence had fallen behind its rows, so
  the seed failed on a duplicate `resident_code`.

## Defects fixed (layout only; nothing hidden, nothing about what a page saves or who may open it)

| Cause | Fix | Clears |
|---|---|---|
| Resident action page heading was `flex` with the icon, the title and the code as separate items, so a long name got a sliver of width and wrapped one word per line | Heading flows as text below `md`; `md:flex` keeps the desktop layout exactly | Hospital, Move, Rehome, Rehome return, Deceased, Undo, Hospital return, Adoption update (9 files) |
| `DateInput`'s wrapper could not shrink, so a date beside its Clear button pushed the page 31 px wide in Thai | `min-w-0` on the wrapper | Every date field with a button beside it, e.g. maintenance edit |
| Appeal progress numbers sat in a no-wrap flex row with a fixed-width thermometer and were squeezed to 14 px | The row wraps and the numbers have a minimum width | `/management/appeals/[id]`, and the public appeal page and preview, which share it |
| The wizard's sticky Next bar assumes 24 px page padding; the outreach pages had 16 px, so it stuck out 8 px | Outreach pages use `p-6` like the other wizards | `/outreach/new`, `/outreach/[id]/edit` |
| A mail link in `/privacy` was 22 px tall | `min-h-11` | one link |

## Why no base-layer rule was added

The brief proposed `fieldset { min-width: 0 }`, to be tried early. With every signed-in role
and both languages measured, no page overflows because of a fieldset, so the rule had no
screen to be proved on. It is not added. The earlier `.grid { grid-template-columns:
minmax(0, 1fr) }` (`bd898966`) already clears the class of defect it was written for.

## What was NOT seen

- `/admin/security`: the throwaway admin has not passed 2-step verification, so the page
  redirects to `/admin/security/verify` (which was looked at). The users table and its role
  column, a named starting point of this item, were not seen on a phone. Needs a verified login.
- `/appointments`: doctor-only and the throwaway doctor has no clinic, so it refuses.
- `/medical/photos` and `/medical/weight` crash with a server error when opened with no
  resident (`ResidentPicker` is handed the whole translation dictionary, which holds functions).
  A real bug, not layout; filed on the `backlog` branch, not fixed here.
- `/prescriptions/[id]/edit` was seen only as its "record closed" notice (dev row is a deceased
  resident).
- Wide admin tables (`/admin/recent-changes`, `/admin/diets` …) scroll inside their own box on
  a phone rather than reflow. Cramped but complete; a card layout is possible later.

## Not decided here

The photo lightbox at 375 px and the maintenance board on a phone stay open: the first is
Lutan's to look at, the second needs somebody to watch a person use it.
