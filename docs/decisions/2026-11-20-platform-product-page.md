# The product page at the platform apex (#apxld, product-page half)

Lutan, 2026-11-20: cooperjaidee.org needs a product page for a shelter deciding whether to join, with a way to ask and two ways in.

- **Route:** `/platform/about`, not `/`. `platformRedirect()` sends `/` there; every other unkept path still goes to the console, so the front door's rule is unchanged. A named route under `/platform/` is already kept by `PLATFORM_KEEPS` and already has the app chrome hidden, so nothing else changed. A redirect (not a rewrite) because the proxy has one mechanism and a rewrite would put `/` in front of the chrome gate.
- **Readers checked:** `platformRedirect`/`PLATFORM_KEEPS` are read only by `src/proxy.ts` and `src/lib/site-hosts.test.mjs`. The page also had to join `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS` (`src/lib/public-paths.ts`) or the session gate sent a signed-out visitor to `/login`; and it has a row in `scripts/check-permission-catalogue.mjs`.
- **Holds:** static words only; reads no table, lists no shelter or account. Indexable (page overrides the layout's noindex) because it is the product's home page.
- **Controls:** three plain links (enquire, sign in, sign in as admin via `/login?next=/platform`). None is an action needing a card.
- **Not built:** the multi-shelter chooser; `#apxld` stays open for it.
- **Release note:** none; no shelter user would see this page.
