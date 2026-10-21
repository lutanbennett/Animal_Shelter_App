# Trust block: columns on site_content, people left to the About text

Decided 2026-10-21 (public-trust-block, migration 0237).

- Registration line is a paired column (`registration_text`, `_th`), shown under the address in the footer and on About.
- The Thai address is `contact_address_th`, read through `pairedText()` like the hours.
- "Where your gift goes" is year + unit (percent or baht) + four numbers. It is all or nothing: the action refuses a partial split and the page shows nothing unless all five are set, so the Donate page never shows half a table.
- The "people" (review section 5.3) are not a field. They go in the About page's own words, which the Director already edits.
- The LINE QR and "LINE: @..." line are not built; they wait on her LINE id.
- These columns hold public facts only, so they sit on `site_content` and its public view.
