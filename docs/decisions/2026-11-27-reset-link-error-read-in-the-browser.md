# A refused email link is read in the browser, not in the callback route (#rcgle)

**2026-11-27.** A failed password reset showed "Google sign-in didn’t complete" on production.

## Why the read is client-side, and must stay there

Supabase reports a refused email link like this:

```
/login?error=google#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

Everything after `#` is a **fragment, which the browser never sends to the server**. So
`src/app/auth/callback/route.ts` and the server-rendered `src/app/login/page.tsx` cannot see
`otp_expired`; at that point a spent reset link and a failed Google sign-in look identical. **Moving
this into the route would bring the wrong message back.** `LoginForm.tsx` reads `window.location.hash`
once after hydration through `linkErrorFromHash()` (`src/lib/auth/link-error.ts`), shows our own
message with a *Send me a new link* button to `/login/forgot`, and clears both the fragment and
`?error=` so a reload shows nothing. `?error=google` with no fragment (the genuine Google path,
`src/app/login/actions.ts`) keeps the Google wording.

## The wording blames neither expiry nor the person

On 2026-11-27 a link failed five seconds after arriving, and a copy-pasted link worked: one-time links
can be **spent in the click path** (a mail scanner or browser prefetch opens them first). So the
message says the link "no longer works", explains links are single-use and some mail apps open them
first, and advises a new link and copy-paste. **No expiry setting was changed**; that was the wrong
turn this measurement ruled out.

`error_description` is **never shown**: it is text anyone can put in a link to our page. Only known
codes map to our words; anything else gets a generic line.

## The aal2 refusal

`changeOwnPassword()` (`src/app/account/password/actions.ts`) returned Supabase's raw "AAL2 session is
required…". It now maps `insufficient_aal` to words naming the way through (Security → authenticator
code → back). **The aal2 requirement itself is unchanged**: it stops a stolen mailbox becoming a stolen
account.
