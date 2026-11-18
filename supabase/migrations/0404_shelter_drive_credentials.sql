-- consumer: src/lib/google/shelter-drive-credentials.ts
-- (That file does not exist yet: it belongs to tenancy-part9-drive-app, the app half.)
--
-- Tenancy Part 9 (backlog #o2iyh), SCHEMA HALF: where each shelter's own Google Drive OAuth credentials live.
-- Decision and reasoning: docs/decisions/2026-11-17-per-shelter-drive-credentials.md.
--
-- A TABLE OF ITS OWN, not columns on `shelters` as 0398 did for the folder id. Reason in checkable terms: `shelters` is read by the
-- Worker's host lookup on every request, so a refresh token on it would sit in a row that a routine `select *` already returns.
-- A table nobody selects by accident keeps the secret out of every existing reader. (0392's loop skips `shelters`; that is not
-- why, since no login can read `shelters` either, but it removes the temptation to rely on it.)
--
-- PROTECTION: (1) anon and authenticated hold NO grant, so no login of any card or role reads or writes a row; only service_role does.
-- (2) The secrets are stored as CIPHERTEXT, encrypted by the app with one key held as a Worker secret (not in the database), so a
-- database dump or a leaked read does not yield a usable token. (3) Policies written explicitly in 0392's shape, because 0392 has run
-- and will not pick this table up. Admin does not read it either: Admin sees only the status columns, through an RPC the app half adds.
--
-- EMPTY ON PURPOSE, as 0398 was: credentials differ per environment and a migration cannot know them. Until a shelter has a row the
-- reader falls back to the environment variables, so Lanna's behaviour is unchanged.
-- Re-runnable. TO UNDO: drop table shelter_drive_credentials.

create table if not exists shelter_drive_credentials (
  shelter_id                 uuid primary key references shelters(id) on delete cascade,
  oauth_client_id            text,
  oauth_client_secret_enc    text,
  refresh_token_enc          text,
  drive_account_email        text,
  token_status               text not null default 'unchecked' check (token_status in ('unchecked', 'ok', 'dead')),
  last_checked_at            timestamptz,
  last_error                 text,
  dead_alerted_at            timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

alter table shelter_drive_credentials enable row level security;
revoke all on shelter_drive_credentials from anon, authenticated;
grant select, insert, update, delete on shelter_drive_credentials to service_role;

do $$
declare cmd text;
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    drop policy if exists definer_all on public.shelter_drive_credentials;
    create policy definer_all on public.shelter_drive_credentials for all to rls_definer using (true) with check (true);
  end if;
  -- 0392's shape. Belt and braces: with no grant these never match a login, but if a grant is ever added by mistake a login
  -- still sees only its own shelter's row. Not a permission: nothing here grants anything.
  foreach cmd in array array['select','update','delete'] loop
    execute format('drop policy if exists %I on public.shelter_drive_credentials', 'shelter_scope_' || cmd);
    execute format(
      'create policy %I on public.shelter_drive_credentials as restrictive for %s to anon, authenticated using (public.is_trusted_caller() or shelter_id = public.current_shelter_id())',
      'shelter_scope_' || cmd, cmd);
  end loop;
end $$;
