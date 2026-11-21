# The shelter chooser page (#apxld, app half)

**Step zero:** nothing in `src/` called `my_shelters`; `0433` is on main. The gap was there.

- **Route: `/platform/shelters`.** Under `/platform`, so `PLATFORM_KEEPS` already keeps it on the platform host. It copies `about/page.tsx`'s guard (not-found on a shelter's own address when `PLATFORM_HOST` is set).
- **Reachable how:** a third sign-in link on the product page, "I work at more than one shelter", goes to `/login?next=/platform/shelters`. The product front door maps to no shelter, so a login whose roles are all at shelters holds no role *here*, and sign-in used to sign it out ("site not set up"). `src/lib/auth/chooser-path.ts` names the one path; `src/app/login/actions.ts` (password) and `src/app/auth/callback/route.ts` (Google) keep the session only when `next` is exactly that path and the request has no shelter. **`src/app/login/page.tsx` needed no change** (it already threads `next`). Where an ordinary sign-in lands is unchanged (#cjred untouched).
- **Signed out:** redirected to the ordinary `/login?next=…`, which says nothing about shelters. Proved: lands on the login form.
- **Signed in, zero rows:** `notFound()`, the same as an address that does not exist.
- **One shelter:** a one-row list, not an automatic jump. A person expecting several who sees one understands why; an unexplained leap to another address does not.
- **Controls:** every entry is a plain link to another address; no action, so no card gate.
- **Driven (headless Chrome, real session):** signed out -> login; one shelter -> one link; two shelters -> two links (`https://<host>/`). The two-shelter login needed a service-role `user_roles` row added **after** `dev-signin` (it deletes extra roles on every run). Dev note: the real shelter `lanna` has no `is_primary` host on dev, so it is left out by `my_shelters()` unless one is set; I set one for the run and restored it. **Production needs checking: a shelter with no primary host never appears.**
- **Not driven:** Thai rendering, 375px, console/network.
