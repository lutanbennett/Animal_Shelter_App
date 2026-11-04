-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/i18n/dictionaries/en.ts, src/lib/website/drafts.ts, src/app/photos/approve/page.tsx
--
-- ONE WEBSITE-APPROVAL PORTAL (item #7j2qf). Lutan, 2026-11-04: ONE approval activity across every tab.
--
-- THE POLICY READING THIS FILE RESTS ON (0163:30-35): site_content, site_content_photos and site_pages are each written
-- under ONE activity, website.content, with identical using and with check. A drafter who may save a draft but not publish
-- therefore cannot be a column on those tables. THE SPLIT IS DONE BY A SEPARATE TABLE INSTEAD of by splitting the policies:
--   * website_drafts holds a proposed change as a jsonb patch. A proposer (website.propose) can only write there.
--   * the live tables policies are NOT touched: website.content keeps exactly what it has and still publishes directly.
--   * approving applies the patch to the live row through approve_website_draft(), which asks website.approve.
-- Scoped to site_content (the singleton) and site_pages. site_content_photos is NOT drafted: a photo is a Drive file, and the
-- photo path is already approved through photos.approve in the same portal.
--
-- Two activities, two cards, no role given either (assigned on Settings then Who does what). Admin is never given a card.
-- These rows must equal src/lib/permissions/cards.ts cell for cell (check-card-grants.mjs).

insert into permission_activities (key, kind, area, sort)
values ('website.propose', 'yesno', 'settings', 80),
       ('website.approve', 'yesno', 'settings', 81)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values ('propose_website', 'website.propose', 2),
       ('approve_website', 'website.approve', 2),
       ('approve_website', 'photos.approve', 2),
       ('approve_website', 'photos.resident_manage', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select c.card, cf.feature_id from card_features cf, (values ('propose_website'), ('approve_website')) as c(card)
 where cf.card = 'run_fundraising_events'
on conflict (card) do update set feature_id = excluded.feature_id;

create table if not exists website_drafts (
  id          uuid primary key default gen_random_uuid(),
  target      text not null check (target in ('site_content', 'site_pages')),
  row_key     text not null,
  patch       jsonb not null check (jsonb_typeof(patch) = 'object'),
  proposed_by uuid references auth.users (id),
  proposed_at timestamptz not null default now(),
  unique (target, row_key)
);
alter table website_drafts enable row level security;
revoke all on website_drafts from public, anon, authenticated;
grant select on website_drafts to authenticated;
grant all on website_drafts to service_role;

drop policy if exists website_drafts_read on website_drafts;
create policy website_drafts_read on website_drafts for select to authenticated
  using ((select has_permission('website.approve') or has_permission('website.propose')));

create or replace function propose_website_draft(p_target text, p_row_key text, p_patch jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not (select has_permission('website.propose')) then
    raise exception 'website.propose is required to propose a website change' using errcode = '42501';
  end if;
  if p_target not in ('site_content', 'site_pages') then
    raise exception 'not a draftable table: %', p_target using errcode = '22023';
  end if;
  insert into website_drafts (target, row_key, patch, proposed_by)
  values (p_target, p_row_key, p_patch, (select auth.uid()))
  on conflict (target, row_key) do update
    set patch = excluded.patch, proposed_by = excluded.proposed_by, proposed_at = now()
  returning id into v_id;
  return v_id;
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
  select * into d from website_drafts where id = p_id;
  if not found then return false; end if;
  for k in select jsonb_object_keys(d.patch) loop
    if k in ('id', 'slug', 'updated_at', 'updated_by') or not exists (
         select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = d.target and c.column_name = k) then
      raise exception 'column % cannot be set by a draft on %', k, d.target using errcode = '22023';
    end if;
    v_sets := v_sets || format('%I = (select %I from jsonb_populate_record(null::%I, $1)), ', k, k, d.target);
  end loop;
  if v_sets <> '' then
    if d.target = 'site_content' then
      execute 'update site_content set ' || v_sets || 'updated_at = now(), updated_by = $2 where id'
        using d.patch, (select auth.uid());
    else
      execute 'update site_pages set ' || v_sets || 'updated_at = now(), updated_by = $2 where slug = $3'
        using d.patch, (select auth.uid()), d.row_key;
    end if;
  end if;
  delete from website_drafts where id = p_id;
  return true;
end;
$$;

create or replace function discard_website_draft(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not (select has_permission('website.approve')) then
    raise exception 'website.approve is required to discard a website change' using errcode = '42501';
  end if;
  delete from website_drafts where id = p_id;
  return found;
end;
$$;

revoke all on function propose_website_draft(text, text, jsonb) from public, anon;
revoke all on function approve_website_draft(uuid) from public, anon;
revoke all on function discard_website_draft(uuid) from public, anon;
grant execute on function propose_website_draft(text, text, jsonb) to authenticated, service_role;
grant execute on function approve_website_draft(uuid) to authenticated, service_role;
grant execute on function discard_website_draft(uuid) to authenticated, service_role;

comment on table website_drafts is 'A proposed website change waiting for approval (0315). Written only through propose_website_draft, published only through approve_website_draft. The live tables are untouched until then.';
