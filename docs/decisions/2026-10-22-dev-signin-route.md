# 2026-10-22 — Streams sign in to dev with `scripts/dev-signin.mjs`, not Google and not a Redirect URL

Two streams in two days (`purchasing-to-buy-first`, `who-does-what-add-group`) recorded their browser
check as "no signed-in session"; the second carried the planner's sign-in block and failed anyway.

- **Why the block failed.** It sent streams to Google sign-in, which needs each worktree port's
  `/auth/callback` added to the dev project's Redirect URLs by a person, and told them to find a
  password, which `DEV_TEST_USER_PASSWORD` refusal rules out. Neither step was one a stream could do.
- **What works.** Password sign-in through the app's own cookie client never uses `/auth/callback`,
  so no Redirect URL is involved. `scripts/dev-signin.mjs <role> --port N` keeps one disposable login
  per role (`dev-signin-<role>@example.invalid`, dev project only — it refuses any other ref), resets
  its password to a random value it never prints, signs in, and prints a snippet that sets the
  session cookies in the browser pane. Proven 2026-10-22 on port 3013: header read
  `dev-signin-admin@example.invalid · Admin`, and `/management/purchasing`, `/admin/who-does-what`,
  `/admin/diets` and `/admin/security` all opened. A second run for `management` took the reuse path.
- **Nothing is relaxed.** No change under `src/`, no bypass flag, no dev-only policy. It is the real
  sign-in with a real (disposable) account, the same pattern as `check-access-requests-card.mjs`.
- **Limits, written into `CLAUDE.md`.** aal1 only (a page that demands the 2-step redirects to it);
  the snippet is a live session token; cookies are per host so the browser holds one role at a time;
  the dev database is shared across streams. Roles come from the `roles` table, and `staff` is retired.
- **Not tried: the Redirect URL batch (option b).** Unnecessary now, and it needs Lutan's console.
- **The planner's +30k browser allowance is restored but unproven.** One stream has used the route.
  `plan-day` now says to check whether the next batch's streams actually drove the browser.
