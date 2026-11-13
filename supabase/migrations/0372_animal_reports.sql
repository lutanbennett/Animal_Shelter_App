-- consumer: src/app/services/report-animal/actions.ts, src/app/services/report-animal/ReportForm.tsx, src/app/management/animal-reports/page.tsx, src/lib/animal-reports/form.ts
--
-- One public form for reporting an animal (#z1qn7): a stray, an injured animal, a welfare concern or a lost pet.
-- ONE table, the kind is a column. Written by anon (insert only, named columns, NO select) exactly as desexing sign-ups
-- are (0233, 0297): the browser's request id is the row's own id, so a replay hits the primary key (23505, treated as done).
-- Staff read and handle them with the new activity animal_report.manage, carried by the new card review_animal_reports.
-- No photo column yet: an anonymous file upload is its own abuse surface and is not built in this change.
-- Re-runnable. To undo: drop table animal_reports, then delete the card_grants / card_features rows for
-- review_animal_reports and the permission_activities row animal_report.manage.

insert into permission_activities (key, kind, area, sort)
values ('animal_report.manage', 'level', 'management', 93)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values ('review_animal_reports', 'animal_report.manage', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'review_animal_reports', f.id from features f where f.key = 'website_public_pages'
on conflict (card) do nothing;

create table if not exists animal_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  species text not null default 'unknown',
  description text not null,
  location text not null,
  reporter_name text,
  reporter_phone text,
  reporter_email text,
  status text not null default 'new',
  handled_by uuid references auth.users (id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint animal_reports_kind_check check (kind in ('stray', 'injured', 'welfare', 'lost')),
  constraint animal_reports_species_check check (species in ('dog', 'cat', 'other', 'unknown')),
  constraint animal_reports_status_check check (status in ('new', 'in_progress', 'resolved', 'dismissed')),
  constraint animal_reports_contact_check
    check (nullif(btrim(coalesce(reporter_phone, '')), '') is not null
        or nullif(btrim(coalesce(reporter_email, '')), '') is not null),
  constraint animal_reports_lengths_check
    check (char_length(btrim(description)) between 1 and 2000
       and char_length(btrim(location)) between 1 and 500
       and char_length(coalesce(reporter_name, '')) <= 120
       and char_length(coalesce(reporter_phone, '')) <= 40
       and char_length(coalesce(reporter_email, '')) <= 200)
);
create index if not exists animal_reports_created_idx on animal_reports (created_at desc);

comment on table animal_reports is
  'A member of the public reporting an animal (stray, injured, welfare concern, lost pet) (0372). Holds the reporter''s own contact. anon may INSERT named columns and may never SELECT; staff read and handle with animal_report.manage.';

alter table animal_reports enable row level security;

drop policy if exists animal_reports_anon_insert on animal_reports;
create policy animal_reports_anon_insert on animal_reports for insert to anon
  with check (status = 'new');
drop policy if exists animal_reports_select_perm on animal_reports;
create policy animal_reports_select_perm on animal_reports for select to authenticated
  using ((select has_permission('animal_report.manage', 'read')));
drop policy if exists animal_reports_update_perm on animal_reports;
create policy animal_reports_update_perm on animal_reports for update to authenticated
  using ((select has_permission('animal_report.manage')))
  with check ((select has_permission('animal_report.manage')));
drop policy if exists animal_reports_delete_perm on animal_reports;
create policy animal_reports_delete_perm on animal_reports for delete to authenticated
  using ((select has_permission('animal_report.manage')));

revoke all on animal_reports from anon, authenticated, service_role;
grant select, update, delete on animal_reports to authenticated, service_role;
grant insert (id, kind, species, description, location, reporter_name, reporter_phone, reporter_email)
  on animal_reports to anon;

-- Who handled it and when are the server's to set, not the client's.
create or replace function animal_reports_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;
drop trigger if exists animal_reports_stamp_trg on animal_reports;
create trigger animal_reports_stamp_trg before update on animal_reports
  for each row execute function animal_reports_stamp();
