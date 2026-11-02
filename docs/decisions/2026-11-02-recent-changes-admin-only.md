# Recent changes is Admin-only, honestly (2026-11-02)

Lutan, asked directly on 2026-11-02: Recent changes IS meant to be Admin-only, on purpose.

## What changed
- `/admin/recent-changes` is gated with `requireAdminUser()` (as `/admin/assistant`); its Undo action asks `hasAdminRole()`; the Undo control is drawn on that page because only Admin can open it.
- `audit.view` and `audit.undo` are retired: catalogue, route registration, both dictionaries, the `audit.view` probe in `permission-probes.mjs`, the matrix `needs`, the manual topic (now `adminOnly`), and `0301_retire_audit_activities.sql` (guard, then delete from `permission_activities`).
- The `/admin` landing tile joins the Admin-only tiles in `src/app/admin/page.tsx`, since the registry entry it used is gone.
- `/admin/recent-changes` is PINNED in `check-permission-catalogue.mjs`; check A learned to read `delete ... where key in (...)`.
- New read-only check `activities-grantable` (`scripts/lib/readonly-checks.mjs`): the mirror of `role-cards-coverage`. It asks whether every catalogue activity is named by some `card_grants` row.

## The backlog item was wrong on one point
It said no migration was needed. `0132` seeds both activities and check A requires the catalogue and `permission_activities` to match, so a delete was needed. The planner lifted the migration ban for this stream and assigned 0301. No policy, view or function asks either key.

## Not a breach of the hard-coded-security rule
Admin sits outside the card system (Lutan, 2026-10-25). Nothing is keyed on a role name. What is removed is the opposite fault: gating on an activity no card grants would silently start working the day someone put it on a card, a change in who reads the audit log with no card review.

## The wide resident read is left alone
`src/lib/audit/recent-changes.ts:274-280` does `.from("residents").select("id, name")`. With the page Admin-only it narrows nothing, since Admin passes every row policy. Left unchanged.

## Other scripts that pin the catalogue
Read: `check-activity-lists.mjs` (only reads keys from catalogue.ts to forbid lists; unaffected), `check-cards-count.mjs` (cards' bundles must name catalogue activities; no card named these; unaffected), `check-home-screens.mjs` (iterates ACTIVITIES, derives tiles; unaffected). Affected and updated: `check-permission-catalogue.mjs`, `permission-probes.mjs`, `check-who-does-what.mjs` (comment), `acceptance-matrix-entries.mjs`, `manual/for-topic.test.mjs`. Searched: `audit.view|audit.undo` across `src scripts docs supabase`.

## `activities-grantable` finding
On dev after 0301 it reports ten OTHER activities no card grants: appeal.medical_photo, maintenance.delete, photos.resident_publish, placement.death_withdraw, projects.photos, projects.publish, reference.types, stock.correct, stock.usage, system.status. Each is a question for Lutan, not fixed by inventing a card (cards.ts untouched). Some may be deliberate (maintenance.delete: see the fault-maintenance-delete decision; system.status and reference.types are Admin screens).
The "before" state could not be run live (no production credentials here, and dev was already migrated): the 0301 guard proved on dev that no card_grants row named either audit key, so the check would have printed the same ten plus these two.
