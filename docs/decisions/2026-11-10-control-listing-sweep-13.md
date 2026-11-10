# Control sweep 13: 22 of the 24 undriven pages rendered under one-card logins; two faults found and fixed (2026-11-10)

Brief: `#79sqf`'s remainder (a notice that promises an ability the login lacks; a control gated on a different activity than
its own action asks) on the 24 pages sweep 12 only read. Step zero: `2026-11-10-control-listing-sweep-12.md` read;
`docs/destination-activity-allowlist.json` holds 0 rows; no earlier PR on the slug.

## HOW THIS WAS DRIVEN, honestly — it is NOT clicking in the pane

Signed in with `node scripts/dev-signin.mjs --cards <card> --port 3008`, then fetched each page with `curl` and that login's
cookie and read the server-rendered HTML for every notice, button, link and form field. **That shows exactly what the login is
offered** (the two faults below were found this way), and it avoids the pane's `requestAnimationFrame` problem. **It does NOT
press anything**: a save, an archive, a match-a-bill press, a control drawn only after hydration, are all unproved. Dev holds
no bills, special diets, medication rounds or supplier-less Shelter Friends, so per-row controls on those pages did not draw.

## Driven (page — card — result)

| Page | Card | Result |
|---|---|---|
| `/enclosures`, `/enclosures/[id]` (an empty one), `/enclosures?view=map` | `view_medical` | nothing found: no write control; residents hidden (no resident read) |
| `/bills` | `record_delivery`, `medical_records` | nothing found: "Add bills" and the upload actions both ask `canUseBills` |
| `/clinics`, `/clinics/[id]` | `view_contacts` | nothing found: read-only, no edit link |
| `/suppliers` (redirects to `/management/suppliers`), `/suppliers/[id]` | `suppliers` | **FAULT 1, fixed** |
| `/upcoming-visits`, `/appointments` | `view_medical` | nothing found (no book link; `/appointments` drew no content here) |
| `/management/cashflow` | `view_cashflow` | nothing found |
| `/management/expenses` | `view_expenses` | nothing found (receipt links are Drive links) |
| `/management/medications` | `medicine_forecast` | nothing found: no edit control |
| `/medical/diets`, `/operations/feeding-list` | `feed_special_diets` | nothing found: "a list to read" promises nothing |
| `/operations/medication-list` | `administer_medication` | nothing found |
| `/reels`, `/reels/[id]` | `reel_view` | nothing found |
| `/outreach` | `outreach_notes` | nothing found (draws "Add" to `/outreach/new`; that card edits) |
| `/admin/shop` | `manage_shop_page` | nothing found (the card grants edit; the forms are its own) |
| `/admin/website`, `/admin/website/pages/[slug]` | `website_photos`, `website` | nothing found: a photos-only login gets read-only fields and no Save |
| `/admin/who-does-what` | `who_does_what` | **FAULT 2, fixed** |
| `/admin/who-does-what/details`, `/features` | `who_does_what` | loaded; edit halves Admin-only and aal2: `n/a: aal2 required, no authenticator` |
| `/memes/make` | `meme_add` | loads (chooser draws); the canvas editor was NOT used, so `#t3n9r` stays open |

## The two faults

1. **`/suppliers/[id]` intro told a `suppliers` login it could "change its details, archive it, or make it a Shelter Friend
   here".** The card holds `suppliers.directory` edit (Archive is drawn) but not `friends.manage`, so no Shelter Friend control
   draws, and the page has no details form. Now one of four sentences by `suppliers.directory` edit x `friends.manage`
   (`pageIntro`, `pageIntroEdit`, `pageIntroFriend`, `pageIntroEditFriend`, en and th). Checked live with the `suppliers` login:
   reads "Archive it here."
2. **`/admin/who-does-what` drew "Edit the features (Features)" to every viewer**, but the Features edit half is Admin-only
   (and aal2). A non-Admin now sees "See the features (Features)" (`featuresLinkReadOnly`). Uses the page's existing `isAdmin`,
   which is the Admin bypass and not a card rule.

## Found, not fixed

`/admin/website/pages/[slug]`'s preview hint says "Nothing is saved until you press Save changes" to a login that has no Save
button. The fields are read-only, so no unsaved change can exist; borderline, left as is. Dictionary files `en.ts`/`th.ts` were
touched (two keys each) — the other two streams of this batch edit them too.

## Not driven in the pane (for the next stream)

Click-only behaviour (Archive, Save, matching a bill, Shelter Friend card) and per-row controls on `/bills`, `/medical/diets`,
`/operations/*` need rows in dev. `/enclosures/[id]` with residents was not seen under a card that reads residents. `/memes/make`
canvas. Do not re-render the pages in the table above.
