# Adopter portal, app half (`#d6wxo`, `adopter-portal-app`)

Built to the specification in `2026-11-13-adopter-portal-schema.md`. Step zero found most of it already shipping.

## Step zero
`/adopter-update` (page, form, actions, media routes), `src/lib/adopter/`, `adopter_residents()` / `adopter_may_submit()` (0357, widened by 0371) and the card-governed approval route all exist. The gap was small.

## What this PR does
1. **Foster word.** `loadAdopterScope` now says per resident whether the open placement is Foster; the page shows "Adopted by you" / "Fostered by you" and a foster intro when every animal is fostered. en and th. The Thai is unchecked by a Thai speaker.
2. **Roleless login on a staff route.** `src/lib/supabase/proxy.ts` used to sign such a login out and send it to `/login?error=no_role`. It now sends a login with a live adopter scope to `/adopter-update` and keeps it signed in. A login with no scope behaves as before. Shown in the browser on dev with a roleless login: `/residents` and `/home` both landed on the portal with no staff menu.
3. **Isolation instrument.** `scripts/check-portal-account.mjs` run on dev: `HARNESS-OK`, 112 tables swept, a roleless login holds no permission and reads nothing.

## Open question 3: does `public_adoption_updates` show an approved update on a fostered resident?
Yes. The view (`0343`) filters on `share_publicly`, `text_approval = 'public_ok'`, the resident being public-visible and not deceased, and an approved photo. It never looks at placement type. So an approved foster update with an approved photo already appears on the website. No migration needed, nothing built. If Lutan wants foster updates staff-only, that is a view change (a migration) and his call; not made here.

## Controls
The portal draws a Send button and a file chooser per animal, only for animals in `adopter_resident()` scope. The action (`actions.ts`) asks `adopter_may_submit(contact, resident)`; the page and the action use the same scope function. No staff card is asked anywhere, by design (recorded exception). Nothing found ungated.

## Not done / not touched
No card added, Admin bypass untouched, registry entry unchanged (this work does not change what it describes).
