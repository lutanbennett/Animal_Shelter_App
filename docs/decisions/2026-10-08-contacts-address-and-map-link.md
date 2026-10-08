# A contact's Address is words only; the map is the Map link

2026-10-08, `contacts-address-fields`. Feature half of "Contacts: separate
Address and Map link fields", on top of `0164_contacts_map_url.sql` and
`2026-10-08-contacts-map-url-not-pin.md` (which chose a stored link, not a pin).
No migration.

## One rule, used everywhere

`contactAddressFields()` (`src/lib/contacts/contacts.ts`) is how the two boxes
are saved, and the only place the rule lives. Management → Contacts (add and
edit), the Shelter Friend wizard and `scripts/move-contact-map-links.mjs` all
call it, so the forms and the row move cannot disagree:

- An Address that **starts with** a link gives the link to Map link (when Map
  link is empty) and keeps the words after it as the address. Being kind beats
  refusing: pasting the link into Address is exactly what the one box used to
  ask for.
- A link in Address while Map link holds a **different** link is refused
  ("put the link in Map link"): which one is right is the person's call.
- The Map link box takes the **first link** in what was pasted, because the
  Maps app's Share can copy the place's name along with it; anything with no
  http(s) link is refused. It is stored normalised (`new URL()`), which never
  contains a space, so `contacts_map_url_form` cannot disagree with the app.
- A link **in the middle** of an address is left alone: it is not a shape we
  can split safely, and the audit already lists it.

A new or changed Map link is also checked with Google once, on save, with the
`mapLinkLeadsSomewhere()` Settings → Website uses: a link Google answers "not
found" for is refused in plain words, and a slow network never blocks a save.
An edit that leaves the Map link unchanged does not ask, so fixing a phone
number never stalls on an old link.

## Reading: words from `address`, map from `map_url`

`contactMapSource()` is what every staff map is built from: the Map link with
the written address after it, so a link that dies still falls back to a search
of the words — the "link, space, words" shape `addressMap()` has always read,
so #461's single lookup (thumbnail and tap cannot disagree, a dead link shows
no map, never a 404) is reused untouched. A row with no Map link reads
`address` as it always did. `addressText()` prints the address and drops a
link left at its front, so **no page prints a URL as the address, whether or
not a row has been moved**. The hub no longer prints the link at all; the map
under the address opens it.

## The public page, and why nothing new is published

The public card reads `map_location` alone for the map — no longer
`map_location ?? address` — and `address` alone for the words. So the written
address never feeds the public map, and the Map link never appears under
"Address". Checked against what each opt-in released before:

- `show_address` on, `show_map` off: before, a link at the front of the
  address could open as "Open in Google Maps"; now the words only. Less.
- `show_map` on, `show_address` off: before, `map_location` was the whole
  address, so words after a dead link went into the public map search; now a
  moved row's `map_location` is the link only. Less.
- `show_map` on with no Map link: `coalesce(map_url, address)` (0164) still
  searches the written address, exactly as today. Same.

No column was added to `public_shelter_friends`, and `show_map` / `show_address`
are untouched. `scripts/check-contact-address-fields.mjs` asserts both halves
against the real `/friends` response.

## Existing rows

Split automatically only where it is safe: an address that **starts** with a
real http(s) link and has no Map link yet. That is the forms' own rule, run by
`scripts/move-contact-map-links.mjs` (dry run by default, `--apply` to write;
each UPDATE names the row's current address and an empty `map_url`, so a row
edited in between is left alone; a second run finds nothing). Everything else
stays in Address for a person, driven by `audit-contact-map-links.mjs`.

- **Dev:** 4 rows moved (2 Maps short links, 2 `google.com` links that are not
  maps — moved as is; the audit still lists those two as "not a Google Maps
  place", now under Map link).
- **Production:** the audit (#464) found 2 live contacts with an address, both
  a working link and nothing else, I Blue Paw among them. The move would leave
  each with an empty Address and the link in Map link; the written address is
  then typed by hand. Running it is Lutan's call (`--env production`, from the
  main checkout). Until then nothing breaks: the pages read a link left in the
  address exactly as before, and no longer print it.
- An unmoved row also moves itself: Edit opens it already split, and Save
  stores it the new way.

The audit now judges the map as the app builds it (`contactMapSource`), and
"link with words after it" is no longer reported once a row has its own Map
link — those words are the written address, as they should be. Its result on
dev was identical before and after the move.

## Not done

"Is this the right place?" — a map preview **before** saving — was part (1) of
the maps item when it planned a pin. The contact's page shows the map straight
after saving; whether a pre-save preview is still wanted is Lutan's call, left
on the backlog.
