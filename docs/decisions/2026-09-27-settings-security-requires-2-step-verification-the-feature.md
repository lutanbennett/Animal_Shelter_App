# 2026-09-27 — Settings → Security requires 2-step verification (the feature)

The feature half of the item whose schema half was `0100`. Security and the
eight actions behind it (create a login, approve or change a role, issue a
temporary password, archive, restore, delete, and the new reset) need a
session that has passed Supabase Auth's authenticator-app (TOTP) factor.
Nothing else in the app asks for it.

- **Measured on dev before building** (`scripts/check-two-step-session.mjs`,
  a throwaway admin, real GoTrue tokens): a password sign-in is `aal1`
  (`amr` password); after verifying a TOTP code the **same session**
  (same `session_id`) is `aal2`, `amr` totp+password; a refresh-token grant
  keeps `aal2` and the session; a new sign-in of the enrolled account starts
  at `aal1` with `nextLevel` `aal2`. Every Google (`oauth`) session on dev is
  `aal1` — so Google's own 2-step, whether on or off, is invisible to us, as
  the item said. The dev project has TOTP enroll/verify on, `jwt_exp` 3600,
  no session timebox and no inactivity timeout, so **`aal2` lasts until
  sign-out**: one code per sign-in, not per visit. The same run showed 0100
  holding with real tokens: that admin's own JWT updated 0 `user_roles` rows
  at `aal1` and 1 at `aal2`.
- **The step-up survives the proxy's refresh — checked in the browser too.**
  With the session cookie's `expires_at` pushed into the past, the next
  request through `src/proxy.ts` refreshed it: new `iat`, same
  `session_id`, still `aal2`, and Security stayed open.
- **The page redirects; the actions enforce.** `/admin/security` sends an
  `aal1` session to `/admin/security/verify`, but a server action can be
  posted without the page ever rendering, and these actions write with the
  service role, which bypasses 0100. So `refuseUnlessAdmin()` in
  `actions.ts` now checks `aal2` too, and all eight actions go through it.
  Tested by posting each action's id straight at the server from an `aal1`
  admin session: all eight returned the "needs your authenticator app"
  refusal, and the target login was afterwards still there, not archived
  and not on a temporary password.
- **The `aal` claim is believed only after GoTrue has checked the token.**
  `getAssuranceLevel()` passes the access token to
  `getAuthenticatorAssuranceLevel(jwt)`, which calls `getUser(jwt)` before
  decoding. Decoding the cookie alone would accept a hand-edited `aal2`
  (the cookie is the browser's). A forged token was tried: the proxy's own
  `getUser()` rejected it first and sent the request to `/login`.
- **The two verify actions are the only ones here without the `aal2` check**
  — they are how a session gets it. Neither can change anyone's access:
  setup adds a factor to your own login, a code raises only your own
  session. They still require an admin. A factor id from the form is used
  only if it is one of the signed-in login's own.
- **No recovery codes.** auth-js 2.116 has an MFA recovery-codes API, but
  behind `experimental.recoveryCodes` and not documented as available on
  hosted projects; not worth building on for four admins. The page says
  plainly there are none, and recovery is two routes instead:
  1. **Another admin at `aal2` presses Reset** in the new 2-step column. It
     deletes the login's TOTP factors with the service role
     (`auth.admin.mfa.deleteFactor`). Measured: the person's open `aal2`
     session drops to `aal1` at its next refresh — so within the hour the
     access token lives, not instantly. Resetting your own is allowed (to
     move phones while the old one still works; you proved you hold it).
  2. **Last resort, no admin can pass 2-step:**
     `node scripts/bootstrap-admin.mjs --env production --reset-2step <email>`.
     Before this, the script refused to run once any role existed, so this
     route did not exist (0100's entry flagged the gap). Tested on dev
     against an enrolled login: removed 1, and a second run says there is
     nothing to reset.
  Keep at least two admins enrolled so route 1 is always there.
- **`listUsers()` does not return factors** (measured: `undefined`, while
  `getUserById()` has them), so the Security page asks
  `auth.admin.mfa.listFactors` per login with a role, in parallel. Fine for
  a shelter's dozen logins; revisit if it ever lists hundreds.
- **Setup is a button, not something the page does on load**, so a reload
  or a prefetch never mints a new key. Starting setup first deletes any
  unconfirmed factor left by an abandoned attempt — GoTrue wants friendly
  names unique per login, and the QR code on screen should be the one that
  counts. The authenticator shows "Lanna Animal Care", with "(test)" or
  "(UAT)" on those databases, since an admin may have both on one phone.
- **Production:** TOTP enroll/verify is on by default on Supabase projects
  and was on for dev; production's setting was not read from this session
  (production reads are off-limits here). Check it before the deploy, or
  Security will refuse every admin with "couldn't start the setup".
