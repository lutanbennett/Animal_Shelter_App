# Console: open the website, and say whether a host answers (#wbopn, #hstau)

Stream `console-host-live`, 2026-11-23. Step zero: `product_admin_set_shelter_site` (0436) had no caller in `src/`; `routes` in `wrangler.jsonc` hold no per-shelter host. The gap was there.

## Built

1. **Website tab, "Public website"** (`ProductAdminPanel.tsx`, `setShelterSite` in `actions.ts`): shows the shelter's state and offers the two other states as buttons (Open / Lock / Switch off). Drawn only when `canWrite` (product administrator at aal2), which is what the action and the database function both demand (`isProductAdmin` + `hasTwoStep`; the function checks `is_product_admin()` and aal2). No migration.
2. **The floor's precedence is said on screen.** The page passes `deploymentSiteState()` (PUBLIC_SITE) down; when it is more closed than the shelter's own value the tab says the visitor still sees the floor's state and that it is set in deployment configuration. Without that the control would be reported as broken on production, where the floor is `locked` (Lutan, 2026-11-05). The floor's value is untouched.
3. **"Check it answers"** beside each address: a product-administrator, aal2 read that does `HEAD https://<host>/` (6 s, no redirect following). Any HTTP reply counts as answering, including the construction redirect. It fetches only a host already recorded for some shelter. It keeps no state.

## Open question 6, the Cloudflare automation: NOT built, and why

The only Cloudflare credential the running app reads is `CLOUDFLARE_ANALYTICS_TOKEN` with `CLOUDFLARE_ZONE_ID` (`src/lib/status/usage.ts`). It is an analytics-read token scoped to one zone, and **no account id is available to the running app**; attaching a Worker custom domain is an account-level Workers call. I did not call Cloudflare to test the token's permissions (not mine to probe, and the name and purpose settle the account id). **Missing, and Lutan's to create:** a token with Workers Scripts edit (custom domains) on the account plus the zone's DNS edit, stored as a runtime secret per environment, plus the account id. Not asked to be created here.

**Not measured, and must be before any build:** whether `deploy.mjs --env production` removes custom domains attached by API but absent from `wrangler.jsonc`. Needs a test-Worker experiment with the new token. So `#hstau` stays open.

## Open question 7, "being set up" versus "broken"

Kept to two words: *Answers* / *Does not answer yet*, on demand. The wording says "yet" and the helper text says what is outstanding. Whether the console should distinguish "still being set up" from "set up but broken" is still Lutan's to settle (`#pacon` asked the same); no state machine was added.

## A shelter's own domain

Not automatable (the shelter's registrar contact changes nameservers). The Website tab says what is outstanding and points at the onboarding runbook, Step 2, which already holds the routine (`#shrun`); I updated its stale "no button yet" note to the button names rather than writing a second copy.

## Proved on dev (aal2 product-administrator login, headless Chrome)

Proof shelter B: locked -> Open -> reload reads "open" -> Lock -> reload reads "locked (staff only)". Check it answers on `flogn-proof-b.example.invalid` read "Does not answer yet". **Not proved:** the floor sentence (dev's floor is unset, i.e. open, so it never fires), the answering case, and anything on Cloudflare.

## Left for production

Raising the PUBLIC_SITE floor (his decision); the Cloudflare token and account id; the deploy-reconciliation measurement; then `#hstau`'s automation.
