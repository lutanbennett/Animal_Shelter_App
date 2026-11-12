# Admin's "open the home screen for…" switch moves into Who does what (#vdeof)

2026-11-12, `claude/admin-home-simulation-subpage`. No migration, no card.

- **Where it lives:** a new route, `/admin/who-does-what/simulate`, beside `details` and `features` (Who does what
  already routes, so a route rather than a panel). Admin only: the page asks `if (!perms?.isAdmin) refuseFor(perms)`,
  the same refusal `/home/[role]` asks. Admin sits outside the card system (CLAUDE.md, 2026-10-25), so no card was
  invented; the link to it on Who does what is drawn only for Admin (courtesy; the page refuses everyone else itself).
- **`HomeSwitch` and `listHomeRoles()` are reused unchanged.** `current` is `""` here: nothing has been opened yet, so
  no chip should read as the current page. (The Settings chip still goes to `/admin`.)
- **`/admin` lost the chip row.** `listHomeRoles` and `HomeSwitch` imports went, and so did the `supabase` handle that
  only fed them.
- **The way back (deliverable 4):** `/home/<role>` now has a "Back to Who does what" link that returns to the sub page
  (not `/admin`), because that is where a person arrives from; the sub page's own link returns to Who does what.
  The switch on `/home/<role>` is kept so you can step role to role.
- **What it does not do, wording reused:** the sub page says *"You stay signed in as Admin: a tile you follow opens its
  page with Admin's access, not the role's"*, the sense of `/home/<role>`'s existing sentence (*"…as the role sees it. You
  are signed in as Admin."*). The manual's Who does what topic says the same, and points at Details for what a role
  can really do. `grep -c UNASSIGNED src/lib/manual/en.ts` is `0`. English only (no `th.ts` exists).
- **Registries:** the new path is in `WRAPPED_WRITE_PATHS`, `check-permission-catalogue.mjs` (guard recorded) and
  `check-phone-width.mjs`.
- **Thai** strings are new and unreviewed by a Thai speaker.
- **Logins driven (dev, port 3001, clicked through):** `--cards residents` → `/home/management` and
  `/admin/who-does-what/simulate` both land on "You don't have access to this page" (`/no-access`); `admin` → Settings has
  no chip row, Who does what shows the link, the sub page lists Settings and every role, Management opens, and the back
  link returns to the sub page. Phone width (375px) wraps. The pane's `requestAnimationFrame` never fired on the
  direct loads, so the Admin pass was click-through only.
- **Found, not fixed:** `tsc` in this worktree reports `PageProps`/`LayoutProps` not found until Next's types are
  generated; the gates run does that.
