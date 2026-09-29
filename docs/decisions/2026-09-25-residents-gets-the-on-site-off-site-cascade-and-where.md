# 2026-09-25 — `/residents` gets the On-site / Off-site cascade, and where Lifecycle residents land

`/residents` now has the control `/enclosures` got earlier today: Everywhere /
On-site / Off-site (`?place=`) above multi-select zone chips (`?zone=<id>,<id>`),
with stale zones dropped both on a place switch and when a page reads a
hand-edited link. The URL shape and both drop rules are unchanged from the
enclosures entry. The two pages share one component (`src/components/PlaceZoneChips.tsx`)
and one set of helpers in `src/lib/enclosures/place.ts` (`offeredZones`,
`zonesKeptIn`). The enclosures page moved onto them in this PR, so there is a
single implementation left and the two cannot drift apart. Each page still
builds its own hrefs, since what else a link keeps (sort and maintenance
there; search, enclosure and the deceased toggle here) belongs to the page.

- **Where Hospital / Fostered / Unassigned land: in a place, not "Everywhere
  only".** On `/enclosures` the Lifecycle buckets are status cards, and a card
  labelled Hospital has no place. On `/residents` they are animals, and nearly
  all of them are *somewhere*. Copying the enclosures rule would have made
  On-site leave out the 29 Unassigned residents on dev, who are physically at
  the shelter (0065), and Off-site leave out the very animals someone
  filtering Off-site most likely wants: those at the vet hospital and with
  foster carers. The rule is where the animal is:
  - **On-site:** `Resident` (an internal zone) and `Unassigned`.
  - **Off-site:** `Outreach` (an external zone, 0066), `Hospitalised`, `Fostered`.
  - **Neither:** `Adopted`, `Deceased`, and a resident with no placement
    (null status). These show only under Everywhere.

  So On-site plus Off-site is exactly the set the shelter is looking after,
  the same in-care set `public_shelter_stats` counts plus Outreach. Adopted
  is left out of Off-site on purpose. An adopted animal is physically off
  site, but it is no longer in the shelter's care, and 0066 defines off-site
  as animals the shelter looks after in the community. The cost is one rule
  that differs from `/enclosures`. The two pages ask different questions
  ("which enclosures" against "which animals"), and the manual says so.
- **The filter works on `current_status`, not on the zone.** `current_status`
  is derived from `zones.internal` for non-Lifecycle zones (0066), so
  `current_status in (…)` is exact, needs one column and no join, and covers
  the Lifecycle residents whose zone would say nothing. The mapping lives in
  `src/lib/residents/place.ts` (`STATUSES_IN_PLACE`, `residentPlace`).
- **The Location column shows the same place,** relabelled from "Internal /
  External" to "On-site / Off-site", so a row and the filter always agree. A
  fostered resident used to read "—" there. It now reads Off-site, and an
  Unassigned one reads On-site. The Zone column is unchanged and still dashes
  Lifecycle.
- **Show all / deceased belongs to Everywhere.** The dead are in neither
  place, so under On-site or Off-site the toggle would do nothing. It is
  offered only under Everywhere, the same way the Lifecycle chip is, and
  `?all=1` is dropped on a switch to a place and ignored on a place URL. The
  "N deceased hidden" line is shown only under Everywhere, because under a
  place the dead are not hidden by the toggle; the place leaves them out.
  **The one exception is a name search**, following the 2026-09-24 rule that
  a search must never tell staff a past animal does not exist. Under a place
  with `?q=`, deceased residents matching the name alone are counted, and the
  "N deceased residents match — show" link goes to Everywhere with the search
  and Show all on. Zones and enclosure are dropped from that link because the
  dead are in none of them.
- **The zone select became chips on phones as well.** The old zone and
  enclosure selects were desktop-only, and phones were sent to `/enclosures`.
  The chips scroll sideways on a phone as they do on `/enclosures`, so there
  was no reason to hide them, and "the same as `/enclosures`" includes the
  phone. The **Enclosure** select stays desktop-only. It now lists only the
  enclosures under the chosen place and zones, and an `?enclosure=` outside
  them is dropped under the same stale rule.
- **Not changed:** the Lifecycle chip under Everywhere still filters by zone,
  as on `/enclosures`, so it lists everyone in a Lifecycle bucket (Adopted and
  Deceased with Show all on). `resident_list_view` still returns
  `zone_internal`; nothing on this page reads it now, but the resident hub
  does.
