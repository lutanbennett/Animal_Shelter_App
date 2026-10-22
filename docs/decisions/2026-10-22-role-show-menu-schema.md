# roles.show_menu: the per-role "Show the menu" setting (schema half)

**Date:** 2026-10-22. **Migration:** `0247_role_show_menu.sql`.

One column, `roles.show_menu boolean not null default true`. It is the switch the menu-removal stream will read in
`src/app/layout.tsx` to decide whether a role's logins get `NavPane`. Nothing reads it yet, and every role is `true`, so
nothing changes for anyone.

- **Default yes, for every role.** Lutan, 2026-10-13: the menu goes only when coverage is demonstrated, and a role that
  turns out to need it back must get it without a release.
- **No new write policy.** `roles` already has `roles_admin_all` (Admin only) and the restrictive aal2 insert/update/delete
  policies (`0132`), so Admin at 2-step is the only writer, as Lutan ruled 2026-10-19 (only Admin manages tiles). The
  `audit_roles` trigger logs the whole row, so a flip is audited. A second policy would be redundant.
- **Admin and the other fixed roles carry the column too** (it is on the table), but "Admin always keeps the menu" is the
  app half's rule, not the column's.
- **For the app half:** the layout must read this for the signed-in login's own role. `roles` is Admin-only under RLS, so
  that read needs the server/service path (or `my_permissions()`), not a direct select as the login.
