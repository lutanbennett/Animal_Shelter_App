# Bulk bills from a strict templated CSV (`#m3vx9`, the app's first import)

Built from `2026-11-12-bulk-bills-investigation.md`. Utility and general bills only. No migration, no new card.

## The template

Eight columns, in this order in the downloaded file (a file may reorder them, but not add, drop, repeat or rename one):

`destination, kind, place, account, amount, date, covers_month, photo_filename`

- `destination` is `utility` or `general`. It must agree with the kind's own route (`tailoringOf`): Electricity under Utilities is `utility`; Materials, Other are `general`.
- `kind`, `place`, `account` are matched **exactly** (case, spaces and Thai included) against the shelter's stored names. An account is written as its supplier, a space, then its reference if it has one (`MEA 1234`).
- `amount` is a plain number with at most two decimals (`250`, `250.50`): no commas, symbols, signs or exponents.
- `date` is `2026-11-11` and must be a real day. `covers_month` is `2026-11`, required on a utility row and refused on a general one.
- `photo_filename` is optional.

The template route (`/bills/import/template`) writes the header plus two worked examples using this shelter's own first utility kind, first general kind and first place (a place only where the kind takes one). Whole-file limits: UTF-8 only (a leading byte-order mark is stripped), 1 MB, 500 rows.

## Every rejection, and its wording

Whole file refused (nothing is read as rows): not UTF-8 (CP874 and Latin-1 land here, never guessed), UTF-16, empty, an unclosed quotation mark, too big, no file chosen, a header that is not exactly the template (the message names what is missing, extra or repeated), more than 500 rows, a login with neither `bills.utilities` nor `bills.general`.

Row refused (the rest still go in), wording in `bills.import.reason` of both dictionaries (English and Thai):
destination not utility/general; kind empty / unknown / no longer in use / belongs to a delivery, visit or job; kind disagrees with the destination; a place or account on a kind that has none; **cards do not let you file this destination**; place or account unknown, or two with the same name; account belongs to a different place; amount empty or not a plain number; date not `2026-11-11`; utility month missing or not `2026-11`; a month on a general bill; photo not found, **more than one photo of that name**, or photo already used by an earlier line; wrong number of cells; and `writeFailed` (the database refused it, with its message).

A place or account on a kind that does not use one is **refused rather than dropped**, unlike the single-bill form which silently drops it: a CSV row that says one thing and files another is worse than a rejected row.

## How the filename resolves

Looked up only among `attachments` with `owner_type = 'bill_inbox'` (never all attachments, so a row cannot claim a resident's photo), compared to `file_name` exactly. None: rejected. One: joined. More than one: rejected, never picked. Two rows naming one photo: the later is rejected. An empty cell is a valid bill without a photo. On import the photo changes owner from the inbox to the new bill, guarded again by `owner_type = 'bill_inbox'` in the update itself; if that move fails the bill is deleted again, so a row is wholly added or wholly not. The inbox card the photo sat on is deleted only when no other page is left on it.

## Where rights are asked

Per row, in `parseBillImport` (`src/lib/bills/import.ts`): `cat.mayFile(route)`, which is `mayFileRoute()` (`src/lib/bills/kinds.ts`), the same function the single-bill actions use (`bills.utilities`, `bills.general`). Every row is written as the person importing, under their own session, so the tables' RLS and `bill_owner_can` (0189/0305) ask the same again and are untouched. No service role. The page, the template route and both actions ask `canImportBills` (either card); the import link on `/bills` is drawn only on the same test. **Hiding is the courtesy, the per-row check and the database are the security.**

## Open questions from the brief, answered

- **Where:** `/bills/import`, reached by a link on the Bills page. Not in `routes.ts` (no single activity: it opens on either of two cards, as `/bills` does) and no tile or nav entry.
- **Re-parse or hold the file:** re-parse. The preview press and the import press each send the file; nothing is stored between.
- **CSV writer:** `src/lib/csv.ts` (`toCsv`, `downloadCsv`) reused for the template and the rejects file. The reader (`src/lib/csv-read.ts`) is new and generic, for residents or donations to reuse.
- **Added to `WRAPPED_WRITE_PATHS`:** `/bills/import`. Its one write (`importBills`) goes through `runWriteAction`; the preview action writes nothing, so a replay of it is harmless.

## Left out on purpose

Maintenance, delivery and clinic-visit bills (they need a job, delivery or visit column: a later stream). A note column. Any card for "may import" separate from "may file". Matching an account by a looser name. Thai manual text: the manual exists in English only (`src/lib/manual/en.ts`; there is no `th.ts`). Ungated bills controls: none found in the files this change touches.
