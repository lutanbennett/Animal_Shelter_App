-- consumer: src/app/platform/actions.ts, src/app/platform/ProductAdminPanel.tsx, src/lib/shelter-settings.ts, src/lib/google/shelter-drive-tokens.ts, src/lib/google/shelter-google-connect.ts
-- #nmcol. Creating a shelter wrote only `name` (0414) and the names form wrote only `display_name`/`short_name` (0424), so one idea
-- lived in three columns kept in step by nobody. `name` is NOT legacy: Drive/Google connect and the Drive-token alert read it as the
-- shelter's label. So the three are kept in step by the write paths: create sets all three from the one name typed (short name
-- defaults to it, editable afterwards), and saving the names writes `name` = the full name too.
-- Backfill fills only NULLs from `name`; it never overwrites a typed value. Disagreeing rows (name <> display_name) are a data step, not run here.
-- Re-runnable. TO UNDO: re-apply 0414's product_admin_create_shelter and 0424's product_admin_set_shelter_names.
create or replace function public.product_admin_create_shelter(p_key text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_key := lower(btrim(coalesce(p_key, '')));
  p_name := btrim(coalesce(p_name, ''));
  if p_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid shelter key' using errcode = '22023'; end if;
  if p_name = '' then raise exception 'shelter name required' using errcode = '22023'; end if;
  if length(p_name) > 120 then raise exception 'shelter name too long (120 characters)' using errcode = '22023'; end if;
  if exists (select 1 from public.shelters where key = p_key) then raise exception 'shelter key already exists' using errcode = '23505'; end if;
  insert into public.shelters (key, name, display_name, short_name) values (p_key, p_name, p_name, left(p_name, 60)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.product_admin_set_shelter_names(p_shelter uuid, p_display_name text, p_short_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_display_name := btrim(coalesce(p_display_name, ''));
  p_short_name := btrim(coalesce(p_short_name, ''));
  if p_display_name = '' or p_short_name = '' or length(p_display_name) > 120 or length(p_short_name) > 60 then
    raise exception 'both names are required (full name up to 120 characters, short name up to 60)' using errcode = '22023';
  end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set display_name = p_display_name, short_name = p_short_name, name = p_display_name where id = p_shelter;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_create_shelter(text, text) owner to rls_definer;
    alter function public.product_admin_set_shelter_names(uuid, text, text) owner to rls_definer;
  end if;
end $$;

update public.shelters set display_name = name where display_name is null or btrim(display_name) = '';
update public.shelters set short_name = left(name, 60) where short_name is null or btrim(short_name) = '';
