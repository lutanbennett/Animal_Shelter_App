# Google Cloud facts come from a live stocktake, and clients are named by redirect URI (2026-10-09)

Lutan, 2026-10-07, after a `GOOGLE_SIGNIN_CLIENT_SECRET` rotation went wrong three
times: *"next time let's start with a full stocktake of all Google accounts and
clients first."* Done 2026-10-09. The results are in section 1 of
`docs/google-cloud-inventory.md`.

- **Section 1 of the inventory is now what the console showed**, every account,
  project and client, read-only, on 2026-10-09. The 2026-09-30 version marked most
  Google facts `[CONFIRM]`, and a session still read them as settled and sent
  Lutan to the wrong client. Before acting on the inventory, check its stocktake
  date. If it is old, re-read the console first. It is cheap, and changing the
  wrong client is not.
- **A client is identified by its redirect URI, not its name.** LCA App holds two
  web clients with the *same* production redirect URI (`…bjgla5…`, live per the
  Supabase Management API, and the April 2025 `…drg7qt…`). Their names ("Lanna Care
  sign-in (production Supabase)", "Web client 1") would not have revealed that.
- **The rotation table in the inventory says which account, project and client to
  open for each secret.** That table is what a rotation should follow.
- **Google now locks the Cloud console for accounts without two-step
  verification** (from 2026-10-03). `lannaanimalfoundationbwm` was locked until
  Lutan turned it on on 2026-10-09. Any account that owns a project needs 2-step
  verification kept on.
- **Not decided here:** deleting `…drg7qt…` and disabling the 2026-10-07 extra
  secrets. Both are part of the rotation itself, which stays Lutan's (backlog
  "Two exposed secrets to rotate").
