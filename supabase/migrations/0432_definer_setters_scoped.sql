-- consumer: src/app/admin/website/actions.ts
--
-- #h3ro9: the flaw 0431 fixed in set_shelter_logo() was in its model, set_hero_photo() (0274, 0351). A security definer function runs as the
-- owner, so the shelter_scope_* policies (0392) never apply to it; `where id = true` then matched EVERY shelter's site_content row and one
-- shelter's hero upload overwrote all the others'. Swept for the same shape (constant-key update inside a definer function): the only other
-- hit on a per-shelter table is approve_website_draft() (0315), which updates site_content `where id` and site_pages by slug alone and
-- reads/deletes the draft by id alone. All of them now also ask for the request's shelter. A trusted caller with no header (null) matches
-- nothing, deliberately, as in 0431. docs/decisions/2026-11-21-hero-photo-shelter-scope.md.
-- Re-runnable. To undo: re-run 0351's set_hero_photo and 0315's approve_website_draft.

create or replace function public.set_hero_photo(p_drive_file_id text)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('website.gallery')), false) then
    raise exception 'photo.website_not_allowed' using errcode = '42501';
  end if;
  update site_content set hero_drive_file_id = nullif(btrim(p_drive_file_id), '')
   where id = true and shelter_id = (select current_shelter_id());
end;
$$;

create or replace function approve_website_draft(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  d website_drafts;
  k text;
  v_sets text := '';
begin
  if not (select has_permission('website.approve')) then
    raise exception 'website.approve is required to publish a website change' using errcode = '42501';
  end if;
  select * into d from website_drafts where id = p_id and shelter_id = (select current_shelter_id());
  if not found then return false; end if;
  for k in select jsonb_object_keys(d.patch) loop
    if k in ('id', 'slug', 'shelter_id', 'updated_at', 'updated_by') or not exists (
         select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = d.target and c.column_name = k) then
      raise exception 'column % cannot be set by a draft on %', k, d.target using errcode = '22023';
    end if;
    v_sets := v_sets || format('%I = (select %I from jsonb_populate_record(null::%I, $1)), ', k, k, d.target);
  end loop;
  if v_sets <> '' then
    if d.target = 'site_content' then
      execute 'update site_content set ' || v_sets || 'updated_at = now(), updated_by = $2 where id and shelter_id = $3'
        using d.patch, (select auth.uid()), d.shelter_id;
    else
      execute 'update site_pages set ' || v_sets || 'updated_at = now(), updated_by = $2 where slug = $3 and shelter_id = $4'
        using d.patch, (select auth.uid()), d.row_key, d.shelter_id;
    end if;
  end if;
  delete from website_drafts where id = p_id and shelter_id = d.shelter_id;
  return true;
end;
$$;

revoke all on function public.set_hero_photo(text) from public, anon;
grant execute on function public.set_hero_photo(text) to authenticated, service_role;
revoke all on function approve_website_draft(uuid) from public, anon;
grant execute on function approve_website_draft(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
