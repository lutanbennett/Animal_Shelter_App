# Show the menu: the app half (tiles only, per role)

**Date:** 2026-10-22. Reads `roles.show_menu` (migration 0247, `2026-10-22-role-show-menu-schema.md`). No migration here.

- **Default yes, and this PR flips nothing.** Every role is `true`, so merging changes nothing for anyone. Which role goes
  first is Lutan's call; the toggle is under Who does what, per role (Admin at 2-step, audited by `audit_roles`).
- **Where it is read:** `src/lib/menu/show-menu.ts`, once per request. `NavPane` returns null when it says no, and
  `AppHeader` swaps the phone menu button for a **Home** button (visible at every width when there is no menu).
- **Admin always keeps the menu**, whatever the column says (the Director's desk view at night).
- **A login with two roles** keeps the menu while any role it holds is `true`. The safe side wins; the menu goes only when
  every role the login holds is off.
- **`roles` is Admin-only under RLS**, so the read is the service role after the login is known, for that login's own role
  keys only. A failed read keeps the menu: the menu is the state that needs no proof.
- **Coverage gate** (`scripts/check-menu-coverage.mjs`) reads "No unexplained orphans" on dev as of this PR. Count badges
  (My tasks, maintenance) already sit on the Maintenance tile; not rebuilt here.
- **Not done, on purpose:** the pages' own "back to Home" is the header button; no per-page back links were added.
