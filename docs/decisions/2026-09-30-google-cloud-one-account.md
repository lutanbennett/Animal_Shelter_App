# Google Cloud goes under the shelter's own account, and moves once (2026-09-30)

**Status: proposed by the `google-cloud-one-account` stream; Lutan confirms.**
Inventory and runbook: `docs/google-cloud-inventory.md`. Nothing has been moved;
the account actions are Lutan's.

- **Owner:** `lannacareforanimals@gmail.com`, for the Cloud project and the Drive
  files, in one new project holding the Drive client and both sign-in clients,
  consent screen published. Today's split (sign-in in Lutan's `LCA App`; Drive and
  dev sign-in in `lanna-care-dev` under `lannaanimalfoundationbwm`) means the
  shelter's login and files depend on two people's personal accounts, and finding
  which project held what cost a long session on 2026-09-25.
- **One move, not two.** The move creates a new Drive client, and "Give production
  its own Drive tree" mints a new refresh token for the shelter account anyway;
  done together the token is minted once. Sign-in moves at the domain cutover,
  which already rewrites its redirect URIs and authorised domains, so that client
  is edited once.
- **The gate is the account, not the work.** If the shelter account does not yet
  exist the runbook waits, rather than moving to another personal account and
  again later.
- **The consent screen is published before any token is minted.** A new project
  starts in Testing, which expired every Drive token after 7 days on 2026-09-25.
- **Open, for Lutan:** whether UAT/dev/test also move to a client in the new
  project or keep the old one until it is retired (runbook step 12); and a second
  owner on the new project.
- **Checkable, not just written:** `scripts/check-drive-token.mjs` now prints the
  Cloud project number and the Drive account a token acts as. Run against
  `.env.local` on 2026-09-30 it reported project number `1036347359893` and
  `lannaanimalfoundationbwm@gmail.com`, matching the recorded inventory.
- **Not found:** the 90-day token expiry stays open; the inventory lists where to
  look while in the consoles.
