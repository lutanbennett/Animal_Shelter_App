# Adoption stories: the app half (2026-10-17)

Builds on `2026-10-16-public-adoption-updates-columns.md`. The privacy shape is unchanged; this records what the app does with it.

**Public routes read only `public_adoption_updates`**, through `src/lib/adoption-updates/public.ts`. The animal's name and species come from `public_resident_cards` (the view carries no name), and a row with no card is dropped. `adoption_updates` is never queried from a public route, and the staff `note` is not selectable there.

**Where "a line on the animal's own page once adopted" went.** An adopted animal is excluded from `public_resident_profiles`, so `/adopt/<id>` is a 404 for them. Their page is the `/r/<code>` card page, which already says "has been adopted"; the stories sit under that line. No view change was needed.

**The photo proxy asks the view, not `is_public_drive_file`.** The proxy now also checks `public_adoption_updates` for the file id, as the caller. Widening `is_public_drive_file` would be a migration, and this stream carries none. Consequence: the file is public exactly while the view says so, so untick, hiding the animal or a death stops it being served to anyone who has not already got it.

**What untick does to cached pages.** `/adopt` and `/r/<code>` render on every request (no `revalidate`, they read cookies), so there is no page cache to clear: untick takes the story off the next load, which was checked on dev. The save action also calls `revalidatePath` on both as a belt. The one thing that is cached is the photo bytes: the proxy sends a public photo with `max-age` and `s-maxage` of 24 hours and the edge cache is consulted before the database, so a copy already cached at the edge, or in a browser, can be fetched by someone holding the direct link for up to a day after untick. The page no longer links to it. A photo already public for another reason (an animal still on `/adopt` has its gallery public) stays public, which is unchanged.

**Form.** The tick is a red-edged box headed Publish to the website, with its own words and first-name fields badged Goes on the website; the staff note is badged Staff only. Ticking turns the box red and shows a warning. Server-side: ticking with no `public_story` is refused, and the first name must be one word of 40 characters or fewer, matching the table's own check. Untick keeps the typed words so a re-tick restores them; nothing is shown while `share_publicly` is false.

**Which photo shows.** The strip and the card page show the first photo of each update; any non-Medical image on a ticked update can be shown, so the form says to delete one that should not be.
