# 2026-10-02 — Sign-up bounds: what was already shipped, Deny's guard, and what stays with Lutan

The backlog item (WEB-3, WEB-4) was written before af98a14 (2026-10-01), which
had already done most of the code half. Checked against the code on this
branch rather than assumed:

- **Pagination (done).** `listAllUsers()` pages 200 at a time; Security and the
  System status count both use it, and `countSignIns` in `lib/status/usage.ts`
  loops its own pages. No call to `listUsers` reads only page 1.
- **First sign-in prompt and highlight (done).** My tasks shows a banner to an
  admin with no authenticator; `UsersTable` flags admins with `twoStep: false`.
- **A password-only session enrolling its own authenticator (done, and in
  scope).** `startTwoStepSetup` refuses unless another admin (or
  `bootstrap-admin.mjs`) opened a set-up window for that login. Decided in
  af98a14; recorded here because the brief asked for the answer to be findable.

What this change adds:

- **Deny is guarded on the server.** It called `deleteUser`, so an access
  request approved in another tab a moment earlier could be deleted from a
  stale page. `dismissAccessRequest` looks for a `user_roles` row and refuses
  with "given access since this page loaded". The role table is the test for
  "orphan" everywhere else (`accessRequestsAmong`), so the guard uses the same
  definition. The confirm now says the sign-in is deleted for good.
- **Newest first** by first-seen time, not last attempt, so a burst of junk
  sign-ups sits together at the top instead of reshuffling when one retries.

Not done, deliberately:

- **Refusing the admin role until the person has enrolled.** It could lock out
  the only admin, which is worse than the finding. The banner, the highlight
  and the admin-opened set-up window are the safe core; a hard refusal needs
  Lutan's answer on the lockout case first.
- **Turning off open sign-up / restricting Google to the shelter's domain** is
  a Supabase console setting on dev and production, Lutan's, listed in the
  test plan's handover table beside the Supabase/Cloudflare/Google checklist
  and WEB-11's inactivity timeout.
