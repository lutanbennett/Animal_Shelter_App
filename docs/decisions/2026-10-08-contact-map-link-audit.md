# 2026-10-08 — The contact map audit reuses the app's link-follower, and passes Plus Codes and coordinates

Part (4) of the maps item: `scripts/audit-contact-map-links.mjs` lists every
live contact whose map is wrong, so Lutan or the Director can re-share the
right link. Four calls worth recording.

**One link-checker, not two.** The redirect-follower that lived inside
`src/lib/contacts/map-preview.ts` moved, unchanged in behaviour, to
`src/lib/contacts/short-link.ts`: no imports, so Node runs it straight from a
script. `map-preview.ts` (contact hub, contacts list, public Shelter Friends)
and the script both call it, and both then read the result with the same
`contacts.ts` helpers (`splitAddress`, `mapQueryFromUrl`, `addressMapNow`). A
second checker in the script could disagree with the pages — a row the report
calls fine that the hub shows no map for — which is worse than no report. The
one addition is that it also returns the first HTTP status, which only the
script uses.

**A link is judged by following it, never by its shape** (#461's finding:
Google kept active `goo.gl` links working after August 2025). A full Google
Maps URL that names a place is fine without asking anyone; any other link
that does not lead to a map (a Facebook page, `google.com`) is reported with
the dead links, worded "not a Google Maps place" rather than "no longer
opens", because the fix is the same: share the place from Google Maps.

**Typed coordinates and Plus Codes are not reported.** The item lists "plain
text" as a problem because Google *guesses* where a written Thai address is.
`18.61, 98.76` and `7MW3QXQ7+2C` (or the short `QXQ7+2C Mae Wang`) are not
guesses — Google places them exactly where they say — so listing them would
send the Director to re-do rows that are already right. Ordinary written
addresses are listed, with "if the map is already the right place, nothing is
needed", since many will be fine and only a person can tell.

**Shelter Friends are reported as their contact.** A friend has no map field
of its own: `public_shelter_friends.map_location` is the contact's `address`
when `show_map` is on (0076). So each row is one contact, tagged *Shelter
Friend* and *map shown on the public website* where those apply, rather than
listed twice. Archived contacts are skipped and counted; their maps are shown
nowhere.

Outcomes, named separately because the fixes differ: a link that leads to no
place; written words with no link; a working link with words after it
(nothing broken — the words belong in the separate Address box when that
item lands); and "Google didn't answer", which means run it again, not fix
the row. The script reads with one `SELECT` and writes nothing; there is no
`--apply`. It follows each distinct short link once, one at a time, a second
apart.
