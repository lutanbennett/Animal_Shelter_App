# Assistant retention: 2 days, 90 for the could-not-help log (DB-11)

Lutan, 2026-10-10: keep 2 days of what people type at the assistant, except the requests it could not help with.
Lutan, 2026-10-19: keep that could-not-help log 90 days; "Only admin should be able to read assistant rows."

- `0227` adds `purge_assistant_actions()` and a daily pg_cron job (03:17 UTC). Rows with status `unmatched` or
  `refused` go after 90 days; every other row after 2 days. pg_cron runs inside the database, so it needs no key
  and no deploy. The function is revoked from every login role.
- **No read-policy change.** Live policies already say Admin only: `assistant_actions_admin_all` (0153) and
  `assistant_actions_select_perm` (0150, own rows only). Management lost its read-everything in 0150 and is not
  given it back; do not add one without asking Lutan.
- Proved by `scripts/check-assistant-retention.mjs` (rollback harness on dev).
- The app half (a line on `/privacy`, Thai too) is the second PR.
