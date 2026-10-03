# Changing your password now proves the current one, on the server

2026-10-03, `claude/password-change-current`, finding F-22 of the staff dry run.
The dry run graded it *polish*. It is an account-takeover hole: staff are about
100% on phones (Lutan, 2026-10-03), sessions are deliberately long-lived (400-day
cookie, and WEB-11's 60-day inactivity timeout is still off), so a found, unlocked,
signed-in handset is the ordinary case. `auth.updateUser({ password })` does not ask
for the old password, so the page's two boxes were the only gate and there was no gate.

## Re-authenticate inside the action, not in the form

`changeOwnPassword` (`src/app/account/password/actions.ts`) signs in with the
submitted current password on a **throwaway** `supabase-js` client
(`persistSession: false`) before it calls `updateUser`. A browser-side check would
pass the two UI cases and fail the one that matters, because anyone who can post to
the action skips the browser. The action fails closed: a missing field, an account
with no email, or a sign-in that errors for any reason other than "invalid
credentials" all refuse the change and say nothing was changed.

Two traps found while testing, worth keeping:

- The throwaway client must end with `signOut({ scope: "local" })`. The default
  scope is **global**, which revoked every session the user had, including the one
  making the request (the next `updateUser` answered "Auth session missing!").
- Ending the verifier's session at all matters: otherwise each password change
  leaves a second live session behind.

## Who is exempt, and how the server knows

`requiresCurrentPassword(user, accessToken)` in `src/lib/auth/password-change.ts`.
Two flows legitimately have no current password to give:

1. **The forced change after a temporary password** — `app_metadata.must_change_password`,
   which only the service role can write. The person signed in with the temporary
   password moments ago.
2. **A fresh recovery-link session** — the newest `amr` entry of the access token is
   `otp` (measured on dev: a recovery session's `amr` is `[{"method":"otp",...}]`)
   and no more than 30 minutes old.

Both are read from the session, **never from the form**. The `continue=1` field and
`?reset=1` only decide where to go afterwards; a request that forges them gets
asked for the current password like anyone else. The `amr` decode is not a
signature check (the caller has just run `getUser()`), and unlike
`signedInWithPassword`, anything unreadable counts as *not* recovery, because "yes"
here waives the check.

Residual: someone who can *both* find a signed-in phone *and* read a recovery email
could still reset; that is the email account's problem. A signed-in Google account
has no password to prove, so it is asked for a current password it does not have and
is refused with the "sign out and use Forgot password?" route. That is deliberate: a
found phone signed in with Google must not be able to mint a password either.

## Other sessions: signed out, and the page says so

Supabase keeps every other session alive after a password change by default; measured
here (a second session signed in by script was still valid until we revoked it). Someone
changes their password *because* they think another device has the account, so
surviving sessions would make the change do less than it promises. After
`updateUser` the action calls `signOut({ scope: "others" })`; if that fails the
person is told the password changed but other devices could not be signed out.
Success reads "Password changed. Your other devices have been signed out." The
manual and release notes say the same. This session is kept, so the person is not
thrown to the sign-in page by their own change.

Cost accepted: someone with a phone and a laptop is signed out of the other one
and signs in again. Short, and it is the point.

## Labels

The heading said *Change password* and the button said *Set password*. The page is
reached by choice from the menu (*Change password*), so the button now says
**Change password** (Thai: เปลี่ยนรหัสผ่าน). The forced and reset headings, which
say *Choose your password* / *Choose a new password*, keep the same button: it is
still the action the person is taking.

## Form behaviour (F-10 must not return)

React resets a `<form action>`'s fields after every submit, so a refused change
emptied all three boxes. The form is now controlled and submits from `onSubmit`
(through `useActionState`), and clears the fields only on success. It posts with
`method="post"` so a submit before hydration cannot put the passwords in the URL
(it did, once, in testing: the pane was hidden and hydration was stalled).
Progressive enhancement without JavaScript is gone for this one form; the page
needs JS for everything else anyway.

## Not done, on purpose

- F-12 (the sign-in page's raw "Invalid login credentials" and emptied boxes) is
  untouched. The same controlled-fields fix applies there, and the wrong-password
  message added here (`currentWrong`) is the wording to match when that stream
  does it.
- Settings → Security and the 2-step rules belong to the roles paper (3001).
- No migration.
