-- consumer: src/lib/google/shelter-calendar-credentials.ts
-- (That file does not exist yet: it belongs to the app half of #calsh, a later stream.)
--
-- Backlog #calsh, SCHEMA HALF: where each shelter's own Google Calendar credentials and calendar id live, so one shelter's clinic
-- visits can never be written into another's calendar. Decision and reasoning: docs/decisions/2026-11-18-per-shelter-calendar-credentials.md.
-- A faithful copy of 0404 (shelter_drive_credentials), for the same reasons, with the calendar id added.
--
-- A TABLE OF ITS OWN, not columns on `shelters`: `shelters` is read widely (the host lookup on every request), this table is read only
-- by the service role, so a refresh token never rides in a row an existing reader already fetches.
--
-- PROTECTION: (1) anon and authenticated hold NO grant, so no login of any card or role reads or writes a row, the ciphertext
-- included; only service_role does. (2) The secrets are CIPHERTEXT, encrypted by the app with DRIVE_CREDENTIALS_KEY (a Worker secret,
-- not in the database), so a dump or a leaked read yields nothing usable. (3) Policies written explicitly in 0392's shape, because
-- 0392 has run and will not pick this table up. Admin does not read it either: Admin sees status columns only, through an RPC the
-- app half adds (as 0405 did for the Drive).
--
-- ONE ADDITION BEYOND 0404: calendar_id is UNIQUE across shelters. Two shelters pointed at one calendar is exactly the leak this
-- item closes, so the database refuses it rather than leaving it to the screen that saves the row.
--
-- EMPTY ON PURPOSE, as 0398 and 0404 were: credentials differ per environment and a migration cannot know them. Lanna has NO row and
-- keeps using the four environment variables (that fallback is the app half's); a shelter other than Lanna with no row is REFUSED
-- (CALENDAR_OFF_NOTE path), never routed to Lanna's calendar.
-- Re-runnable. TO UNDO: drop table shelter_calendar_credentials.

create table if not exists shelter_calendar_credentials (
  shelter_id                 uuid primary key references shelters(id) on delete cascade,
  calendar_id                text,
  oauth_client_id            text,
  oauth_client_secret_enc    text,
  refresh_token_enc          text,
  calendar_account_email     text,
  token_status               text not null default 'unchecked' check (token_status in ('unchecked', 'ok', 'dead')),
  last_checked_at            timestamptz,
  last_error                 text,
  dead_alerted_at            timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create unique index if not exists shelter_calendar_credentials_calendar_id_key
  on shelter_calendar_credentials (calendar_id) where calendar_id is not null;

alter table shelter_calendar_credentials enable row level security;
revoke all on shelter_calendar_credentials from anon, authenticated;
grant select, insert, update, delete on shelter_calendar_credentials to service_role;

do $$
declare cmd text;
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    drop policy if exists definer_all on public.shelter_calendar_credentials;
    create policy definer_all on public.shelter_calendar_credentials for all to rls_definer using (true) with check (true);
  end if;
  -- 0392's shape. Belt and braces: with no grant these never match a login, but if a grant is ever added by mistake a login
  -- still sees only its own shelter's row. Not a permission: nothing here grants anything.
  foreach cmd in array array['select','update','delete'] loop
    execute format('drop policy if exists %I on public.shelter_calendar_credentials', 'shelter_scope_' || cmd);
    execute format(
      'create policy %I on public.shelter_calendar_credentials as restrictive for %s to anon, authenticated using (public.is_trusted_caller() or shelter_id = public.current_shelter_id())',
      'shelter_scope_' || cmd, cmd);
  end loop;
end $$;
