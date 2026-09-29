# 2026-09-24 — The public enclosure page lists its residents; `public_enclosures` (0079)

An enclosure's QR code (`/e/<id>`) will show a signed-out visitor the
enclosure and the animals living in it. It will not show the enclosure alone.
Lutan chose this on 2026-09-24, when the backlog item asked. Someone who scans
a kennel is looking at the animals in it. This PR is the schema half. The page
is `claude/enclosure-public-view`.

- **One row per enclosure, residents embedded.** The backlog item suggested
  a per-resident `public_enclosure_residents`. Instead `public_enclosures` has
  one row per physical enclosure and a `residents` json array holding each
  current resident's whole `public_resident_cards` row. The page makes one
  lookup, and an empty kennel is still a row (`[]`), not a missing one. The
  embedded card is `to_jsonb()` of the 0068 row, not a second column list,
  so 0068 stays the only place that decides what a visitor may see about a
  resident. The harness asserts the embedded card equals that row as `anon`
  reads it.
- **Left out on purpose:** capacity, notes and anything about maintenance.
  The view has no occupancy figure either. The array's length is a head count
  a visitor can already make by looking into the kennel. Capacity and how full
  the kennel is are not.
- **Lifecycle pseudo-enclosures are excluded by zone name** (`'Lifecycle'`),
  the way `resident_current_state` and the app already detect them. Every
  deceased, adopted, hospitalised and fostered resident is placed in one of
  those buckets, so the same filter keeps them off every kennel's list. No
  separate status filter is needed, and the harness checks each case.
- **This reverses one line of 0068 on purpose.** 0068 says nothing about where
  a current resident is. For a resident in a physical enclosure, this view
  now says. The page exists to say it, and a visitor walking round can read
  the same thing off the kennels. Anyone can also list the whole view with the
  anon key and get the full kennel map. That is accepted for the same reason.
  Where a resident is off-site (hospital, foster home) stays private.
  **External (outreach) zones are included:** a code posted at the Temple
  describes the dogs a visitor there can see. To show only the enclosure
  after all, or to drop outreach zones, narrow the view in a new migration.
  The page reads `residents` only.
