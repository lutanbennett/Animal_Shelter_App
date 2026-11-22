# The Drive alert says only what a shelter Admin can act on, and only when the token is really theirs to fix (#dalrt)

## What happened
2026-11-22 07:15 UTC: test's Worker, without `DRIVE_CREDENTIALS_KEY`, could not decrypt a stored credential, recorded the token `dead`,
and mailed the Admins "Google said: DRIVE_CREDENTIALS_KEY is not set". Our own configuration fault, in Google's name, naming a secret.

## Fix 1: the wording (`deadAlertBody`, `src/lib/google/shelter-drive-alert.ts`)
Standard: say what the reader can act on and nothing else. No internal identifier, nothing attributed to Google. The mail says the
connection has stopped, that uploads fail until it is reconnected, and to open Settings and reconnect the Google account. The technical
reason is logged (`drive-tokens: ...`) and stored in `last_error`, which the Admin status page already shows. One mail when it breaks,
one when it recovers, once only (`dead_alerted_at`) are unchanged.

## Fix 2: the classification (`classifyCredentialError`)
Rule: can we tell? No -> `unknown`, no mail, log loudly. Is their connection broken? -> mail, plain words.
`DriveCredentialsError` now carries `fault: "ours" | "theirs"`, default `ours`, so a new throw site that forgets to say is silent, not alarming.

| # | error | fault | result |
|---|---|---|---|
| 1 | key not set | ours | unknown, logged |
| 2 | key not valid base64 | ours | unknown, logged |
| 3 | key not 32 bytes | ours | unknown, logged |
| 4 | stored value not in the expected format | theirs | dead, mailed |
| 5 | could not be decrypted (wrong key or altered) | ours | unknown, logged |
| 6 | row incomplete (client id, secret or token missing) | theirs | dead, mailed |

**Number 4 (the one on the line):** the value does not parse at all. That could be corruption we caused, but nothing we hold can read it
and reconnecting rewrites it, so "reconnect" is the true instruction; it is mailable.
**Number 5:** the most serious on the list (wrong key or tampering) and the only remedy is ours, so it is never mailed to a shelter; it is
logged at error level every run until fixed. A missing key therefore stamps nothing, and the next run with the key present answers for real.
`probe()`'s Google-response branch is unchanged: a genuine `invalid_grant` is still `dead` and still mails.

## Not changed
- `shelter-drive-decide.ts:26` and `:59` (`not configured`, `not connected yet`) cannot reach `probe()`, which calls `credentialsFromRow` directly.
- `src/lib/status/alerts.ts` and the route: untouched. The calendar equivalent: not touched; it shares the shape and `#drvcl` owns it.
- The environment half (keys on Workers) is `#83137`'s. This change depends on no key being present anywhere.
- Mail is not made quieter for a genuinely dead token.
