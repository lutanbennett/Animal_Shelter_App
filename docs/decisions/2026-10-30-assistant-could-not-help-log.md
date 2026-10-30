# The assistant's could-not-help log: an Admin screen, an export, a status line and a production check

2026-10-30. Backlog item "Nothing can read the assistant's could-not-help log" (Assistant).

## Why

`assistant_actions` rows with status `unmatched` or `refused` are kept 90 days on purpose
(`2026-10-19-assistant-retention.md`, `0227`), and nothing read them: no page, route, export or eval set.
Lutan asked "where can admin view the logs?" and "how do I train the model for items that it couldn't
answer". This is the prerequisite for the assistant's version 2, whose eval set is built from these rows.

## What shipped

- `/admin/assistant` (Settings → Assistant log): when, status, what was typed exactly as typed, and the
  resident the parser inferred (`draft.residentId`), newest first, filter by status and date. Reads
  through the normal session client, so the table's own policy is a second lock.
- `/admin/assistant/export`: CSV, one row per exchange: id, when (shelter time), status, typed, what the
  assistant did, intent guessed, resident id guessed, then **empty `correct_intent` and `correct_answer`**
  to be filled in. That is what makes it an eval set. The sentence goes through `csvField`, so a leading
  `=`, `+`, `-` or `@` gains a `'` (spreadsheet formula guard); the file is otherwise as typed.
- `/admin/status`: the Assistant requests tile gains "Could not help: N not understood, M refused" and,
  for an Admin only, a link to the log.
- `assistant-could-not-help` in `scripts/lib/readonly-checks.mjs` (listed by `check-production.mjs`):
  counts, oldest/newest and the newest 25 with id, date, status and typed text. No login, no resident
  name. Informational; flags nothing. Lutan approved adding it to `scripts/lib/readonly-checks.mjs` in chat
  on 2026-10-30, since that file is where every check lives and the batch brief had listed `scripts/lib/`
  as off limits.
- Retention is untouched: 2 days for everything else, 90 for these two statuses.

## Why there is NO card (not a gap — do not file it as one)

Lutan, 2026-10-19: "Only admin should be able to read assistant rows". The live policies already say it
(`assistant_actions_admin_all`, `0153`; `assistant_actions_select_perm`, `0150`, own rows only).
Admin sits outside the card system (`CLAUDE.md`), so an Admin-only screen needs no card and must not be
given one, the same as Settings → Security. The guard is `requireAdminUser()` (`perms.isAdmin`), not a role name.
No read policy was added for anyone else. A card-only login (`dev-signin --cards`) correctly sees nothing.

## Action controls and what each asks

| Control | Drawn when | Asks |
|---|---|---|
| Show / Clear (filter form) | page opens | Admin rule (`requireAdminUser`); only reads |
| Download as a test set | page opens | Admin rule; the route repeats it (`perms.isAdmin`, else 403) |
| Resident link in a row | a resident was inferred | Admin sees everything (`perms.isAdmin` in `can.ts`); the resident page asks its own card |
| "Open the Assistant log" link on `/admin/status` | `perms.isAdmin` | the same Admin rule; a `system.status` card holder without Admin sees the counts but no link |
| Tile on Settings | `perms.isAdmin` | the same Admin rule as the Security and Stocktaking tiles |

Found, not fixed: none.

## Not done

- No 2-step (aal2) gate: the screen only reads. Security and Stocktaking need it because they change access.
- Thai strings are a draft and want a Thai reader.
- The manual has no new topic; the log is a step of the existing System status topic (a new topic would
  need a row in `scripts/lib/acceptance-matrix-entries.mjs`, off limits this batch, as #1102 did).
