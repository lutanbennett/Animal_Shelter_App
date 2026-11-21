# 2026-11-21 — Definer setters write the request's shelter only (#h3ro9, 0432)

**Mechanism.** A `security definer` function runs as the table owner, so the `shelter_scope_*` policies (0392) never apply to what it
writes. A constant-key update (`where id = true`) therefore matches every shelter's row. 0431 fixed this in `set_shelter_logo()`; its model,
`set_hero_photo()` (0274, 0351), had the same flaw: one shelter's hero upload overwrote every other shelter's.

**Fixed (0432).** `set_hero_photo` now also asks `shelter_id = (select current_shelter_id())`. `approve_website_draft` (0315) was the only
other hit on a per-shelter table: it read the draft by id, updated `site_content` `where id` and `site_pages` by slug, and deleted the draft by
id, all unscoped, so a website approver could publish another shelter's draft and overwrite every shelter's `site_content`. It now reads the
draft only from the request's shelter and writes/deletes only that shelter's rows; `shelter_id` also joins the keys a patch may not set.
A trusted caller with no header matches nothing, deliberately (as 0431).

**Sweep** (`grep -rn "where id = true\|where true\|where key = '" supabase/migrations/`, plus `update site_content` and dynamic `where id`):
- (a) wrong, fixed: `set_hero_photo` (0274/0351), `approve_website_draft` (0315). `set_shelter_logo` 0429 was already fixed by 0431.
- (b) correct, installation-level: none needed a constant key on a shared table; hits on `roles`, `permission_activities`, `shelters`,
  `public_stat_switches` by `key = '<literal>'` are one-off migration statements or lookups, not definer setters writing a per-shelter table.
- (c) not setters: 0059 (one-off data copy), the reads in views.
Hits on `roles where key = 'admin'` inside older functions are reads of a role, already addressed by 0423.

**A future definer setter must** scope its own writes with `shelter_id = (select current_shelter_id())` (and its reads of other rows),
never rely on the policies, and ship a harness like `supabase/harness/hero_photo_scope.sql` showing shelter A's write leaves shelter B's row
untouched. `HeroPhoto.tsx` and the screen need no change: the fault was in the function.
