# 2026-11-06 — Website statistic switches: schema half (`0328`)

Items `#jdoto` (a switch for each statistic on the public homepage) and the migration half of `#e7v1q`
(`page:events`). Schema only: the app half is batch 2's `website-switches-app`.

## The shape, and why

The homepage band has two kinds of statistic, and they have no common shape, so each gets the one that fits.

- **Lifetime figures** (`public_impact_figures`) are already rows. The switch is a column on the row:
  `impact_baselines.show_on_website boolean not null default true`, and the view filters on it. The baseline, its
  date and `since_year` are never touched by the switch, which is the point of the item: today's only off switch
  is clearing the Director's starting number, and `impact_baselines_pair` forces the date out with it.
- **Live counts** (`public_shelter_stats`) are four columns of one computed row, with nothing to hang a flag on.
  Options weighed: (a) four extra rows in `impact_baselines`; (b) a key in an existing settings table;
  (c) a table of its own. Chosen: **(c), `public_stat_switches`, four fixed rows** (`in_care`,
  `adopted_this_year`, `in_foster`, `in_treatment`).
  - (a) would put four rows with no baseline into the Settings editor and make "baseline entered" mean two things
    in the view's filter.
  - (b) `site_content` is a singleton; four booleans there would be four more columns on a table every public
    request reads, and they would not get a per-row audit trail. A row per statistic gets `record_audit()` for free,
    so each change reaches Settings → Recent changes with a before and after image.
- `public_shelter_stats` returns **NULL** for a switched-off count instead of dropping the column. Dropping would break
  every reader of the view; NULL is already "no tile" to `impactStats`, because `null >= LIVE_TILE_MIN` is false.
  The count is not computed while the switch is off. The four non-tile columns are not switchable.

## Beside `LIVE_TILE_MIN`

`LIVE_TILE_MIN = 2` is unchanged and still lives in `impact.ts`. A live tile shows only if its switch is on **and**
its count is at least 2. The two do not interact in the database: the view knows nothing of the threshold. The app
half must say on the screen that a statistic switched on but under the threshold shows nothing, so it does not read
as a broken switch.

## Access

Update needs `website.content` at Edit through `has_permission()`, as `impact_baselines` already does; read needs it
at Read. No role key anywhere. `public_stat_switches` has `update` granted on the one column `show_on_website`, so
the keys cannot be renamed, and a check constraint pins the four keys. It is **not** granted to anon: the owner-run
view reads it. The anon `select` grants on both public views are restated exactly as before and nothing is newly
granted; because the hard-coded-security check flags any `grant ... to anon` in a new migration, a record for this
restatement was added to `docs/hard-coded-security-registry.json` (the same pattern as 0285, 0303, 0314, 0316).

## What the app half must read

- Lifetime: `impact_baselines.show_on_website` for the tick; the public view needs no change in the app.
- Live: `public_stat_switches` (`key`, `show_on_website`) for the tick, behind `can(perms, "website.content", "edit")`;
  `ShelterStats` fields become `number | null` and a null count is no tile.
- Switching one off changes a public claim, so it goes through confirm-then-save like a baseline edit. Both tables
  are audited. Note `impact_baselines_stamp` refreshes `set_at` on any update, so switching a figure off or on moves
  its "last set" stamp; the app half should not read `set_at` as "when the number was last entered" after this.

## `page:events`

`site_content_hidden_public_pages_check` gains `'page:events'` (0290's whole list plus the one key). Dropping the
`noOwnSwitch` flag on the events entry in `src/lib/public-pages.ts` is the app half; until then nothing offers the
key and applying hides nothing.

## Proof

`supabase/harness/0328_website_statistic_switches_harness.sql` (rolled back, run on dev) ended
`HARNESS PASS: off keeps baseline 412/2026-01-01/2019 and restores total 423; live in_treatment null when off,
others untouched; audit, page:events, anon grants ok`. It also asserts `page:home` is still refused, an unknown
switch key is refused, and anon cannot read `public_stat_switches`.
