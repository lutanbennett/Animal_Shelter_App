-- Database check on site_content.contact_map_url (WEB-6 follow-up).
--
-- admin/website/actions.ts already runs checkHttpsUrl on this column, but a
-- write that skips the action was unconstrained. This is the same
-- `~* '^https?://'` check 0080 put on facebook_url / instagram_url (and 0076
-- on shelter_friends.facebook_url) — deliberately looser than the validator
-- so the two can never disagree; it is the last line against a `javascript:`
-- link reaching a public href.
--
-- The column is nullable ("not set") and NULL passes a check, so the one
-- existing row (NULL on dev) conforms and no `not valid` step is needed.
-- Additive; no RLS or grant change. Re-runnable: drop-if-exists then add.

alter table site_content drop constraint if exists site_content_contact_map_url_check;
alter table site_content add constraint site_content_contact_map_url_check
  check (contact_map_url ~* '^https?://');

notify pgrst, 'reload schema';
