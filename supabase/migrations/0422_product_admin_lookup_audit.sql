-- consumer: none (the console still calls product_admin_login_exists through src/app/platform/actions.ts; nothing reads the new table yet)
-- #lkaud. product_admin_login_exists(email) answers one yes/no about any address a product administrator types, and nothing recorded that it was
-- asked. This records each distinct question: who asked, which address, what the answer was. DECIDED an audit row, not a rate limit: the console
-- calls it on blur as somebody types, so a limit loose enough for that stops nothing (docs/decisions/2026-11-19-lookup-audit-row.md).
-- WHY NOT audit_log: that table is per shelter (shelter_id NOT NULL since 0397, stamped from the x-shelter-id header) and this call belongs to no
-- shelter; a platform request names none, so a row there would fail or need an invented shelter. A small platform table instead.
-- CHATTINESS: a repeat of the same question by the same person within 10 minutes writes no second row. Blur fires many times on one address.
-- The gate is exactly 0418's (is_product_admin() and aal2) and the recording happens after it, so a refused caller writes nothing. Grants nobody
-- anything. Body is 0418's plus the recording, now VOLATILE (it writes). Re-runnable. TO UNDO: re-apply 0418's body; drop table public.product_admin_lookups.
create table if not exists public.product_admin_lookups (
  id bigint generated always as identity primary key,
  actor uuid not null,
  email_checked text not null,
  found boolean not null,
  at timestamptz not null default clock_timestamp()
);
create index if not exists product_admin_lookups_at_idx on public.product_admin_lookups (at desc);

alter table public.product_admin_lookups enable row level security;
revoke all on public.product_admin_lookups from anon, authenticated, service_role;
grant select on public.product_admin_lookups to authenticated, service_role;
drop policy if exists product_admin_lookups_select on public.product_admin_lookups;
create policy product_admin_lookups_select on public.product_admin_lookups for select to authenticated using (public.is_product_admin());

create or replace function public.product_admin_lookups_refuse_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'product_admin_lookups is append-only: % is not allowed', tg_op using errcode = 'insufficient_privilege';
end;
$$;
revoke execute on function public.product_admin_lookups_refuse_change() from public, anon, authenticated;
drop trigger if exists product_admin_lookups_no_change on public.product_admin_lookups;
create trigger product_admin_lookups_no_change before update or delete on public.product_admin_lookups
  for each row execute function public.product_admin_lookups_refuse_change();
drop trigger if exists product_admin_lookups_no_truncate on public.product_admin_lookups;
create trigger product_admin_lookups_no_truncate before truncate on public.product_admin_lookups
  for each statement execute function public.product_admin_lookups_refuse_change();

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    drop policy if exists definer_all on public.product_admin_lookups;
    create policy definer_all on public.product_admin_lookups for all to rls_definer using (true) with check (true);
    grant select, insert on public.product_admin_lookups to rls_definer;
  end if;
end $$;

create or replace function public.product_admin_login_exists(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_found boolean;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  v_found := exists (select 1 from auth.users u where lower(u.email) = p_email);
  if not exists (select 1 from public.product_admin_lookups l
                 where l.actor = (select auth.uid()) and l.email_checked = p_email and l.found = v_found and l.at > clock_timestamp() - interval '10 minutes') then
    insert into public.product_admin_lookups (actor, email_checked, found) values ((select auth.uid()), p_email, v_found);
  end if;
  return v_found;
end;
$$;
