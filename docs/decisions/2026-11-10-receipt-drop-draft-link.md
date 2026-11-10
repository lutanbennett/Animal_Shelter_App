# Receipt: the Email draft link is dropped; a Copy button carries the address (#pvpxz)

**Decided by Lutan, 2026-11-10:** *"The draft email link can be dropped."*

## Why the draft link went

It was a `mailto:` link. A `mailto:` carries an address, a subject and a body and
nothing else, so it could never attach the receipt PDF. Share (Web Share API with
the file) does attach it, and since #1446 it also passes the subject and message,
so on a phone the draft link did nothing Share did not do better.

## Why there is no Gmail-draft route for the computer

The only way to give a PC one press is to build the draft inside Gmail
(`users.drafts.create`). That needs the restricted `gmail.compose` scope, Google
verification and a security assessment that may carry an annual fee. Put to
Lutan directly; he closed it. Not priced, not built, not a follow-up.

## Share can never address an email

The Web Share API carries `title`, `text`, `url` and `files`. It has no recipient
field, so the share sheet hands Gmail a file, a subject and a body and the *To*
line is always empty. Lutan noticed this straight after the decision: the draft
link had been addressing the email. Deleting it with nothing in its place would
have been a regression.

## What replaced it

A **Copy email address** button beside Share, drawn only when the donor has an
email on record. It writes just the address to the clipboard (never a `mailto:`)
and says so ("Donor email address copied. Paste it into the To line."). The flow
is Copy, Share, paste into *To*. Reported as an error if the browser refuses the
clipboard, rather than failing silently.

## Strings

Removed from `en.ts` and `th.ts`: `email`, `emailHint`, `emailBodyNoFile`.
Kept: `emailSubject` and `emailBody`, which `share()` passes. Added: `copyEmail`,
`emailCopied`, `copyFailed`. The Thai for the three new strings is unreviewed by a
human, like other recent Thai.

## Button gate: found, not fixed

Copy reads data the page already shows and calls no server action, so it needs no activity of its own: the page itself requires `donation.receipt` (`requirePermission`). The other receipt buttons in `ReceiptCard` (I've sent it, Void, Retry Drive filing) are not individually gated by `can(perms, ...)` against the activity their server action asks. Found, not fixed: `src/app/management/donations/[id]/ReceiptActions.tsx`, each should ask the activity its action in `../actions` asks.
