# 2026-10-03 — The phone stocktake keeps its counts on the phone and saves once at the end

**Context.** The backlog item for the card-by-card stocktake (part 2 of "Medication
label photos, a card-by-card stocktake on phones…") asked us to choose between two
ways of saving, because the desktop sheet saves **once, all-or-nothing**, through
`record_stocktake()` (`0088`, `0091`; history in `0093`) and a phone can lose a
half-done count:

- **A. Save each card as it is entered**, with one stocktake id shared across the
  session so `stock_counts` rows still group as one stocktake.
- **B. Keep the counts on the device and send them together at the end**, with the
  summary.

There are no PCs on site, so for the 2IC — who does the stocktake and is not
comfortable with computers — this *is* the stocktake, and a hundred medicines in a
storeroom with "no signal in the kennels" (§14) is the real setting. The failure
that matters is losing an hour of counting. The second failure is a count that
saves wrong and cannot be undone.

**Decision: B.** The count in progress (every entered or confirmed row, which cards
were skipped, and which card is showing) is written to the phone's `localStorage`
(`stocktake-draft-v1`) on every change, and sent in one `record_stocktake()` call
when the person taps Review and save, exactly as the desktop sheet does.

**Why B, not A.**

- **It survives the thing that actually goes wrong.** A closed tab, a locked
  screen, a dead battery or no signal loses nothing: opening Stocktake again says
  "Picked up where you left off". Under A the same failures cost nothing too, but
  only while there is signal at every single card; one request per card in the
  kennels is a hundred chances to hit a dead spot mid-count, each needing its own
  retry and error message on a screen meant for one task.
- **No migration, and `record_stocktake()` stays the only writer.** A needs a
  session id on `stock_counts` (or a new function), i.e. schema, and a second way
  to write counts that every later change to history (`0093`) and usage intervals
  must keep in step. B reuses the function, the validation, the unit conversion
  stamping and the history as they are.
- **The review step survives.** The summary lists every change, old → new, with
  big changes first, before anything is written. Saving per card has nothing to
  review — a mistyped 400 for 40 is in the database before anyone sees the
  summary, and "Big change" can only warn about a count already saved.
- **One count, one time.** All the counts of a stocktake get the same
  `counted_at`, which the usage comparison depends on. Under A the times differ by
  the hour it took.

**What B costs, and how it is handled.**

- The counts are on **one phone**: another phone or the computer does not see them.
  Accepted — a stocktake is one person with one phone, and the card says "kept on
  this phone" so nobody expects otherwise.
- **A stale draft is wrong data.** Counts older than **two days** are discarded
  on load; a draft shows its date and has **Start again**. Items deleted since are
  dropped from it, because `record_stocktake()` rejects the whole save if one id is
  gone.
- **Saving can fail at the end**, which is exactly where the signal is worst. A
  thrown network error is caught and says so in words — nothing was saved and
  nothing is lost; try again with signal — and the counts are still in the sheet
  and on the phone. Cleared only on a successful save.
- **Storage can be refused** (private mode, full). Then the draft is not kept, and
  the existing "leave and lose them?" warning stays on; it is only switched off
  when the draft was actually written.

**Rules from the sheet that carry over unchanged.** Blank means "not counted this
time", never zero: a card that is skipped or left is not in the save. "Same as last
time" is an explicit confirmation (it sends the old figure, restamped as counted
now), never an empty save, and is unavailable for a medicine never counted. Save is
disabled until the field holds a number of 0 or more; the same
`rowOutcome()`/`summarise()` the sheet uses decide what is saved, so the two views
cannot drift. Skipped cards come round again at the end ("5 skipped — count them
now?"), then Review and save.

**Shape.**

- Below 640 px (Tailwind `sm`), on the Medications tab, with at least one medication,
  the cards are the default and **See the whole list** shows the ordinary sheet,
  with **Count one at a time** to go back. Desktop is untouched, and so is the
  Food tab (the item asks for medications only).
- The card order is `cardSequence(items)` in `src/lib/management/stocktake.ts`: name
  order today, one function to replace when "Stocktake in cupboard order" is built.
- The card state (`CardsState`) is plain data with pure transitions in the same file,
  so the sequence logic has no React in it.
- Every move is a button — Save, Same as last time, Skip, Previous, See the whole
  list, Count them now, Review and save. The slide between cards is a short CSS
  animation, switched off under `prefers-reduced-motion`. **Swipe gestures were not
  built**: the item calls them a nice extra, and an untestable gesture on a screen
  used by someone who is not comfortable with computers is a risk with no upside
  until the buttons have been watched in use.
- The card shows no strength or form: `medication` has no such columns, only a name
  (which usually carries the strength) and a dose unit. If the shelter wants them as
  fields, that is its own schema change.

**Boundary with `permissions-catalogue`.** That stream owns who may reach Stocktake
(`requireRole(canStocktake)` and the delivery link in `page.tsx`, the check in
`actions.ts`, and the predicates in `stocktake.ts`); this one owns the rendering below
it: `StocktakeSheet.tsx`, `StocktakeCards.tsx`, and the card helpers appended to
`stocktake.ts`. Part 3 of the item — Stocktake in the menu only for the people who do
it — is not built here.
