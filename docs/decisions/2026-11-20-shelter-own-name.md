# A shelter's own names: set from the platform console, and where the public name comes from (#shnms, #shnam)

**Decided 2026-11-20 by the `shelter-own-name` stream.** One file for both halves.

## 1. Whose screen sets the names: the platform console (decision for #shnms)

`shelters.display_name` and `shelters.short_name` (0400) are set from **/platform**, the product-administrator console, by a new
**Names** form on each shelter's card, calling `product_admin_set_shelter_names(p_shelter, p_display_name, p_short_name)` (0424).
Same gate as every other console write: `is_product_admin()` plus `aal2`, no role key, no card; scoped to the one shelter for that
transaction only, exactly as `product_admin_set_shelter_receipts` (0419) does.

Why the console and not the shelter's own Settings:
- The gap is an **onboarding** step. A brand-new shelter has no signed-in person yet who could rename it, and `#onbrb`'s runbook must
  work without Lutan. The console is where the rest of a shelter's setup already happens.
- It is the cheaper build: the `product_admin_*` idiom, the action wrapper and the form shape already exist.
- Not both screens: a shelter renaming itself later is a separate want. If it is ever wanted it needs a **card** (none covers "change
  this shelter's name" today) and its own migration. Not built, not filed as debt.

The console's own checklist (`2026-11-19-product-admin-state-schema.md` §3) does not list the names, and **this change does not add a
checklist step**: the form is always shown (pre-filled with what is set), so the setup-state RPC's step list is unchanged. The RPC
`product_admin_shelters()` did gain two columns (`display_name`, `short_name`) so the form can show what is set; its other columns and
its gate are 0420's. It was dropped and re-created (a return-type change), with its grants stated again in the same file.

## 2. Where a public page's name comes from (#shnam)

Established by reading, surface by surface. **The mechanism was right; the value was missing.**

| Surface | Source | Reads `shelterNames()`? |
|---|---|---|
| Page prose (every dictionary string with `{shelter}` / `{shelterShort}`) | `fillShelterNames` in `get-t.ts` and `I18nProvider.tsx` | yes |
| `<title>` / metadata (`src/app/layout.tsx`) | `(await shelterNames()).displayName` | yes |
| Nav, footer, `/adopt`, `/foster`, `/volunteer`, `/donate` | dictionary prose through the same fill | yes |
| Mail, alerts, supplier email, PDFs | `shelterNames()` (`status/alerts.ts`, `merch/supplier-email.ts`, `archive/*`) | yes |
| `PublicNav.tsx:40`, `adopt/[id]/page.tsx:103`, `page.tsx:161`, `role-options.ts:21` | code comments only | n/a, not rendered |

`test-shelter-2` said "Lanna Care for Animals" because both columns were empty and the declared per-field fallback
(`DEFAULT_SHELTER_NAMES`) did what it says. Nothing in `src/` hard-codes a rendered Lanna name.

**Two findings, found and not fixed (not this item's mechanism):**
- `src/app/adopt/[id]/page.tsx:196` falls back to `lannacareforanimals@gmail.com` as the contact email when a shelter has none.
  A second shelter's adopt profile would show Lanna's address. For the planner to file.
- `src/lib/i18n/dictionaries/en.ts` (~2287) says the authenticator code is for "Lanna Animal Care" in a Security-page string.
  Admin-only, and it is the authenticator's label rather than the shelter's name. For the planner to file.

## 3. Buttons follow cards
The one new control, **Save names**, is drawn only when `canWrite` (product administrator at aal2), which is what the action's own
checks (`isProductAdmin()`, `hasTwoStep()`) and the RPC ask. Outside the card system by Lutan's PADMIN decision of 2026-11-18.
Without write access the form shows the two names as text and no inputs.

## 4. Not verified
The final "press Save on Test Shelter 2" step in the browser pane was refused by the harness's safety classifier, so the write was not
driven through the screen; the screen renders with the current names (driven). The RPC itself is proved by the dry run and by
the typed call; the first real use is a person's press.
