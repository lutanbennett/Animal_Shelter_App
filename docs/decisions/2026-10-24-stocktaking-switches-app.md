# Two Stocktaking switches: the app half

2026-10-24, `claude/stocktaking-switches-app`. The schema is `0254` (`2026-10-24-stocktaking-switches-schema.md`);
this is what reads it. No migration.

## What a switch does

`site_content.stocktaking_food_enabled` covers diet ingredients; `stocktaking_medical_enabled` covers medications **and
vaccines**. Each is read per area, so with food OFF and medical ON the same Purchasing list has food lines that assume
nothing in stock and medical lines that behave as they always did. While an area is OFF:

1. `purchaseRow()` (`src/lib/management/purchasing.ts`) is told `stocktaking: false` and returns state `"off"`:
   `needed` is the period's use alone, `shortfall = needed`, nothing on hand is assumed. With the switch ON the
   function is the code it was, line for line (checked: the same input gives an identical row with `stocktaking`
   omitted, `true`, or the old call).
2. **No safety stock is added.** Lutan answered this on the backlog item (2026-10-24); the reason, since a reader
   will ask: with nothing assumed in stock every period, adding the safety margin each period would buy it **every
   time**, and the cupboard would grow by that amount each cycle. It comes back the moment the switch is ON.
3. *Not counted* / *never counted* is shown nowhere for that area (Purchasing banner, tags, phone cards, the stock
   pages' In stock cell, the vaccine table, Settings → Immunization types). With counting off it is true of
   everything and says nothing; a plain line replaces it (*Stocktaking is switched off*).
4. Recording a delivery is untouched and still listed.
5. Nothing is deleted or written when a switch moves. The stored counts, `stock_counted_at` and safety stock are
   simply not read; the pages show them again when the switch is ON. Checked on dev: OFF/ON/OFF/ON gave the same
   Purchasing figures as before any change (24 never-counted items, Hepato 111).

A state `"off"` was added rather than reusing `"ok"` or `"notCounted"`: every place that draws the tag or the banner
already tests `state === "notCounted"`, so the new state is invisible to them with no edit, and `"ok"` would have
tried to print a count that is not being used.

## Where the switch is read

`loadStocktakingSwitches()` (`src/lib/management/stocktaking-switches.ts`) reads the row with the caller's own
session. A missing row or a failed read means **both ON**, so a fault leaves today's behaviour in place rather than
quietly hiding counts. Pages: Purchasing (desktop and phone), Management → Diet stock (food), → Medication stock and
its vaccine section (medical), Stocktake, Settings → Immunization types (the vaccine dose figure).

**Stocktake** lists only the areas that are ON, with one line for the other (`Counting food is switched off…`). An
OFF area's items are not even queried. The tab bar shows only the ON tabs. If both are OFF the page says there is
nothing to count.

**The Do Stocktaking tile stays.** The brief's rule was that it stays while either switch is ON. Hiding it when both
are OFF would mean changing how a role's jobs and Operations tiles are built (`src/lib/home/tiles.ts`,
`permissions/jobs.ts`), which is shared with the card work that is on hold; the tile instead opens a page that says
there is nothing to count. Not removed from any role. Left as a follow-up only if Lutan wants it hidden.

## The control

Settings → **Stocktaking** (`/admin/stocktaking`): a tile on the Settings landing for Admins only, and a page that
requires Admin **and** the authenticator step (it redirects to the 2-step page otherwise), the same pair as Security.
Two cards, each with On/Off and one button. The action checks Admin and 2-step for the words and writes only the one
column; `site_content_stocktaking_guard` (0254) is the lock that actually refuses anyone else, and
`site_content_stocktaking_audit` records the change. It is an Admin rule rather than an activity, like Security:
nobody else is ever given it.

## Known gaps, written down so nobody has to rediscover them

- Settings → Recent changes has no label for these `site_content` audit rows (the schema decision said so) and an
  Undo must not be offered as a plain re-insert. Not done here; the manual does not claim it is listed there.
- A stale open Stocktake tab can still save a count for an area switched OFF after the tab loaded. It is harmless
  (counts are kept and not used while OFF) and was not worth a second guard.
- `scripts/check-purchasing.mjs` has no OFF case; `scripts/` belongs to another stream this batch. The OFF cases were
  run from a scratch script instead (counted 50, safety 10, use 14: ON needs 24 and buys 0; OFF needs 14 and buys 14;
  with a pack of 5, 3 packs = 15). Worth adding to that script later.
