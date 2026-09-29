# 2026-09-26 — Contact channels, stock count history, and a resident's hook and ideal home (`0092`–`0094`)

Schema halves for three backlog items, in one PR because only one branch
may carry migrations at a time. No code reads any of it yet.

- **WhatsApp is stored as the number, not a link** (`site_content.whatsapp_number`,
  `0092`). International format, digits only (`66812345678`), checked
  `^[0-9]{7,15}$` (E.164 allows at most 15 digits). `https://wa.me/<digits>` is
  the only form wa.me accepts, so the feature builds it. A stored number can
  also be shown as a number, and the check means nothing but digits can reach
  the URL. The form strips `+`, spaces and dashes before saving. Messenger and
  X are links, with 0080's loose `https?://` check. The host rule stays in
  `src/lib/links/validate.ts`. Messenger is its own field, not derived from
  the Facebook link, because a page's name and its Messenger handle can
  differ. All three start empty; the handles are the shelter's to type.
- **`stock_counts` records each stocktake. It does not give actual usage yet**
  (`0093`). `record_stocktake()` now writes one row per listed item: one
  `stocktake_id` per call, the stored figure, the unit at the time, the same
  `now()` the item is stamped with, and the caller. What it lets you compute:
  the change between any two counts of an item, and when each count happened.
  What it does not: **stock received.** Nothing records a delivery, so
  `used = previous + received − new` is still missing a term. A fall between
  counts is actual usage only if nothing arrived, and a rise is an unlogged
  delivery. A receipts concept is its own backlog question and was not
  invented here. Other choices:
  - Two real foreign keys (`medication_id` / `diet_type_id`, exactly one set)
    rather than an untyped item id, with `on delete cascade`. Both tables
    are hard-deleted from Management, and a delete must not start failing
    because the item was once counted.
  - The unit is copied into each row, because units are editable, and a
    count of 40 "tablet" must not become 40 "ml" later. The feature should
    not subtract across a unit change.
  - The only writer is the function. There are no insert, update or delete
    policies or grants, so a count cannot be back-dated or edited through
    the API. It can be read by admin, management, staff and volunteer
    (0091's list). A vet reads nothing, and anon is refused.
  - The single-cell stock edit on Management → Medications / Diets writes
    **no** history. It is also how a typo gets corrected, and logging a
    correction as a count would invent usage. So an item's latest history
    row can be older than its `stock_counted_at`. The feature should notice
    that and not trust the history alone.
  - Back-filled: each item with a count gets one row from its current
    figure and stamp, so the first stocktake after this has a previous count.
- **The resident's hook line and ideal home are translatable** (`0094`,
  `residents.hook_line`, `residents.ideal_home`). They are public prose like
  `bio`, and a Thai visitor should read them in Thai. A paired `_th` column
  cannot tell that the English changed after the Thai was written; the
  translations table's source snapshot can. So they are `translatable_fields`
  rows (tier `reviewed`) that residents' existing trigger queues. **Size
  needed no schema:** `residents.size` (0051) is already on
  `public_resident_profiles` and on `/adopt/[id]`. The two columns are added
  to `public_resident_profiles`, which `/adopt/[id]` reads, and **not** to
  `public_resident_cards`. The cards view is the `/r/<code>` slice of every
  resident, and 0068 kept adoption-listing copy off it.
- **Re-creating a public view means naming `private.` explicitly.** 0082 and
  0086 moved `approved_translations()` and `resident_current_state` into
  `private`. Existing views followed by oid, but their text in older
  migrations still says the bare names. Copying 0060's view text failed the
  dry-run on `approved_translations`. Worse, the unqualified
  `resident_current_state` would have **applied cleanly** and bound to the
  gated public view, which returns nothing to anon, so adopted and deceased
  residents would have reappeared on `/adopt`. Copy a view's current
  definition from `pg_get_viewdef` on dev, not from its last migration. For
  0094 the before and after definitions were compared: they are identical
  apart from the two appended columns.
