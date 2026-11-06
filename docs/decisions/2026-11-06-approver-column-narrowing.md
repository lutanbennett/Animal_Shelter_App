# Approver column narrowing (#p3k9w) — 2026-11-06

**Finding, by card.** `attachments_update_perm` (last written by `0316`, `:40`; `0314:46` for events) lets `can_approve_photos()` (card `photos.approve`) update any column of an `event` or `project` row. The approve actions (`src/app/photos/approve/actions.ts:44,73,134`) only ever write `approved_at`; the Private only path writes `private_only_at`. Every other column was writable by that card: `caption`, `file_name`, `sub_folder`, `sort_order`, `phase`, `owner_id`. The caption is published on the public website.

**Shape chosen: a `BEFORE UPDATE` trigger** (`0325`, `attachments_approver_columns_guard`). Precedent: `attachments_approval_stamp` (`0224`..`0318`) already refuses an approval change without the card. Column `GRANT`s are per database role, not per card, and the table is shared by every owner type. A `WITH CHECK` cannot see `OLD`. The policy is untouched, so who may touch a row does not change; only what they may change.

**Rule.** For `event`/`project` rows: a login holding the owning card (`events.run` / `projects.photos`) may change anything; a login reaching the row only via `photos.approve` may change only the four approval columns. Compared as `jsonb`, so a column added later is protected automatically. No session user (service role) is untouched; Admin passes via `has_permission()`. Resident rows are out of scope (their approve action and pending reassignment are unchanged).

**Buttons follow cards.** The only caption editor, `src/app/projects/[id]/PhotoSection.tsx`, is already drawn only for `canPhotos` (`projects.photos`), the activity `updateProjectPhotoCaption`'s policy asks. Nothing to change.

**Proof.** `supabase/harness/0325_approver_column_narrowing_harness.sql` (dev, rolled back): approver can approve and mark Private only on event and project; refused caption, phase, sort_order, and approve+caption together; `events.run` and `projects.photos` logins can still edit captions.
