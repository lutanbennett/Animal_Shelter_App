# The second step returns you where you started (#stpbk) and the console's front door speaks to a non-admin (#cjred, screen half)

**Fault:** `verify/page.tsx` and `confirmTwoStep` chose the destination from what the login holds (`hasAdminRole()`), so a
person who is both Admin and a product administrator, stepping up for `/platform`, was sent to `/admin/security`.

**Choice: an in-app `?next=` query, not #1773's `auth_next` cookie.** The cookie exists because OAuth leaves for Supabase and
Supabase compares `redirectTo` against an allow-list; the step-up never leaves the app, so a query is safe and needs no new
cookie, path scope or expiry. `safeNextPath()` is applied on read in the page and again in the action (the hidden `next`
field is as untrusted as any form input). `safeNextPath()` and `next-cookie.ts` are unchanged.

**No role is read to decide.** With a `next`, no question about the login is asked; the old role-based choice survives only
as the fallback for a bare link, so nothing that worked before breaks.

**Both redirects fixed** (the early already-aal2 one and the one after a good code). Links now carrying where they started
(`stepUpHref(from)` in `src/lib/auth/two-step.ts`): `/platform`, `/admin/who-does-what` (both links), `/admin/who-does-what/features`,
and the `/admin/stocktaking` redirect. **Left bare on purpose:** `/my` (its banner is about setting up Security, whose
honest destination is the default `/admin/security`) and `/admin/security` (same). 

**Front door:** a signed-in login not on the product-administrator list now sees one sentence and a link to the app instead of
`notFound()`. The wording ("This address is not for this sign-in") does not say what exists; the gate is unchanged and the
page reads nothing for that login. The link goes to `https://<APP_HOST>/home` because the platform host serves only
`PLATFORM_KEEPS`. Signed-out visitors still go to `/login`; a wrong host still gets `notFound()`.

**Not a security change.** `check-hard-coded-security.mjs`: `no coded security outside the Admin bypass`. No gate moved.

**Not done here:** `#cjred`'s production Supabase Redirect URL read-back (the planner's).
