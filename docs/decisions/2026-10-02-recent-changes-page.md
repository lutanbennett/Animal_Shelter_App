# 2026-10-02: Recent changes page: field names in the list, values on request, keyset paging

Backlog DB-6 part 2. Settings → Recent changes (`/admin/recent-changes`) reads
`audit_log` (0121). Part 3, undo from `old_row`, is not built; this page is what
it will hang off.

## What the list shows

Per line: when, who, what, which record, and **the names of the fields an edit
changed** (never their values). The values (before and after, per changed field;
the whole row for an add or delete) appear only for the one line an admin opens
with *Show values*, by `?open=<id>`.

Why: `old_row` and `new_row` are whole rows, so a diff panel on every line would
put carers' phone numbers, addresses and medical notes on screen for fifty rows
at once. The question the page answers ("something changed and I don't know
who") needs the field names, not the data. Opening one line is a deliberate act,
and the HTML of the page also only carries the values of that one row.

## Reading

With the signed-in admin's own client, not the service role. `requireAdminUser()`
guards the page and RLS (`current_user_role() = 'admin'`) guards the table, so if
the first were ever dropped the second would give an empty page. The page has no
server action: filters, paging and *Show values* are GET links, so there is no
write path to guard. The auth user list (to turn `actor` into a name) uses the
admin client, as Security does; that is the auth API, not the audit table.

RLS is not widened and nothing here needed it to be.

## Paging

Keyset on `id` (the identity primary key), 50 rows a page, fetching 51 to learn
whether another page exists. There is no total: counting the table is the cost
that grows with it, and #259 (`listUsers` silently dropping page 2) is the reason
to say plainly when there is more rather than truncate. `id` stands in for time
(it is assigned at insert, as `at` is); the `at` filters are applied alongside.
Only *Older* and *Back to the newest* are offered, not *Newer*: an admin's
question is "what happened recently" and the browser's Back button covers the rest.

## Resolving names

`actor` is looked up in the auth user list (name and email, or the id if the
login has since been deleted; the table has no foreign key by design). A resident
row, and any record carrying `resident_id` (or an attachment owned by a resident),
shows the resident's *current* name from `residents`, falling back to the name in
the image, or "(resident since deleted)". Contacts and files show their own name.

## Archive and restore

0124 made archive an `UPDATE` that sets `archived_at`. Such a line is labelled
Archived / Restored, not Edited, so it reads as what the person did.

## Not in scope

Undo (part 3). A date filter uses shelter days (Asia/Bangkok, UTC+7), inclusive
at both ends. A thai manual file does not exist yet; `en.ts` only.
