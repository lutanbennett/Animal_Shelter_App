# Residents list as a spreadsheet (2026-10-06)

Backlog: "Download the residents list as a spreadsheet, with more than the screen shows". Lutan filed it on
2026-10-05 after exporting the list by hand into `Resident_Export_Director_Review.xlsx`.

## What shipped

A **Download spreadsheet** button on `/residents` (an icon on a phone) that saves the list as a CSV. With
rows ticked (computer only, as booking is) it saves only those. The page says where the file went: the
Downloads folder, or the Files app on an iPhone, with the file name.

It is a route handler, `src/app/residents/export/route.ts`, not a scrape of the table and not a server action:
a plain `<a download>` works on every phone, with no script needed to hand the browser a file.

## "Exactly as on screen"

The page's reading of the URL (place, zones, enclosure, search, Show all, Adopted, No microchip, and which
stale zones are dropped) moved out of `page.tsx` into `src/lib/residents/list-view.ts`, and both the page and
the route call it. The button's link is the page's own query string, so the two cannot drift. Ticked rows are
`ids=` on top of the filters, not instead of them, and an id that is not a uuid is dropped.

The one thing the file does not copy is the chip-scan redirect: a 15-digit search that matches a resident
opens that resident on screen, and the file for the same search is just empty.

## Columns

Everyone who can open the list: R-code, Name, Thai name, Species, Sex, Zone, Enclosure, Status, Place
(On-site / Off-site, the Location column's rule). A volunteer's file is exactly these and nothing else,
because their view (`resident_who_and_where`, 0134) carries nothing else.

Roles that read the record add: Other names, Breed, Age, Estimated birth year, Size, Colour, Microchipped,
Intake date, Ready for adoption.

Then one group per medical activity, **each only if the person holds Read on it**, so the file never has a
column of blanks that means "you may not see this" and reads like "there is none":

- `medical.prescriptions`: Prescriptions running today
- `medical.visits`: Next vet visit, Next vet visit clinic
- `medical.diet`: Current diet
- `medical.weight`: Latest weight (kg), Latest weight date

Choices inside those:

- **Age** is `formatAge()`'s wording, as on the hub. **Estimated birth year** is that age taken back from
  today, as a number, so it sorts. The text age does not.
- **Prescriptions running today** counts rows that are not archived, have started and not ended by the
  shelter's date (`todayIso()`), the rule the facility map already uses. It is a count, not "ever had one".
  A resident with none is `0`.
- **Next vet visit** is the earliest scheduled, not archived, appointment on or after today's shelter date;
  its clinic is the vet's name. A resident with none is blank.
- **Current diet** joins every diet running today with `; `.
- **Latest weight** is the newest non-archived reading by date, then entry time.
- **Microchipped** is Yes or No. The number is not exported.
- **Zone** is blank for the Lifecycle pseudo-zone, as the table does; Status says Hospital, Fostered or Adopted.
- Deceased residents are in the file only when Show all is on, because the file takes the page's rule.

The extra columns are read in batches of a hundred residents per query, never one per resident, so a
shelter-sized list is a handful of requests. Weights page past the API's 1000-row cap, since a resident has
many readings.

## Header language (chosen, to confirm with Lutan)

**English always.** The header row, and the words in the file (status, sex, size, the age wording), do not
follow the reader's language. A file that sorts and filters the same for everyone, and that a script or a
colleague's spreadsheet can read by column name, matters more than a Thai heading, and the Thai name has its
own column. The button and the message are in the reader's language. (Not yet confirmed by Lutan: the choice
is cheap to reverse, since the headings are one list in `src/lib/residents/export.ts`.)

## Is exporting its own activity? (open with Lutan)

**Not yet decided; the file follows `resident.record` as the brief said.** In practice the route lets in
whoever can open the list: a role holding `resident.record` Read, or a login the database treats as a
volunteer (`current_user_role() = 'volunteer'`). The second is deliberate. The list page has no guard of its
own, and on dev the Director's draft matrix has **no `resident.record` cell for the volunteer** (the table
shows only management, staff, vet, the 2IC and the Heads), yet a volunteer still opens `/residents` through
the view's own gate. Requiring the cell would have refused the volunteer a file for a list they can see, and
the check that proves a volunteer's export (`check-residents-export.mjs`) is the one in the backlog's test list.
If exporting becomes its own activity, the guard in the route is the one line to change, and the catalogue
needs the key plus a matrix row.

## Format

CSV through `src/lib/csv.ts`: `toCsv` and `csvField` (CODE-4's formula guard, so a name starting `=`, `+`,
`-` or `@` is written as text) and the UTF-8 byte-order mark, so Thai opens correctly in Excel. XLSX was not
needed; revisit only if the Director finds CSV a problem. The BOM is added in the route, not `downloadCsv`,
which is the browser path Cashflow uses.

File name: `residents[-selected][-on-site|-off-site][-adopted][-filtered][-with-deceased]-<shelter date>.csv`,
plain ASCII so it saves under the same name on every phone.

## What a volunteer's export contains

R-code, Name, Thai name, Species, Sex, Zone, Enclosure, Status, Place. No other names, breed, age, size,
colour, chip, intake date, adoption flag or any medical column, not even blank. No ticking or `ids=` change
that: the same query on the same view.

## Checks

`node scripts/check-residents-export.mjs` (dev only) seeds a resident with a Thai name and a full medical
history, one named `=HYPERLINK(...)` with none, and an admin and a volunteer login; it downloads and asserts
the BOM, each column, the formula guard, the zero-and-blanks resident, ticked rows, a place filter, a
malformed id, the volunteer's exact header, a signed-out refusal, and the button itself in a browser
(ticking changes the link, a click downloads and the message says where).
