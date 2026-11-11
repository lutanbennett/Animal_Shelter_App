-- consumer: src/app/bills/page.tsx, src/lib/permissions/cards.ts, src/lib/permissions/catalogue.ts
-- A narrow view of maintenance jobs, so a Bills login can attach a bill to a job without being able to read the job board (#n9z65).
--
-- Lutan, 2026-11-11: "bills should be able to associate a bill with a job but not access the job board." The shape is the one
-- resident.who_and_where already has (0134, 0268, 0354): a narrow view, its own activity, the card holds the narrow activity,
-- and the code reads the view and never the table.
--
-- The activity is maintenance.job_picker (yes/no): it lets a card list jobs by code, title, status and last change, nothing more.
-- The view resolves through has_permission() (Admin passes inside it). maintenance's own select policy (maintenance.jobs read,
-- 0141) is NOT widened: that would let a Bills login read every job column through any query.
-- The bills card swaps maintenance.jobs read (0268) for maintenance.job_picker. Nothing else is granted it.
insert into permission_activities (key, kind, area, sort)
values ('maintenance.job_picker', 'yesno', 'maintenance', 89)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('bills', 'maintenance.job_picker', 2)
on conflict (card, activity) do update set level = excluded.level;

delete from card_grants where card = 'bills' and activity = 'maintenance.jobs';

create or replace view maintenance_job_picker as
select m.id, m.job_code, m.title, m.status, m.updated_at
  from maintenance m
 where (select has_permission('maintenance.job_picker'::text));

comment on view maintenance_job_picker is
  'Jobs a bill can be attached to: code, title, status, last change only (0355, #n9z65). For the Bills card; the job board itself still asks maintenance.jobs.';

revoke all on maintenance_job_picker from anon, authenticated, service_role;
grant select on maintenance_job_picker to authenticated, service_role;
