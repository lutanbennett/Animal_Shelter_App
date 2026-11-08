# 2026-11-08 — The audited-table list is checked against the triggers

Backlog `#a9d4v`. Stream `claude/audited-tables-drift`.

## Step zero

The gap was still there on `main` at `36d35f3a`: `role_home_tiles` at `recent-changes.ts` lines 38 and 227, and
no check of any kind comparing `AUDITED_TABLES` with the triggers.

## The measurement, and its method

`scripts/lib/audit-triggers.mjs` replays `supabase/migrations/*.sql` in file order and keeps the state the files
leave behind. A trigger counts when it executes `record_audit()` **or any function whose body inserts into
`audit_log`** (`site_content` has two of the second kind, `0254` and `0256`). It follows `drop trigger`,
`drop table` and `alter table … rename`. A regex over `create trigger` text (the planner's method) and this
replay would **not** agree: the regex counts triggers that a later file dropped and mistakes trigger names for
tables, and misses `site_content`'s own-function triggers.

| | Count |
|---|---|
| tables carrying an audit trigger after the last migration | **47** |
| already declared and still real | 18 |
| **undeclared (rows rendered blank)** | **29** |
| declared but not real | 2 (`role_home_tiles` dropped in `0243`; `card_includes` never had an audit trigger) |

The brief's "about 28" is close: its list lacked `appeals`, `desexing_drives` and `shop_links` (real tables, all with a
trigger; the brief took `shop_links_stamp` for a name) and included `role_extras`, dropped in `0261`. **The method
cannot see** a trigger created inside dynamic SQL, and `0172` renames `vet_appointments` inside a `DO` block, so the
check applies the app's own `LEGACY_TABLE_NAMES` to the result.

## Deliverable 2: a missing label renders BLANK

`page.tsx` writes `{s.tables[e.table]}` and the dictionary is a plain object, so an unlabelled table gives
`undefined`, which React renders as nothing. It does **not** fall back to the raw table name. That is why the check
asserts a label in both dictionaries rather than trusting a fallback.

## A fourth place the brief did not name

The brief says a table must appear in three places. There was a fourth: `page.tsx`'s `recordCell` carried its own list
of tables (`contacts`, `attachments`, `roles`, … `public_stat_switches`) and showed `(no name)` for any other, even when
`toEntry` had found a name. Seen on screen on the first run: the new `community_places` row had its label but read
`(no name)`. The page now shows `e.name` for every table other than residents, so the page can no longer disagree with
`toEntry`. The name logic in `toEntry` is now one table-keyed map, `NAME_FROM_IMAGE: Record<AuditedTable, …>`, which
TypeScript makes total: a table cannot be listed without deciding what names its rows.

## Where the line was drawn

**All 29 were declared; nothing is excused.** `AUDIT_TABLES_NOT_LISTED` exists (empty) so a future table can be left
out with a written reason beside the list, and the check reads it. The reasoning: this is the page an admin reads when
someone disputes who changed what, and a row nobody can label is worse than a longer filter. Even the child tables
(`donation_lines`, the `*_photos` tables, `meme_residents`, `reel_residents`) change something a person can be asked
about, and they carry `resident_id` where it applies so the resident name shows. Rows with no name of their own
(`cols: []`) still say what kind of record and what kind of change. Where the image has a human name it is used
(`title`, `donor_name`, `file_name`, `procedure_type`, …).

`user_roles` has no name column (its image holds `role_id` and `user_id`), so it reads as the table and the change.

## The filter dropdown

47 options. Sorted by the label shown (`localeCompare`) rather than grouped: grouping would need a second
dictionary entry per group and a decision about which group owns each table, and an alphabetical list is found by
typing the first letter. Ordering is not security. Looked at on screen at 800px: usable, scrolls.

## Dropped tables keep their old label

`role_home_tiles` and `role_extras` keep their dictionary entries (marked as dropped tables) because `audit_log` is
append-only, so rows logged before the drop still read "Home screen tile" rather than blank. `card_includes` had no
rows ever, so its label was removed. Neither is in `AUDITED_TABLES`, so they are not offered in the filter.
`undo.ts` no longer names `role_home_tiles` or `card_includes`: nothing can be undone on a dropped table.

## The check, and where it runs

`scripts/check-audited-tables.mjs`: reads migrations, `recent-changes.ts` and both dictionaries; no database, no
network (so no `exitWith` workaround is needed; nothing opens a socket). It fails, naming the tables and the file
that added each trigger, for: audited but unlisted; listed with no trigger; in both lists; excused but no longer
audited; no `NAME_FROM_IMAGE` entry; no label in `en.ts`/`th.ts`. Proven both ways: it fails when `social_shares`
is removed from the list, `card_includes` is added and `reels` is removed from the Thai dictionary, and passes on
the real tree.

Wired into CI job **`script-integrity`**, beside `check-site-hosts` and `check-public-paths`: that job is the one
that runs the static checks which need no `node_modules` and no secrets, and it runs on every non-docs PR. Not in
the DB-backed checks, which need the dev token.

## Action controls on the screen (deliverable 7)

Recent changes is an Admin page: `requireAdminUser()` at the top of `page.tsx`. Controls: the table, actor and date
filters and Show (read-only GETs); *All changes to this record* and *Show values* (links); *Older changes* (link);
**Undo** (`UndoButton`, server action `undoChange`), whose server check is `hasAdminRole()`, not a card activity.
Undo is drawn on `undoKind`, which is derived from the table and operation, not from the login. Admin sits outside
the card system, so there is no activity to ask; nothing found to fix.

## Not done / for the planner to file

- **`card_includes` is audited by nothing.** `0257` gave `card_grants` an audit trigger and `card_includes` none, so
  a change to which cards include which (which the database uses to recompute every role) leaves no trail. Whether it
  should be audited is a schema change and this stream may not add a trigger: **for the planner to file.**
- **Thai labels are unreviewed.** Written by this stream, not by a Thai speaker; `translatable_fields` queues them.
