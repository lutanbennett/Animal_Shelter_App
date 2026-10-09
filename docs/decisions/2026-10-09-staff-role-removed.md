# 2026-10-09 — Staff is removed from the roles, reversing "Staff stays for other shelters"

**Lutan, 2026-10-09, in chat: "we should remove staff from the roles as it confuses things".**

He saw it on Settings → Security, where *Who may write outreach notes* (`community-dogs`, PR #487) offered
Staff beside the roles Lanna actually uses. Lanna's roles are **Admin, Management, 2IC, Head of
Maintenance, Head of Medical, Doctor and Volunteer**.

**This reverses** `2026-10-03-lanna-roles-lutans-answers.md`, which said *"Staff stays in the product for
other shelters"*. A session that reads only that file will put Staff back; this one is the later ruling.

## How it is done, and why in that order

1. **Move every live Staff login first.** An archived role's logins fail closed: `has_permission()`,
   `role_can()` and every `is_*_login()` join `roles` on `archived_at is null`. Anyone still holding Staff
   when the role is archived can do nothing. So `0173` **stops, naming them,** while any live login holds
   Staff. On dev (2026-10-09): Lutan's own test login moved to Management on his answer; the other twelve
   were throwaway test accounts and were archived. On production Lutan looked at Settings → Security the
   same day: the only Staff login there is already archived, so nobody live moves.
2. **Archive the `roles` row, never delete it.** Its history in `audit_log`, its cells in
   `role_permissions` and the archived logins that point at it all stay readable.
3. **A live login can no longer be given a retired role** (`user_roles_take_live_role`, `0173`). The app
   still writes the `app_role` enum, and `user_roles_sync_role_id` (`0132`) maps `'staff'` straight onto the
   archived row, which would make a login that can do nothing, silently. Refusing it says so.
4. **Then take Staff out of every screen** — the role pickers on Security, the manual's role filter, the
   acceptance matrix, the home screens — in the app PR that follows.

## What is not done

- **`staff` stays in the `app_role` enum.** Postgres cannot drop an enum value and about 43 migrations name
  it. It simply stops being given. It goes when the enum does (perm-drop-enum).
- **The outreach setting is not touched.** It lists live roles, so Staff drops off it by itself.
- **The old dev check scripts that build a synthetic Staff login** (`check-2ic-role.mjs` and its siblings)
  are left as they were: they record what was asserted when they ran. Re-running one now would fail on
  its Staff principal, because a live login can no longer be given Staff.
