# A contact's map is a stored link (`map_url`), not a pin

2026-10-08, `contacts-address-map-schema` (`0164_contacts_map_url.sql`). Schema
half of two backlog items Lutan raised the same day: "Contacts: separate
'Address' and 'Map link' fields" and parts (1)/(2) of "Maps on contacts and
Shelter Friends". The first said: a `map_url` *or* the pin columns — decide
which in the schema PR, and do not build both.

## Decision

`contacts.map_url`: one nullable column holding the Google Maps link for the
place, apart from `address`, which becomes the written address only. No
`latitude` / `longitude`, no place ID.

## Why not a pin

- **Nothing can produce a pin except the link.** There is no paid Maps API
  (the item forbids one), so there is no geocoding: a typed Thai address cannot
  become coordinates. Every pin would be read out of a pasted Google link
  (a `maps.app.goo.gl` link — what Share in the Maps app copies, and what staff
  actually paste — followed to whatever URL Google redirects it to, in a shape
  Google does not promise to keep). A pin is a copy derived from the link;
  storing the copy instead of the source keeps the less useful half.
- **The link is already the exact place.** Lutan's complaint is that Google
  puts a *typed* address in the wrong spot. A shared link does not have that
  problem: it is the place the person chose in Maps, and on a phone it opens
  the Maps app on that place, with its name, photos and directions. Coordinates
  would open an anonymous dropped pin.
- **The other inputs fit in a link too.** Typed coordinates or a Plus Code can
  be saved as `https://www.google.com/maps/search/?api=1&query=<…>`, the form
  the item itself names. So one column takes every input the item lists.
- **A link is durable enough.** #461 (`contacts-map-404`,
  `2026-10-08-map-tap-is-our-link.md`) found Google kept active `goo.gl` links
  working after August 2025, and that the one production 404 was a tap inside
  Google's embed, not a dead link. A link that does die is caught by
  `addressMap()` following it, and shows no map rather than a 404.
- **Two shapes is the thing the item warned against.** If pins are ever
  needed (offline maps, distance sorting), they can be derived from `map_url`
  then, without another change of where people paste.

## What else this settles

- **The column holds one link and nothing else.** `contacts_map_url_form`:
  `^https?://` and no whitespace anywhere, so "link, space, written address"
  — the stopgap the single field forced, and suspect (a) of the 404 item —
  cannot be stored. The form only; whether the link leads somewhere is the
  app's to judge. The feature must store the normalised URL (`new URL(…)`),
  which never contains a space, so the app and the check cannot disagree.
- **No rows move in the schema PR.** Today's code reads the map out of
  `address`. Moving the links out now would take every map off the screens
  until batch 76 ships. The move belongs with the feature that reads the new
  column.
- **The public Friend map:** `public_shelter_friends.map_location` is
  `coalesce(map_url, address)`, still only when the friend opted in
  (`show_map`, 0076). Before rows move it is exactly today's value; after, a
  friend with a written address and no link keeps the address-search map they
  have now. `address` stays under `show_address`, so a link never reaches the
  public page through it once moved. No new public column.
- **Vets and volunteers do not see it**, as they do not see `address`:
  `vet_contacts` / `volunteer_contacts` (0126) list their columns.
