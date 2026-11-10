# Meme tags are read through resident_who_and_where (#t3n9r)

`attach()` in `src/lib/memes/queries.ts` joined `residents(id, name, thai_name)`. A login holding only `meme_add` or
`meme_library` holds `resident.who_and_where`, which cannot read `residents`, so the join came back empty and a saved tag read
as "No resident is tagged". It now reads the link rows, then the names from `resident_who_and_where` in a second query.

- **Who the view returns rows for (migrations 0134, 0192, 0263, 0265):** `where (select private.works_with_residents())`, which is
  true for any login holding a card that works with residents (0265 added `resident.who_and_where` to the list), and `has_permission()`
  is true for Admin. So Admin sees every resident through it. The comment in `src/lib/medical/residents.ts` saying the view was
  empty for Admin and Management was stale (true of 0134 only) and is corrected.
- **Thai name** is in the view (`thai_name`), so the screens show what they did.
- **The `if (!r) continue` skip stays.** A missing view row now means the login holds no card that works with residents, so leaving
  the name off is right; showing a nameless chip would be worse. No new string.
- No card, no migration.
