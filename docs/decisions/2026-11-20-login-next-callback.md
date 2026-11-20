# 2026-11-20 — `?next=` kept off the OAuth callback URL (#nxtqs, fix a)

**Fault.** `signInWithGoogle` put `?next=<path>` on the redirect URL it gave Supabase. Supabase matches the whole URL against exact allow-list entries; a miss is not an error, GoTrue substitutes `SITE_URL`. Every arrival through the front door carries a `next`, so every Google sign-in was thrown to the shelter's address.

**Chosen: a short-lived cookie.** `auth_next`, httpOnly, SameSite=Lax, `secure` on https, path `/auth/callback`, 10 minutes. The URL handed to Supabase is now always `${origin}/auth/callback` (`callbackUrl()` in `src/lib/auth/next-cookie.ts`). The callback reads the cookie, falls back to a legacy `?next=`, runs `safeNextPath()` on whichever it uses (on read, not only on write), and deletes the cookie on success. `signInWithGoogle` overwrites or deletes it on every start, so a stale value cannot steer a later sign-in.

**Forgot-password** (`src/app/login/forgot/actions.ts`) uses the same mechanism. A recovery link under PKCE already needs the browser that asked for it (the code verifier is a cookie there), so a cookie loses nothing.

**Two tabs.** The cookie is per browser, like the PKCE verifier beside it, so two simultaneous sign-ins already collide on the verifier; last one started wins and neither can go anywhere unsafe. Not worse than before.

**Ruled out.**
- (b) a wildcard allow-list entry per host: dashboard change, widens what sign-in accepts, forgotten on the next domain.
- Carrying it in OAuth `state`: GoTrue owns `state`; we cannot set it.
- A fixed per-destination callback path: allow-list entries are exact, so every destination would need an entry.

**Not proved.** A real Google sign-in cannot be driven from a worktree. Outstanding and Lutan's: sign in with Google from `/login?next=/residents` on a real address and read the address bar.
