# 2026-09-26 — Drive failures are told in words, and Settings checks the token

On 2026-09-25 the Drive refresh token expired (the client's project was still
in Testing) and a manager saw Google's text on the Shelter Friend card:
"Google OAuth token refresh failed: invalid_grant: Token has been expired or
revoked." Nobody knew until then, and every upload on UAT was failing.

- **Two kinds of Drive failure, told apart in `drive.ts`.** A token-endpoint
  `invalid_grant`, `invalid_client` or `unauthorized_client`, or a missing
  `GOOGLE_OAUTH_*` variable, throws `DriveNotConnectedError`, a subclass of
  `DriveApiError`, so existing `instanceof DriveApiError` checks still hold.
  Only an admin minting a new token fixes one of those, and nothing a user
  does or retries will, so the user is told "Photo storage is not connected —
  tell an admin." Any other Drive error is one refused call and gets "try
  again in a minute". Other token errors (a 5xx, a rate limit) are
  deliberately *not* "not connected": they pass on their own, and telling
  staff to fetch an admin for them would teach them to ignore the message.
- **One helper, `driveErrorMessage()` in `drive-errors.ts`**, used by every
  path that used to hand `err.message` to a user: the Shelter Friend logo,
  the Website page's photos and the project/maintenance folder syncs. Google's
  text goes to the server log instead. Non-Drive errors pass through
  unchanged, because the Website page throws its own validation messages
  from the same `try`.
- **The upload routes are wrapped (`withDriveErrors`)** rather than each
  getting its own `try`. They used to let a Drive error escape as a bare 500,
  which the uploaders could only show as "Upload failed (500)." They now
  answer `{ error }` with 503 (not connected) or 502 (Drive refused), which
  the uploaders already show. Anything else is rethrown as before.
- **"A failed logo upload throws away the form" was not what happened.** The
  logo uploads the moment it is chosen, as its own action, and the draft is
  client state that survives it. Checked on dev with a deliberately bad
  token. What went wrong was *where* the message showed: below Save, a screen
  away on a phone, so the upload seemed to do nothing. The card's message now
  says which control it belongs to, and the logo's shows under the logo.
- **The token check is on Settings, not the admin email or a cron.** The
  deployed Workers' secrets can't be read back, so the check has to run
  inside the Worker, and `/admin` is where an admin already goes. It mints a
  fresh access token rather than trusting the cache, because a cached one
  can outlive a revoked refresh token by up to an hour, then reads the root
  folder. It sits in `<Suspense>` so the tiles don't wait on Google. The
  release smoke test gains a line for it.
  `scripts/check-drive-token.mjs` asks the same of a local env file, or of a
  newly minted token before it goes in as a secret. Read-only, unlike
  `google-drive-verify.mjs`, which writes a test file.
