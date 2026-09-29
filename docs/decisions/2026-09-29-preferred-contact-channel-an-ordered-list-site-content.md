# 2026-09-29 — Preferred contact channel: an ordered list, `site_content.preferred_channels`

Schema half of "let the shelter choose its preferred contact channel" (migration `0111`). **One choice or an ordered list** was the open question; the answer is an ordered `text[]`, default `{line}`.

- **Why a list.** The feature needs a fallback chain anyway (chosen channel cleared → next channel that has a value → phone → email), and the Talk-to-us menu and footer want a second and third button in the shelter's order. A single `preferred_channel` would have needed a second column or a second migration for both. One array covers the preference (first entry), the button order and the fallback.
- **Why an array and not a table.** At most six values, always read together with the one `site_content` row, never queried by channel. A child table would add a join and RLS for no gain. `site_content` becomes one row per shelter under the tenancy spike, so the setting is already per-tenant; it needs no extra design there.
- **Values** are `line, messenger, whatsapp, instagram, phone, email`, checked with `<@` (a CHECK cannot hold a subquery) and at most six entries. Duplicates are not refused in SQL; the helper de-duplicates. An empty list is allowed and means "built-in order". NULL is refused.
- **Default `{line}` is today's behaviour.** The picker's helper treats any channel missing from the list as trailing in the built-in order (LINE, Messenger, WhatsApp, Instagram, phone, email), so `{line}` alone changes nothing, and merging this PR is invisible: no code reads the column.
- **Not checked in SQL:** whether a listed channel actually has a value. That is the helper's job at read time, so clearing a channel's link never makes a save fail.
- **Follow-on:** `contact-channel-picker` (batch 8) builds the Settings → Website picker, `preferredChannels(content)` and the public pages against this shape.
