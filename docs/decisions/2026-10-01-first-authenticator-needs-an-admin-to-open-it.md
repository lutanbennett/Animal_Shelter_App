# 2026-10-01 — A first authenticator app needs an admin to open it (WEB-3, WEB-4)

## The hole

`startTwoStepSetup` / `confirmTwoStep` let any admin session enrol an
authenticator app, including a password-only one. An attacker with a stolen
password for an admin who had never opened Security could enrol *their own*
app, get `aal2`, and own Security — and the real admin was then the one
asked for a code they did not have.

Measured on dev before building: a password-only session can call
`supabase.auth.mfa.enroll` and `verify` **directly against GoTrue** with the
public anon key. Refusing in our server action alone would therefore have been
theatre; the rule has to be in what Security *believes*, not only in what the
button allows.

## The rule

- **A first set-up needs a window opened from outside that session**:
  `app_metadata.two_step_setup_until` (service-role-only to write). Opened by
  another admin at `aal2` (Security → *Allow set-up*), automatically when an
  admin role is granted (create login, approve a request, change a role) or
  when someone's 2-step is reset (three days), or by
  `bootstrap-admin.mjs --allow-2step-setup <email>` (and the first admin
  bootstrap opens it) for when no other admin exists.
- **Confirming inside the window binds the app**: `app_metadata.two_step_factor`
  = that factor's id, and the window closes.
- **Security believes only a bound app**, or one created before
  `RULE_STARTS_AT` (2026-10-01). `getAssuranceLevel()` downgrades an `aal2`
  earned with any other app to `aal1`, and the 2-step column counts only
  trusted apps. So the direct-to-GoTrue enrolment above gives the thief a
  verified factor that opens nothing. *Allow set-up* also deletes such
  leftovers so the real person starts clean.
- Apps from before the rule are grandfathered by `created_at`, because making
  every existing admin enrol again would lock them all out on deploy.

Checked on dev against real GoTrue: a password session enrolled and verified an
app at `aal1`; `trustedTotpFactors` returned 0 for it, and 1 once the factor id
was bound in `app_metadata`. In the browser a throwaway admin saw the reminder
on My tasks, the closed-set-up page, then the Start button once the window was
opened, and a correct code landed on Security.

## Not done: refusing the admin role until enrolled

The brief's optional item. Not built: the only-admin case is the failure mode
(a role change that locks out the sole admin), and the rule above already
means a new admin holds no Security power until they have an app that an admin
vouched for. Recovery paths that exist: another admin's Reset / Allow set-up,
and `bootstrap-admin.mjs --reset-2step` / `--allow-2step-setup`.

## Still Lutan's (dashboard, not code)

*Turn off open sign-up* (or restrict Google to the shelter's domain) in
Supabase — the same item as the assessment's "Supabase, Cloudflare and Google
checklist", so it is not done twice. No app code stands in for it. The
Request-access flow still yields only an unapproved `auth.users` row; Deny
(already on the queue) deletes that row, and the queue is newest-first.

## Paging

`listUsers` returns one page without saying there are more. `listAllUsers()`
pages until a short page; Security and the access-request count use it.
Measured on dev: with 205 logins the single call returned 200 and
`listAllUsers` 205.
