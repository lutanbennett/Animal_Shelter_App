-- consumer: src/app/platform/page.tsx, src/app/platform/ProductAdminPanel.tsx, src/app/platform/actions.ts
-- (the #pacon console redesign is the app half; worker/shelter.mjs reads resolve_shelter_site and needs no change)
--
-- #pacon SCHEMA HALF. Lutan, 2026-11-20 (docs/decisions/2026-11-20-product-admin-console-requirements.md, sections A, B, E).
-- docs/decisions/2026-11-20-shelter-state-schema.md is the specification the screen is built from; read it before this file.
--   1. The ACCOUNT HOLDER on shelters: the person responsible for the relationship, who may never sign in. Stored, never derived from the Admin login.
--   2. THE website: shelter_hosts.is_primary, at most one per shelter (partial unique index), set automatically on a shelter's first address.
--   3. ARCHIVE: shelters.archived_at. Off means UNREACHABLE, NOT GONE.
--   4. The enquiry -> shelter link (shelters.enquiry_id) and one function that carries the account holder across, so nothing is retyped.
--   5. product_admin_shelters() returns all of it. Four small writes, each product administrator + aal2 (0419's gate).
--
-- ARCHIVING TOUCHES NOTHING BUT shelters.archived_at. It does not delete or alter a single row of the shelter's records, residents, photos or
-- backups, does not touch its Drive folder or credentials, does not touch shelter_hosts, roles or logins, and does not change public_site.
-- Unarchiving clears the column and the shelter is exactly as it was. That is the whole reason it is an archive and not a delete.
--
-- BOTH DOORS CLOSE IN ONE PLACE: resolve_shelter_site() (0426), the only function that turns a request's host into a shelter. For an archived
-- shelter it returns id = null, exactly as for an unregistered host. The Worker then sends NO x-shelter-id, "no header means no rows"
-- (0383, 0392), and every restrictive shelter_scope_* policy on every tenant table refuses the rows to staff and to the public alike.
-- It also returns "archived": true so the app can say "this shelter is closed" rather than "this site is not set up". Not stored twice:
-- public_site is NOT changed, so the website's own setting comes back untouched on unarchive. Lookups are remembered for 60 s (worker/shelter.mjs).
--
-- Additive and re-runnable. TO UNDO: re-apply 0426's resolve_shelter_site and 0424's product_admin_shelters; drop the four functions and the
-- trigger shelter_hosts_first_is_primary; alter table shelter_hosts drop column is_primary; alter table shelters drop column account_holder_name,
-- account_holder_email, account_holder_phone, account_holder_location, enquiry_id, archived_at.

alter table public.shelters
  add column if not exists account_holder_name     text check (account_holder_name is null or char_length(btrim(account_holder_name)) between 1 and 200),
  add column if not exists account_holder_email    text check (account_holder_email is null or (account_holder_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(account_holder_email) <= 320)),
  add column if not exists account_holder_phone    text check (account_holder_phone is null or char_length(account_holder_phone) <= 60),
  add column if not exists account_holder_location text check (account_holder_location is null or char_length(account_holder_location) <= 200),
  add column if not exists enquiry_id uuid references public.shelter_enquiries(id) on delete restrict,
  add column if not exists archived_at timestamptz;

create unique index if not exists shelters_enquiry_id_key on public.shelters (enquiry_id) where enquiry_id is not null;

-- THE website. A flag on the host row, not a pointer on shelters: removing the address removes the claim with it, so there is no dangling pointer.
alter table public.shelter_hosts add column if not exists is_primary boolean not null default false;
create unique index if not exists shelter_hosts_one_primary on public.shelter_hosts (shelter_id) where is_primary and shelter_id is not null;
-- A front-door address (shelter_id null) is never a shelter's website.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shelter_hosts_primary_has_shelter') then
    alter table public.shelter_hosts add constraint shelter_hosts_primary_has_shelter check (not is_primary or shelter_id is not null);
  end if;
end $$;

-- Backfill only where it is not a guess: a shelter with exactly one address. With several, none is marked; the app shows the oldest until
-- someone chooses (specification, section 3).
update public.shelter_hosts h set is_primary = true
 where h.shelter_id is not null and not h.is_primary
   and (select count(*) from public.shelter_hosts x where x.shelter_id = h.shelter_id) = 1
   and not exists (select 1 from public.shelter_hosts x where x.shelter_id = h.shelter_id and x.is_primary);

-- A shelter's first address becomes its website. Plain invoker trigger: it reads and sets only the row being inserted and its siblings.
create or replace function public.shelter_hosts_first_is_primary() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.shelter_id is not null and not new.is_primary
     and not exists (select 1 from public.shelter_hosts x where x.shelter_id = new.shelter_id and x.is_primary) then
    new.is_primary := true;
  end if;
  return new;
end;
$$;
drop trigger if exists shelter_hosts_first_is_primary on public.shelter_hosts;
create trigger shelter_hosts_first_is_primary before insert on public.shelter_hosts
  for each row execute function public.shelter_hosts_first_is_primary();

-- THE DOOR. Same signature and grants as 0426; one extra key, and id/site null while archived.
create or replace function resolve_shelter_site(p_host text) returns json
language sql stable security invoker set search_path = public, pg_temp as $$
  select json_build_object(
           'id',       case when s.archived_at is null then h.shelter_id end,
           'site',     case when s.archived_at is null then s.public_site end,
           'archived', s.archived_at is not null)
    from shelter_hosts h left join shelters s on s.id = h.shelter_id
   where h.host = normalise_request_host(p_host)
$$;
revoke all on function resolve_shelter_site(text) from public, anon, authenticated;
grant execute on function resolve_shelter_site(text) to service_role;

-- ---------------------------------------------------------------------------
-- The read. Everything in 0424's product_admin_shelters() unchanged, then eight columns. Archived shelters ARE listed (so they can be reopened).
-- ---------------------------------------------------------------------------
drop function if exists public.product_admin_shelters();
create function public.product_admin_shelters()
returns table (
  id uuid, key text, name text, created_at timestamptz, hosts text[],
  has_host boolean, has_admin_role boolean, has_admin_login boolean, has_receipts boolean, has_defaults boolean, has_site_content boolean,
  drive_status text, calendar_status text, display_name text, short_name text,
  primary_host text, account_holder_name text, account_holder_email text, account_holder_phone text, account_holder_location text,
  enquiry_id uuid, archived_at timestamptz, public_site text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare v_hdr text; v_ids uuid[]; v_id uuid;
begin
  if not public.is_product_admin() then return; end if;
  v_hdr := current_setting('request.headers', true);
  select array_agg(s0.id order by s0.created_at, s0.key) into v_ids from public.shelters s0;
  foreach v_id in array coalesce(v_ids, '{}'::uuid[]) loop
    perform set_config('request.headers', json_build_object('x-shelter-id', v_id::text)::text, true);
    return query
    select s.id, s.key, s.name, s.created_at,
           coalesce((select array_agg(h.host order by h.host) from public.shelter_hosts h where h.shelter_id = s.id), '{}'),
           exists (select 1 from public.shelter_hosts h where h.shelter_id = s.id),
           exists (select 1 from public.roles r where r.shelter_id = s.id and r.is_admin),
           exists (select 1 from public.roles r join public.user_roles ur on ur.role_id = r.id where r.shelter_id = s.id and r.is_admin),
           (s.receipt_series is not null and s.receipt_issuers is not null
              and exists (select 1 from public.receipt_counters rc where rc.shelter_id = s.id and rc.series = s.receipt_series)),
           (exists (select 1 from public.site_pages x where x.shelter_id = s.id)
              and exists (select 1 from public.public_stat_switches x where x.shelter_id = s.id)
              and exists (select 1 from public.bill_kinds x where x.shelter_id = s.id)
              and exists (select 1 from public.frequency x where x.shelter_id = s.id)),
           exists (select 1 from public.site_content c where c.shelter_id = s.id),
           coalesce((select case when d.oauth_client_id is null or d.oauth_client_secret_enc is null or d.refresh_token_enc is null then 'incomplete'
                                 when d.token_status = 'dead' then 'dead' else 'connected' end
                       from public.shelter_drive_credentials d where d.shelter_id = s.id), 'not_started'),
           coalesce((select case when c.calendar_id is null or c.oauth_client_id is null or c.oauth_client_secret_enc is null or c.refresh_token_enc is null then 'incomplete'
                                 when c.token_status = 'dead' then 'dead' else 'connected' end
                       from public.shelter_calendar_credentials c where c.shelter_id = s.id), 'not_started'),
           s.display_name, s.short_name,
           (select h.host from public.shelter_hosts h where h.shelter_id = s.id and h.is_primary),
           s.account_holder_name, s.account_holder_email, s.account_holder_phone, s.account_holder_location,
           s.enquiry_id, s.archived_at, s.public_site
      from public.shelters s
      where s.id = v_id;
  end loop;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Four writes. Each: product administrator, aal2, one named shelter. 0424's shape (header scoped to that shelter for the transaction only).
-- ---------------------------------------------------------------------------
create or replace function public.product_admin_set_shelter_account_holder(p_shelter uuid, p_name text, p_email text, p_phone text, p_location text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_name := btrim(coalesce(p_name, '')); p_email := nullif(btrim(coalesce(p_email, '')), '');
  p_phone := nullif(btrim(coalesce(p_phone, '')), ''); p_location := nullif(btrim(coalesce(p_location, '')), '');
  if p_name = '' or length(p_name) > 200 then raise exception 'the account holder needs a name (up to 200 characters)' using errcode = '22023'; end if;
  if p_email is not null and (p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 320) then raise exception 'that does not look like an email address' using errcode = '22023'; end if;
  if length(coalesce(p_phone, '')) > 60 or length(coalesce(p_location, '')) > 200 then raise exception 'phone is up to 60 characters, location up to 200' using errcode = '22023'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set account_holder_name = p_name, account_holder_email = p_email, account_holder_phone = p_phone, account_holder_location = p_location where id = p_shelter;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

-- p_archived true: stamp now (a second press keeps the first time). false: clear. Nothing else is touched (see the header).
create or replace function public.product_admin_set_shelter_archived(p_shelter uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set archived_at = case when p_archived then coalesce(archived_at, now()) end where id = p_shelter;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

-- Make one of the shelter's own addresses THE website. The old one is unmarked first so the unique index is never tripped.
create or replace function public.product_admin_set_primary_host(p_shelter uuid, p_host text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelter_hosts where shelter_id = p_shelter and host = lower(btrim(coalesce(p_host, '')))) then
    raise exception 'that address does not belong to this shelter' using errcode = '22023';
  end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelter_hosts set is_primary = false where shelter_id = p_shelter and is_primary;
  update public.shelter_hosts set is_primary = true where shelter_id = p_shelter and host = lower(btrim(p_host));
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

-- Carry an accepted enquiry's contact onto the shelter it became, so nothing is retyped. Fills only what the shelter does not have yet (a
-- typed value is never overwritten), links the two, and marks the enquiry 'created'. Repeating the same pair is a no-op; a shelter already
-- linked to a different enquiry, or an enquiry already carried to a different shelter, is refused (the unique index agrees).
create or replace function public.product_admin_carry_enquiry(p_shelter uuid, p_enquiry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text; e public.shelter_enquiries; s public.shelters;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  select * into s from public.shelters where id = p_shelter;
  if not found then raise exception 'no such shelter' using errcode = '22023'; end if;
  select * into e from public.shelter_enquiries where id = p_enquiry;
  if not found then raise exception 'no such enquiry' using errcode = '22023'; end if;
  if s.enquiry_id is not null and s.enquiry_id <> p_enquiry then raise exception 'this shelter already came from a different enquiry' using errcode = '22023'; end if;
  if e.status = 'declined' then raise exception 'that enquiry was declined' using errcode = '22023'; end if;
  if exists (select 1 from public.shelters x where x.enquiry_id = p_enquiry and x.id <> p_shelter) then raise exception 'that enquiry is already another shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set enquiry_id = p_enquiry,
         account_holder_name     = coalesce(account_holder_name, e.contact_name),
         account_holder_email    = coalesce(account_holder_email, e.email),
         account_holder_phone    = coalesce(account_holder_phone, e.phone),
         account_holder_location = coalesce(account_holder_location, e.location)
   where id = p_shelter;
  update public.shelter_enquiries set status = 'created', status_at = coalesce(status_at, now()) where id = p_enquiry and status <> 'created';
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_shelters() owner to rls_definer;
    alter function public.product_admin_set_shelter_account_holder(uuid, text, text, text, text) owner to rls_definer;
    alter function public.product_admin_set_shelter_archived(uuid, boolean) owner to rls_definer;
    alter function public.product_admin_set_primary_host(uuid, text) owner to rls_definer;
    alter function public.product_admin_carry_enquiry(uuid, uuid) owner to rls_definer;
  end if;
end $$;

revoke all on function public.product_admin_shelters(), public.product_admin_set_shelter_account_holder(uuid, text, text, text, text),
  public.product_admin_set_shelter_archived(uuid, boolean), public.product_admin_set_primary_host(uuid, text), public.product_admin_carry_enquiry(uuid, uuid) from public, anon;
grant execute on function public.product_admin_shelters(), public.product_admin_set_shelter_account_holder(uuid, text, text, text, text),
  public.product_admin_set_shelter_archived(uuid, boolean), public.product_admin_set_primary_host(uuid, text), public.product_admin_carry_enquiry(uuid, uuid) to authenticated, service_role;
