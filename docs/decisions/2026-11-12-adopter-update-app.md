# 2026-11-12 — An adopter sends an adoption update in themselves: the app half, words only (#l5gxn)

Built to `2026-11-11-adoption-updates-schema.md`. **Handed back unfinished at a sanctioned boundary**: words work end to end in code, but photos, video, the size limit and upload state, the Translations route and the browser drive are not done (see the end).

## The card question (deliverable 2): no new card
Approving an adopter's words is the same activity as approving any other text for the website: someone reads words and says whether they may be shown publicly. `text.approve` already does that for adoption updates (`TextApprovalBar` kind `adoption_update`, `set_text_approval()`), and a shelter splitting "who reads an adopter's words" from "who reads a project description" is not a case anyone has asked for. So: **no card, no `cards.ts` change, no card migration.** The one migration this PR carries, `0360`, is not a card: it widens the `channel` CHECK with `'app'` so staff are not told an adopter's own message arrived by email. A card can still be added later as one PR if that split is wanted.

## The duplicate-email question (deliverable 3a)
`contacts` has no unique email. Every live row matching the verified email (`lower(email)`, `archived_at is null`) is the same verified person, so the scope is the **union** of `adopter_residents()` over all matches; each resident is kept with the contact that is its carer, and that contact's id is stored as `sender_contact_id`. Nothing is refused, and nobody gets an animal they did not adopt.

## The adopter login (deliverable 3)
No new account is created: an adopter signs in (Google, or a password if one exists) like anyone. A login with no staff card (`!role?.entersApp`) whose email_confirmed_at is set and whose email is a live contact is sent to `/adopter-update` by the callback, the password action and the proxy's `/login` branch. The proxy lets that login reach `/adopter-update` only; everything else still sends it away, as before. The adopter is given **no table access**: the three files that read or write for them use the service role after `loadAdopterScope` and `adopter_may_submit`, and are named under `serviceRoleSites` in the registry. `check-hard-coded-security` passes.

## Action controls (deliverable 7)
| Control | Drawn when | Activity its action asks |
|---|---|---|
| Send (`AdopterUpdateForm`) | the resident is in the adopter's `adopter_residents()` scope | none of the staff cards; `adopter_may_submit(contact, resident)`, asked again in `sendAdopterUpdate` |
| Sign out | always, on the adopter's page | none (own session) |
No staff control appears on this page.

## What the promise rests on (deliverable 6)
The insert names no `text_approval`, so it is NULL and `public_adoption_updates` (only `public_ok`) cannot show it; `scripts/check-adopter-resident-scope.mjs` already asserts exactly that at the database. **Not driven through the running page** in this PR.

## Not done (for the next session)
- Photos and video from the adopter: the existing routes (`/api/residents/[id]/photos`, `videos/start|finish`) ask `resident.adoption_news`; an adopter-side path needs the same service-role guard and Drive filing, and `record_attachment` checks a card, so it needs its own RPC or service call.
- The size limit and a visible upload state (his answer (c)): with video not built there is nothing to limit yet. Recommend reusing `MAX_VIDEO_BYTES` (500 MB) unless a phone test says lower.
- Prose into the Translations queue (answer (e)).
- Driving it: a disposable adopter login (confirmed-email auth user + a contact with an open Adopt placement), then the page, a send, the staff view, and the public view; the Thai wording on a real phone.
- `releases.ts`: no line, because the feature is not user-complete.

## The service call is recorded, not avoided (Lutan, 2026-11-12, asked directly)
`0357`'s caveat tells the app half to call the scope functions through a server-side service call, and the permission-catalogue check says a service-role writer needs an admin check or a named exemption. Those collided; he ruled to record the service call and keep it. `scripts/check-permission-catalogue.mjs` names `adopter-update/actions.ts` in `NO_ACTIVITY` and as a second named exemption to the service-role rule beside `account/password/actions.ts`, whose shape this is: a signed-in person acting on their OWN data through one narrow service-role call after a check the code performs (`adopter_may_submit`). The other precedent, `services/sterilisation/actions.ts`, is exempt because it is signed out (anon role, insert-only grants); that does not transfer to an identified adopter. The assertion still fails for every other file.

## Driven (2026-11-12, dev, `scripts/dev-adopter-signin.mjs`)
A disposable adopter (confirmed email, Carer contact, open Adopt placement on resident R-L5GXN, no role, no card): lands on `/adopter-update`; a sent update shows "Waiting to be read"; the row has `channel = app`, `text_approval` NULL, no stamp; `public_adoption_updates` (read as anon) has 0 rows for that resident and 0 matching the words; `/home`, `/residents`, `/contacts`, `/admin/who-does-what` and a staff API route each redirect that login to `/login` (the session is ended).
