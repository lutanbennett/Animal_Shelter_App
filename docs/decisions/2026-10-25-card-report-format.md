# The card report: format and how the PDF is made (2026-10-25)

Lutan asked for a PDF showing, per card: the card name, its purpose, what it gives access to **including pages, tables and forms**,
the major restrictions (things it cannot do that he should know about), then a recommendation to increase or decrease the access.
Built on `view_residents` and `residents`, the first pair, because the second includes the first and so shows whether the format works.

## Format

- **One file per card**, `docs/card-reports/<card key>.md`, so later passes add files and never touch each other's.
- A `---` header with `card:` (must equal the file name and be a real card) and `walked:` (date, then how it was checked).
- Four headings, fixed: **Purpose**, **Gives access to** (with `### Pages`, `### Tables`, `### Forms`; write `- None.` where one does not apply),
  **Major restrictions**, **Recommendation**. The card's name is the title and is not typed.
- Plain English, pages named as a shelter user names them. The `activity.level` detail is a small-print line at the foot of each card.

## What is generated, so it cannot go stale

- **The card name** is the label the app shows (`CARDS[key].label(en)`), the same one as Settings → Who does what.
- **The small print** (what the card grants and what it includes) is read from `src/lib/permissions/cards.ts`.
- **The cover table** lists all 29 cards and whether each has a report yet, so an unwritten card shows as "not yet" rather than being absent.
- `node scripts/build-card-report.mjs --check` validates the files without printing anything.

## The PDF mechanism

HTML built in the script with every style inline, printed by `playwright-core` driving the installed Chrome (Edge as fallback), the same way
`check-residents-export.mjs` drives a browser. No CDN tags (they time out headless). Thai renders from the system fonts. No library was added.
The brief said node_modules held no PDF library; it does hold `@react-pdf/renderer` and `pdfkit`, used by the acceptance matrix and the role draft.
They were not used here because the report is prose with headings and bullets, and HTML printed by Chrome gives that with no layout code and the
fonts already on the machine. If Chrome is ever not installed, the acceptance matrix's `@react-pdf` route (`scripts/lib/acceptance-matrix-pdf.mjs`) is the fallback.

## Where the output goes

The report names real roles and the state of a live system and the repo is public, so **a generated PDF is never committed**. The default is
`.local/` of the main checkout; a copy goes on Lutan's Desktop. The generator and the per-card files name roles and cards only.

## A recommendation authorises nothing

Section 5 is advice. Fixes are made as a set after Lutan reviews the fault log (his ruling 2026-10-24); new cards are Card review 2.

## Two findings worth keeping from the first pair

- The `residents` card cannot move, hospitalise, foster out or record a death. The pickers were fixed by 0248 but `src/lib/placements/move.ts`
  still reads `enclosures` directly. The earlier row marked this CLOSED was read from the wiring and not driven; driving contradicts it.
- A scripted `change` event on a select left the enclosure picker looking empty and nearly produced a false fault. Use the browser pane's
  form-input for selects. A file can be handed to an `<input type=file>` from `javascript_tool` with a `DataTransfer`, which drove photo upload.
