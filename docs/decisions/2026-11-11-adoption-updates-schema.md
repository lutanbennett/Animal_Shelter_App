# 2026-11-11 — Adoption updates from the adopter: schema half (#l5gxn, migration 0357)

Lutan's six answers of 2026-11-10 are built to, not re-opened. This file is the specification for the app half.

## What step zero found (the brief's two assumptions)
1. **The adopter→resident link exists as data, and the planner's reading held.** `placement_history` (0001): `resident_id`,
   `placement_type` (`'Adopt'`), `carer_id` → `contacts(id)`, `start_date`, `end_date`. Rows are immutable except notes and
   `end_date`; a new placement auto-closes the prior one (`close_prior_placement`). `carer_id` must be a contact of type `Carer`
   (`check_carer_type`) and is optional on an Adopt placement (0009). `contacts.email` and `contacts.archived_at` (0075) exist.
2. **The approval state for the update's TEXT already exists, so the brief's "(ii)" needed no new column.**
   `adoption_updates.text_approval` (`NULL` not reviewed | `public_ok` | `private_only`) with `text_approval_by` / `_at` came in 0343,
   default `NULL` since 0346, stamped by the database, and setting it needs `text.approve` (0345/0346). `public_adoption_updates`
   shows only `public_ok`. So "invisible until approved" (d) already holds for text. I did **not** add `approved_at`/`approved_by`:
   a second approval state beside it would disagree with it. NULL means not approved; the harness asserts no stamp is set.
3. **0309's media gating is a pattern to leave alone**: an adoption-update photo or video is born unapproved and absent from the
   public view. Nothing to rebuild.

## What 0357 adds (and only this)
- `adopter_residents(p_contact_id uuid) returns setof uuid` — residents whose **open** Adopt placement names the contact as carer
  and whose contact is not archived.
- `adopter_may_submit(p_contact_id uuid, p_resident_id uuid) returns boolean` — the same answer for one resident.
- Both `security invoker`, execute for `authenticated` only (revoked from public/anon). No card, no role key, no policy.
- **Decided, caveat 3: only the CURRENT adopter may send.** A returned resident's Adopt placement ends, so the past adopter drops
  out; a re-adopter enters. Updates already sent stay on the record (0097). "Who may submit" (this scope) and "who sent it"
  (`adoption_updates.sender_contact_id`, stored) remain separate questions.
- Caveat: being `security invoker`, a signed-in adopter's own row access applies when they call these. **The adopter login's access to
  `placement_history` / `contacts` is not granted here**; the app half must call them through a path that can read both (a server-side
  service call keyed on the verified email), not hand an adopter table access.

## How the app half asks
1. Verified sign-in email → `contacts` row (`lower(email)`, `archived_at is null`; more than one match is an app decision).
2. May this contact send about this resident → `select adopter_may_submit($contact, $resident)`.
3. Insert the `adoption_updates` row with `sender_contact_id = $contact`, `text_approval` omitted (NULL). Naming a state needs `text.approve`.
4. The adopter sees their own copy and "waiting" by reading their own rows (`text_approval is null`), never the public view.

## NOT in this PR (the three things his answers imply)
- **The adopter login** — a new kind of account created from a `contacts` row, not staff, holding no staff card; touches sign-in.
- **The approving card** — `text.approve` / `approve_text` already approve text; whether adoption updates need their own card is the app
  half's, and a card cannot land in two PRs (`check-cards-count`).
- **Size limit and visible upload state for video** on a Thai mobile connection (answer (c)), plus how prose reaches the Translations
  queue (answer (e)); no retention rule and no chaser (answer (f)).

## Harness
`scripts/check-adopter-resident-scope.mjs` (dev only, rolls back): scope is the open Adopt carer only; out after ReturnToShelter;
re-adopter in and previous out; archived and other contacts out; unknown contact empty; an unapproved update has NULL text_approval,
no stamp, and is absent from `public_adoption_updates`.
