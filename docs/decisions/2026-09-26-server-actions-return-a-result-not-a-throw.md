# 2026-09-26 — Server Actions return a result, not a throw

Settings → Security showed "Minified React error #441" when Delete was
refused. #441 is what the browser gets for *any* error thrown from a
Server Action in a production build: React strips the message, so a
`throw new Error(t.admin.security.errors.cantDeleteOwnAccount)` has never
shown its words to anyone — the code read as correct and the admin got a
number. A dev server shows the real message, which is how it went
unnoticed.

- **The convention, for this page now and every Server Action after it:**
  return `ActionResult` from `src/lib/action-result.ts`,
  `{ ok: true, …extra } | { ok: false, error }`. A refusal that can happen
  in normal use (not an admin, your own account, invalid role, email
  taken, has records) is returned with its own words in en and th. A
  failure nobody planned for is `unexpectedFailure()`: the raw error goes
  to the server log (the Worker logs in production) under an 8-character
  reference, and the person reads "Something went wrong … reference
  ab12cd34", so what they report can be found. `runAction()` wraps the
  body so a stray throw becomes that too, and lets Next's own
  `redirect`/`notFound` through (`unstable_rethrow`). The client still
  catches, but only for the call itself failing (offline), and shows its
  own fallback words rather than the error's message.
- **The refusals are unchanged.** Same checks, same order, same
  outcomes; only how a refusal reaches the screen moved.
  `assertAdminRole()` is kept for the other admin pages until the sweep;
  `hasAdminRole()` is the non-throwing check it now uses itself.
- **Delete of a login with records says so, and does not change the
  foreign keys.** About twenty FKs to `auth.users` (`created_by` from
  0001, `uploaded_by`, `updated_by`, …) have no delete rule, and that is
  right: who recorded what is the history, and `on delete set null` would
  erase it. Archive (0063) is the tool for someone who left; Delete is for
  logins with no history. GoTrue reports the FK refusal only as
  "Database error deleting user" (no code), so that message maps to
  "This person has records in the system … Archive them instead." It is
  still logged, in case it is ever something other than a foreign key.
  Counting references first, to hide Delete up front, would need a
  `security definer` function and so a migration; not worth one while
  the answer after the click is readable.
- **The rest of the app is the follow-up, not this PR** (the item's
  part 2, on the backlog): the other `"use server"` files still throw for
  ordinary refusals and still show #441. They should adopt this same type
  rather than the four near-identical shapes that already exist
  (`FriendActionResult`, `ProjectActionResult`, …).
