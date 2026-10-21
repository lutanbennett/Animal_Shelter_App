# Calendar follow-up, app half

- The poll (`calendar-poll.ts`) now writes `cancel_reason`, `calendar_changed_at` and `calendar_change_kind` ('moved' | 'cancelled') together with the move or cancel. A cancel is still never a delete; the visit stays restorable. The old line appended to `notes` is kept, so nothing that read it changes.
- System status lists visits changed from the calendar in the last 7 days (`src/lib/status/calendar-changes.ts`), each linking to the visit.
- Audit label: a `clinic_visits` UPDATE with no actor and a changed `calendar_changed_at` shows "Via Google Calendar" in Recent changes (derived, as 0236 said; no audit change). It is a UI string, so it is in `en` and `th`. The stored cancel reason is a record, kept in English like `notes`, not a dictionary string.
- Not done: the production calendar token (Lutan's), push notifications.
