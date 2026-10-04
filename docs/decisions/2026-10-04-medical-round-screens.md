# 2026-10-04 — Medical round screens: the round is asked, amounts are pictures

Lutan's three backlog items for the Head of Medical's round, built as one change on the medication list
(`/management/medication-list`): medication by round, the stock-room pick list, and pictures first.
No migration; it reads `0137`–`0139` (`decisions/2026-10-04-medication-rounds.md`).

## The round is a link, not a client control

`?round=morning|lunch|evening` is the person's choice. With none, `suggestRound('medication')` pre-selects
(shelter clock) and the page says so; the three round buttons are always on screen. They are plain links, so
the page keeps its rule of no form, no action and no client component. Anything that is not a round key
falls back to the suggestion rather than erroring. `?view=pick` switches to the pick list and the round
carries across.

## What is on the list for a round

A prescription is listed under **each round it holds** (`prescription_rounds`). `doseDueState()` still
narrows interval days. Two kinds are shown in *every* round and tagged, never dropped:

- **as needed**: no round by design; tagged "As needed", not counted in the pick list (no dose to count).
- **no round set**: a scheduled prescription with no round ticked (0138's `none`); tagged in red, and the pick
  list prints "N doses have no round set" above the totals, because an under-filled bag is the failure mode.

Residents listed apart (hospital, foster, outreach) are not in an enclosure and are not bagged for.

## The pick list is a fold, not a second query

`buildPickList()` sums the very doses the by-resident view shows, per zone, then per enclosure, per medicine
(one dose per prescription; total = sum of amounts, flagged "not recorded" if any amount is missing rather
than read as zero). One source means the two views cannot disagree. Same permission as the list.
`scripts/check-medication-pick.mjs` holds it on a fixed list.

## Pictures first: the design language

For people who read neither Thai nor English, supervised by the Medical lead:

- **Numerals are the universal part.** Every picture has its number beside it (`× 2`), and the unit in words
  after it as the fallback for the lead.
- **Tablet / capsule:** one drawn per unit, a half as a half-disc; above six, one icon and the number, so a row
  never grows wide. **ml:** a syringe whose plunger sits at the dose on a scale that fits (1, 2, 3, 5, 10, 20 ml).
  **Drops:** drops. **mg, g, mcg, IU, sachet, application, dose:** no honest drawing, so number and unit only.
  A drawing that implies a quantity it cannot is worse than none.
- **Frequency:** `RoundStrip`, three fixed slots: sunrise (morning), sun (lunch), moon (evening). Given in
  = solid, not given = faint dashed, so "twice a day" is two lit icons in the same positions every time;
  position, not colour, carries it.
- Components are `src/components/medication/AmountPicture.tsx` and `RoundIcons.tsx`, shaped to be reused on
  the Maintenance and 2IC screens. Colours are the existing tokens, so light and dark follow the app.
- Resident photo and label photo (0129) were already there; unchanged and still the point.

## Not done here

- **Add-prescription form's three ticks:** left to the Management screens; it is not the Head of Medical's
  and writes data. Nothing in this change writes.
- **Food rounds / special diets:** a separate screen (batch 47), not on this one. `resident_diet_rounds` is untouched.
- **Backup login for the Medical lead:** nothing here assumes one user; creating the account is a Management step.
