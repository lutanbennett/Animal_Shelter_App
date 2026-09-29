# 2026-09-29 — Request access: an explainer page, no `intent` flag, no name-and-note

- **No `?intent=request` flag.** The backlog item suggested one. It turned out
  to be unnecessary: Continue with Google with a role-less account already
  creates the unapproved `auth.users` row, and `src/app/auth/callback/route.ts`
  already refuses the session. The new `/login/request` page runs the same
  `signInWithGoogle` action as the sign-in page, so the callback is
  byte-for-byte unchanged and a "request" cannot do anything the ordinary
  refusal does not. A flag would have added the one thing worth auditing.
- **No name-and-note field.** Google already supplies a name, which Security
  shows beside the request (`user_metadata.full_name`). A free-text note would
  be `user_metadata`, which the user can edit themselves, shown to an admin who
  is deciding whether to grant a role — and, with the callback signing them out,
  there is no page to collect it on without a second step. Revisit if admins
  say they cannot tell who is asking.
- **Two `no_role` messages.** `login.errors.noRole` (Google) now says the shelter
  has been told and will approve them, hedged with "if you're new" because an
  archived account is refused at the same point and is not a request.
  `login.errors.noRolePassword` keeps the old "ask an administrator" wording:
  nobody requests an email login (admins create them), so telling that person a
  request is pending would be false.
- `/login/request` is added to `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS`; it shows
  the shelter's email from Settings → Website, or nothing if none is set.
- The email-to-admins on a new request (item 4) is left out: System status
  already shows the count and every admin gets a My tasks entry (#200).
