# 2026-09-25 — Public viewer is a role, not an archived row (`0085_public_viewer_role.sql`)

Testers need to sign in to the locked UAT/test sites (#123) and then see
exactly what a visitor sees. The account is a new `app_role` value,
`public_viewer`, not an ordinary login left archived or role-less, even
though all three have the same database access (none):

- **An archived row is one click from a real role.** Restoring it in
  Settings → Security clears `archived_at` and gives back the old role
  (it has to be a real one, since `role` is not null). A `public_viewer` row has no staff role
  to fall back to.
- **It reads as what it is.** In the Users table an archived tester looks
  like a former staff member. A role-less login is refused by Google sign-in
  and, once the feature half lands, by password sign-in too. `public_viewer`
  is non-null, so it signs in, and it gets its own label.
- **"No access" comes from the allow-lists.** Every RLS policy and role
  guard names the roles it admits, so a value none of them names matches
  nothing. `0086` makes the one place that did not work that way work that
  way too (next entry).

The value has a file to itself because the runner applies each file in one
transaction, and a value cannot be used in the transaction that adds it.
The app side (the picker, landing on `/`, a public viewer treated as signed
out on the public pages, and refusing archived accounts at password sign-in)
is the feature stream `public-viewer-login`.
