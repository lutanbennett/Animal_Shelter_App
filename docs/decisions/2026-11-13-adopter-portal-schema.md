# 2026-11-13 — The adopter / foster-carer website account: schema half and specification (#d6wxo, migration 0371)

Charter and limit: `CLAUDE.md` (second recorded exception) and `2026-11-13-adopter-portal-card-exception.md`. Lutan's words: *"Yes, an exception."*
Scope, nothing wider: a non-staff account that signs in on the **public website**, posts updates and photos **only on residents it adopted or fosters**,
has them **approved by staff before publishing**, and **reaches nothing else**.

## Step zero: what was already built (so this is smaller than the brief expected)
- **Scope function**: `adopter_residents()` / `adopter_may_submit()` (0357), Adopt placements only.
- **An adopter sign-in already ships** (#l5gxn app half, `/adopter-update`): a normal Supabase sign-in, verified email, no staff card, all data access through
  the service role after `adopter_may_submit`, every call site already named under `serviceRoleSites`.
- **Approval already exists and is card-governed**: words `text.approve` / card `approve_text` (0343-0346); photos and videos `photos.approve` / card
  `approve_photos` (0309: adoption-update media is born unapproved). `public_adoption_updates` shows only approved rows.
What was missing: the Foster half of the scope, the proof of "reaches nothing else", the registry record, and a written specification.

## The two questions CLAUDE.md left open, settled
1. **Is the sign-in an app login at all?** It is an ordinary Supabase sign-in that holds **no `user_roles` row and no card**. Nothing in the database gives a
   new sign-in a role (no trigger on `auth.users`; checked 2026-11-13), so the account is roleless by default and staff must add a role to change that. A
   separate credential table or signed link was rejected: it would add a second session mechanism and a second place to forget to check, for no reduction in
   what the account can reach. The risk that matters, code that assumes every authenticated user has a role, is closed by the proof below, not by a new table.
2. **How does it link to the contact row?** By the **verified sign-in email** matching a live `contacts` row (`lower(email)`, `archived_at is null`),
   exactly as `src/lib/adopter/scope.ts` does. "Residents it has adopted or fosters" is then the contact's **open** `Adopt` or `Foster` placement
   (`placement_history.carer_id`). Past adopters and past foster carers drop out when the placement closes; updates already sent stay on the record.
   Duplicate emails: the union of the matching live contacts (unchanged).

## Proof that a login with no cards cannot reach a staff surface
`node scripts/check-portal-account.mjs` (dev only, rolls back). It creates a sign-in with no role row, acts through its own JWT as the `authenticated`
database role, and shows: `has_permission()` is false for **every** activity in `permission_activities`; and a count of **every readable base table in
`public`** (111 swept on 2026-11-13) returns **zero rows** for all of them. The sweep fails if fewer than 100 tables could be counted, so an empty list cannot be
a broken loop. A new table that a roleless login can read fails it until someone looks. **Not proved by it:** writes (covered instead by the rule that every
policy resolves through `has_permission()`, which `check-hard-coded-security.mjs` enforces from 0262), and the app: that every staff **page** redirects such a
login is the app half's to show in a browser (list below).

## Approval card
**No new card.** Approval of this account's updates is `text.approve` and `photos.approve`, both already cards that staff hold by assignment. The brief expected a
new card here; adding one would be a second card doing what these do, and `check-cards-count` would need its count moved for nothing. If Lutan later wants
adoption-update approval separable from other public text, that is a card for a later change.

## Registry
`docs/hard-coded-security-registry.json` records it as `outsideTheCardSystem.websiteAccount`, `counted: false`, not debt, not a precedent.

## Specification for the app half (`adopter-portal-app`), to be built to this and no further
1. **Public website sign-in.** The sign-in and the post-update screens are served from the public website frame, not the staff app. A sign-in with no role
   that lands on a staff route must be sent to the portal and must see nothing of the app's menu. **Show this in a browser** with `dev-signin.mjs`'s
   roleless counterpart before the PR; this stream could not (no UI).
2. **Fostered animals' updates.** `public_adoption_updates` was built for adopted animals; check whether it shows an update on a **fostered** resident once
   approved, and widen the view deliberately or keep foster updates staff-only. This is a decision for the app half with Lutan if it changes what a visitor sees.
3. **Nothing else.** No profile, messaging, list of other animals, donation history. The portal lists only the contact's own open placements.
4. **Controls follow cards for staff**: the staff review screens already do; the portal's own buttons ask `adopter_may_submit` and nothing else.
5. **Foster word**: dictionaries (en/th) say "foster" where the animal is fostered, not "adopted".

## Found, not fixed
`CLAUDE.md` said the portal was "Not yet built"; the sentence is corrected in this PR.
