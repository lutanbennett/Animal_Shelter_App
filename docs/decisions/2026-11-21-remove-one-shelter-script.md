# Removing the inert `test123` shelter: a script Lutan runs (#tstsh)

**Lutan, 2026-11-21, asked directly:** offered *leave it in place*, *a one-off removal*, or *the console should be able to
remove a shelter*, he answered **"I'll do a one-off removal"**. So the path is a script, and he runs it.

**(b), whether the console should ever remove a shelter, was deliberately left with `#pacon`.** No `src/` change, no button.

## What references a shelter (read from the dev catalogue, 2026-11-21)

- **114** base tables in `public` carry `shelter_id` (all `NOT NULL` since 0397). **Every one** has a foreign key to `shelters(id)`.
- **111** are `NO ACTION` (a delete fails on the first row), **1** is `ON DELETE RESTRICT` (`shelter_hosts`, 0382:26), and **2** are
  `ON DELETE CASCADE` (`shelter_calendar_credentials`, `shelter_drive_credentials`).
- So anything pointing at the shelter blocks the delete except those two credentials tables. A freshly inserted shelter has rows in none.

## What "inert" means, and how it is tested

No row in **any** of those tables points at the shelter (the list is read from `information_schema` on every run, so a table added
later is covered), apart from the two cascade tables, which are printed and go with it. That covers web addresses, roles, logins
(`user_roles`), receipts and content. Counts are printed per table on refusal.

## The command (Lutan's; the script is read-only without `--apply`)

```
node scripts/remove-shelter.mjs --env production test123
node scripts/remove-shelter.mjs --env production test123 --apply
```

Run the first, read it, then the second. **Each needs a bare exact-match allow rule in his user settings** (a `cd` prefix or a pipe
makes the classifier refuse it as a production deploy); that rule is outstanding and is the planner's to arrange.

## Guards

One key only; `lanna` refused by name before any environment is loaded; `--env` required and the project ref printed first; the
delete matches key and id and must remove exactly one row. No migration, no schema change.

`#tstsh` is **not** ticked: its done-when needs the row gone, which is Lutan's run.
