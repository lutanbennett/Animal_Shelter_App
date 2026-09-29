# 2026-09-26 — The public viewer, app side: one allow-list, checked in the proxy

The feature half of "A Public viewer login" (`0085`/`0086` were the schema
half, #128).

- **One allow-list in the app, the same one as the database.**
  `src/lib/auth/app-access.ts` holds `APP_ACCESS_ROLES` (admin, management,
  staff, vet, volunteer), matching `private.has_app_access()`. Everything else a
  session can be — archived, never given a role, `public_viewer`, or a role
  added later — is outside the app until someone adds it there. Checking
  `role === "public_viewer"` would have been shorter and would have let the
  next new role straight in.
- **The proxy is where app pages are refused.** A signed-in request for a
  non-public path looks up `current_user_role()`: a public viewer is
  redirected to `/`, a session with no role at all is signed out and sent to
  `/login?error=no_role`. There is no app route group to put a layout guard
  on, and the proxy already gates signed-out visitors by the same path list.
  Cost: one RPC per app request. Public pages skip it (a visitor or public
  viewer is exactly who is there), and so does `/account/password`, which a
  public viewer on a temporary password must still reach. The redirect
  carries the cookies the Supabase client set, or `signOut()` would clear
  nothing in the browser.
- **An archived session ends at its next app request.** Before this, archiving
  someone stopped their data access (RLS, and `0086` for the views) but a
  session they already held still opened app pages and got past the UAT lock.
  Now it is signed out on the next app page. On the public pages a stale
  session is left alone: they are what a visitor sees anyway, and looking up
  the role there would cost every public page view an RPC.
- **Password sign-in refuses what Google sign-in refuses.** `login()` checks
  `current_user_role()` after `signInWithPassword` and signs out a login with
  none. The message is now "This account doesn't have access", not "This
  Google account…", since both routes show it.
- **Where a public viewer lands.** `/` by default, including over `?next=` for
  an app page; but a public `?next=` (a resident card or enclosure QR code
  scanned on the locked site) is honoured, so the scan still resumes after
  sign-in. The password-recovery link's `?next=/account/password` is honoured
  for everyone.
- **What a public viewer sees.** The public header shows Sign out where staff
  see "Open the app" — a visitor's "Login" link would bounce a signed-in
  viewer back to `/`, and it needs some way out. `/r/` and `/e/` show the
  public card instead of redirecting into the app. The app menu is hidden on
  `/account/password`, the one app-chrome page it reaches. Kept small because
  batch 2's `public-site-shell` reworks `PublicHeader`.
- **Picker placement.** Public viewer is last in every role dropdown (create,
  change, approve an access request), after the staff roles, so it is never
  the one picked by habit.
