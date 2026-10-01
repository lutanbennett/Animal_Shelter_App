# Sessions stay long-lived on purpose; a 60-day inactivity timeout ends a lost phone's (2026-10-01)

Backlog item WEB-11 (Info) from the security assessment.

**Decision.** Sessions are meant to last. The auth cookie is good for 400 days
and there is no time-box, because the people who use this app are volunteers
and staff on their own phones who should not have to sign in again every week
at the gate. That stays. What is added is an **inactivity timeout of 60 days**,
set in the Supabase dashboard (Authentication → Sessions → *Inactivity
timeout*) on **dev and production separately**. A phone used weekly never
reaches it; a phone that is lost, sold or left in a drawer signs itself out
about two months after its last use, instead of holding a staff session for
more than a year.

**Why not shorter / why not a time-box.** A time-box (sign in again every N
days regardless of use) punishes the weekly user for the benefit of the
stranger who holds a stolen phone, and the stranger is the rarer case. An
inactivity timeout costs the active user nothing. 60 days is longer than any
holiday or quiet spell a regular volunteer takes, and short enough that a lost
device is not a standing risk.

**The setting is a dashboard switch, not code, and it is not on yet.** It is
the owner's to turn on, per environment. Until it is, nothing changes.

**What the code does when it fires (this PR).** Turning the timeout on means
Supabase starts refusing refresh tokens for the first time. The first request
a timed-out user makes finds the refresh rejected and the auth cookie cleared.
Before this change the request proxy bounced them to `/login?next=…` as if
they had never signed in — the `next` path survived, but with no explanation
and with the dead cookies left on the browser, so `/login` retried the dead
token on every load. Now `src/lib/supabase/proxy.ts` notes whether a Supabase
auth cookie was on the request *before* `getUser()`; when it was and there is
no user afterwards, the redirect adds `error=expired` (the login page shows
"you were signed out because you haven’t used the app for a while…", English
and Thai) and carries the cleared cookies. A visitor who never signed in sees
no message. `?next=` goes through `safeNextPath` on the way back, as before.

**Known limit.** The test is "had a cookie, has no user", which also holds if
Supabase is unreachable for that one request; the user then sees the expired
message although the cookie was not cleared, and signing in again fixes it.
Telling the two apart would mean inspecting the auth error's status in the
proxy; judged not worth it for a rare network blip, and the offline banner
(`confirm-dialogs-offline`) owns "the network is down" — an expired session
only ever shows on a navigation that reached the server.

**Verified** by sending a request with a Supabase auth cookie holding an
expired access token and an invalid refresh token: 307 to
`/login?next=…&error=expired` with the cookie cleared; the same request with
no cookie gets `/login?next=…` alone. Not reproduced against a genuinely
inactivity-expired token, because that needs the setting on and 60 days to
pass; Supabase answers both with the same refresh error.
