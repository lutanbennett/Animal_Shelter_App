# Calendar follow-up schema (0236)

- **Cancel reason:** none existed on `clinic_visits` (only `status` and the archive-specific `archive_reason`), so `cancel_reason text` is added.
- **Audit label:** no enum or `audit_log` change. `record_audit()` stores full before/after rows with `actor` null for the service role, so "via Google Calendar" is derived: `new_row.calendar_changed_at` differs from `old_row.calendar_changed_at`. Avoids rewriting the shared audit function; one migration file.
- **Contract for `calendar-followup-app`:** the "changed in the last week" list reads `clinic_visits` where `calendar_changed_at > now() - interval '7 days'`, showing `calendar_change_kind` ('moved'/'cancelled') and `cancel_reason`. The poll sets all three together on a move or cancel (plus status = 'cancelled' for a cancel). Restoring a visit does not need to clear them.
