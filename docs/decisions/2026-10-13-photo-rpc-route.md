# The photo route asks can_see_drive_file once (2026-10-13)

Backlog: *An internal photo costs seven queries* (architecture review C7). Schema half: `0193`, see
`2026-10-13-can-see-drive-file.md`. This is the route half.

- **One rpc replaces seven selects** in `canSeeInternalFile()`. Per internal photo that is 8 queries (1 public check + 7)
  down to 2; a thirty-photo gallery goes from 240 to 60 (the internal check alone, 210 to 30). Counted from the code.
- **Any error reads as "not found"**, the same as the public check beside it. That includes the case where `0193` is not
  yet on the database: every internal photo would read as not found, which fails closed rather than open.
  **Production must get `0193` before this route deploys.**
- **Left out:** public photos, the caches and the Drive downloads are unchanged.
- **Adding a table with a Drive id** now means one new branch in `can_see_drive_file` (a new migration with `create or
  replace`), and the matching branch in `is_public_drive_file` if it can be public. The route needs no change.
