# The header shows "name · role"; the name lives in `user_metadata`, not a table

2026-10-07, `claude/header-name-role`. Backlog: "Show 'Signed in as Lutan · Admin'
in the header instead of the email address". All four build points shipped, with
no migration (`0154` belongs to `see-translations-cell`, and only one branch may
carry a migration).

## Storage: `user_metadata.full_name`, the key the view already reads

`private.app_users.display_name` (0126, re-created in 0146) is
`coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')`. It is
**derived, not a column**, so there is nothing to make writable: writing
`full_name` into a login's `user_metadata` changes `display_name` in the view, and
so in every picker that goes through `appUserLabel()` (maintenance assignees,
recurring jobs, deliveries' "recorded by", My tasks), with no change to any of
them. Recent changes reads the same two keys itself, so it agrees too.

Why not a profile table: nothing in the database needs to *join* on the name
beyond the view, which already does it; a table would have meant a schema PR
ahead of the feature and a second source for the same fact. This is the point at
which the answer would have changed: a policy, view or report that must filter or
sort on the name in SQL. None does today.

- **Who writes it.** An admin: `setUserName()` and the Name box on create-user, in
  `src/app/admin/security/actions.ts`, using the service role like every other
  action there, behind `refuseUnlessAdmin` (admin role *and* 2-step). The admin API
  **replaces** `user_metadata` wholesale, so the action reads it first and writes
  it back through `withName()` — otherwise setting a name would delete whatever
  else was in there. The person themselves: `changeOwnName()` beside Change
  password, through their own session (`auth.updateUser({ data })`, which merges,
  and a `null` removes a key).
- **Clearing** removes both `full_name` and `name`, or Google's `name` would show
  straight back and the field would look broken.
- **`appUserLabel()` was reused unchanged.** The header does not call it (it has
  the session's `user`, not an `app_users` row) but reads the same two keys in the
  same order through `userNameOf()` in `src/lib/auth/user-name.ts`, so there is
  one rule written twice rather than two rules. Length is capped at 60 and
  whitespace collapsed (`normaliseName`).

## Known limit: Google may put its name back

Supabase refreshes `user_metadata` from the Google profile when someone signs in
with Google. A name an admin gives a Google login can therefore be replaced by
Google's at their next sign-in. This was **not** reproduced (it needs a real Google
sign-in), so it is recorded as expected behaviour from how the provider works, not
as something measured. It matters little in practice: Google logins start with a
real name, and the editable name exists for password logins and test accounts. If it
turns out to bite, the fix is a separate key (`custom_name`) that the view prefers
over `full_name`, which *is* a migration.

## The header: name · role, email in a menu

`Lutan · Admin`, with the **role's display name, not its key**: a built-in role from
the dictionary (so it is Thai on a Thai page), a configured one from
`roles.name` / `name_th` as `my_permissions()` returns them. A login with no name
shows its email. Tapping it opens `AccountMenu`: name, role, **the email** (the
thing a name cannot tell you, and the whole reason for this item: three test
accounts all called Lutan), a link to Change password / name, and Sign out.

**On a phone it gets its own row under the header.** Beside the buttons it needed
about 120 px and the header already filled 375 px: `check-phone-width.mjs` failed
every role in both languages (48–90 px of sideways scroll) on the first attempt.
Truncating to fit left too little to read, so below `sm` the menu button sits
right-aligned on a second line (`order-last basis-full`), and from `sm` up it is
inline between the language switch and Sign out as before. **No button was
resized** — Open menu, Assistant and Sign out keep their geometry (Lutan's pending
question 11).
