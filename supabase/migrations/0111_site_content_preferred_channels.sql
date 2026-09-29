-- The shelter's preferred order for getting in touch, on the public site.
--
-- Backlog item "let the shelter choose its preferred contact channel"
-- (Lutan, 2026-09-28). The public pages hard-code LINE first; this column is
-- what lets Settings -> Website say otherwise. Schema half only: nothing
-- reads it yet, and claude/contact-channel-picker follows once this is on
-- main and applied to dev.
--
-- An ORDERED LIST, not one choice (decisions.md, 2026-09-29): the second and
-- third buttons ("Talk to us" menu, footer) follow the shelter's order too,
-- and the fallback the app needs when the first choice has been cleared is
-- just "the next entry", so one array serves both. First entry = the
-- preferred channel. The default is {line}, i.e. today's behaviour: the app
-- treats channels missing from the list as trailing in its built-in order,
-- so {line} alone changes nothing.
--
-- Values are checked against the six channels the picker offers. `<@` keeps
-- the check a plain expression (a CHECK cannot hold a subquery); duplicates
-- are harmless and de-duplicated by the app's helper. Empty is allowed and
-- means "use the built-in order". The value being *set* on the row is not
-- checked here — whether a listed channel has a value (contact_line,
-- messenger_url, whatsapp_number, instagram_url, phone, email) is the
-- helper's question at read time, so clearing a channel never breaks a save.
--
-- site_content is a singleton (0018); under the tenancy spike it becomes one
-- row per shelter, so this is already per-tenant. No RLS or grant change:
-- 0018's public-read / admin-update policies and 0077's table grants cover a
-- new column. Additive and re-runnable.

alter table site_content
  add column if not exists preferred_channels text[] not null default array['line']::text[];

alter table site_content drop constraint if exists site_content_preferred_channels_check;
alter table site_content add constraint site_content_preferred_channels_check
  check (
    preferred_channels <@ array['line','messenger','whatsapp','instagram','phone','email']::text[]
    and cardinality(preferred_channels) <= 6
  );

comment on column site_content.preferred_channels is
  'Ordered contact channels for the public site (line, messenger, whatsapp, instagram, phone, email); first is preferred, the rest are the fallback and button order. {line} = the original behaviour.';

notify pgrst, 'reload schema';
