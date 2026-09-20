-- Enclosure maintenance (backlog: Facility).
--
-- The `maintenance` table from 0001 was a placeholder shaped after the
-- requirements doc's example: a title, a status and a zone. Building the
-- feature needs a job to point at an enclosure (nullable — a zone-wide job
-- such as "re-gravel the walkway" has no single enclosure), a cost for
-- budgeting, a due date so the board can show what is overdue, and the
-- four status names the shelter actually uses. Files hang off the
-- polymorphic `attachments` table ('maintenance' has been an owner type
-- since 0001), tagged before/after so the UI can show the job as it was
-- found and as it was left. `maintenance_photos` (0001) stays unused —
-- attachments already carries every other file type in the app and is what
-- the photo proxy and the Drive helpers know about.

-- =========================================================================
-- 1. Status vocabulary: To Do → Not Started, Done → Completed
--
-- Confirmed with the user 2026-09-20 (closes decisions.md "still open"
-- item 3). ALTER TYPE ... RENAME VALUE is guarded so the file re-runs
-- cleanly on a database that already has the new names.
-- =========================================================================

do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'maintenance_status' and e.enumlabel = 'To Do'
  ) then
    alter type maintenance_status rename value 'To Do' to 'Not Started';
  end if;

  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'maintenance_status' and e.enumlabel = 'Done'
  ) then
    alter type maintenance_status rename value 'Done' to 'Completed';
  end if;
end;
$$;

-- The default still names the old value by text; re-point it.
alter table maintenance alter column status set default 'Not Started';

-- =========================================================================
-- 2. Columns
-- =========================================================================

alter table maintenance add column if not exists enclosure_id uuid references enclosures (id);
alter table maintenance add column if not exists estimated_cost numeric(12, 2);
alter table maintenance add column if not exists actual_cost numeric(12, 2);
alter table maintenance add column if not exists due_date date;
alter table maintenance add column if not exists updated_at timestamptz not null default now();

-- The job's own folder in Drive ("<M-0001> <Title>", under
-- .../<Zone>/<Enclosure>/<Status>/). Cached the way residents.drive_folder_id
-- is: a Drive move re-parents the folder and keeps its ID, so this stays
-- valid as the folder follows the job between status folders.
alter table maintenance add column if not exists drive_folder_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'maintenance_costs_nonnegative'
  ) then
    alter table maintenance add constraint maintenance_costs_nonnegative
      check (
        (estimated_cost is null or estimated_cost >= 0)
        and (actual_cost is null or actual_cost >= 0)
      );
  end if;
end;
$$;

create index if not exists maintenance_enclosure_id_idx on maintenance (enclosure_id);
create index if not exists maintenance_zone_id_idx on maintenance (zone_id);

-- =========================================================================
-- 3. Job code — "M-0001", the short identifier staff see and the leading
--    segment of the Drive folder name. Same shape and reasoning as
--    residents.animal_code (0012): sequential, permanent, meaningless
--    beyond creation order.
-- =========================================================================

create sequence if not exists maintenance_job_number_seq;

alter table maintenance add column if not exists job_code text;

with numbered as (
  select id, row_number() over (order by created_at, id) as rn
  from maintenance
  where job_code is null
)
update maintenance m
set job_code = 'M-' || lpad(numbered.rn::text, 4, '0')
from numbered
where numbered.id = m.id;

select setval(
  'maintenance_job_number_seq',
  greatest((select count(*) from maintenance), 1),
  (select count(*) > 0 from maintenance)
);

alter table maintenance
  alter column job_code set default ('M-' || lpad(nextval('maintenance_job_number_seq')::text, 4, '0')),
  alter column job_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'maintenance_job_code_key'
  ) then
    alter table maintenance add constraint maintenance_job_code_key unique (job_code);
  end if;
end;
$$;

-- =========================================================================
-- 4. Bookkeeping trigger
--
--  - An enclosure belongs to exactly one zone, so zone_id is derived from
--    enclosure_id whenever one is set: the two can't disagree, and callers
--    only have to supply the enclosure. Zone-wide jobs set zone_id alone.
--  - date_completed follows the status: stamped when a job is moved to
--    Completed, cleared if it is reopened, so the board's "completed this
--    month" reads off a column rather than an audit trail.
--  - updated_at, for ordering "recently touched" and for a future sync.
-- =========================================================================

create or replace function maintenance_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.enclosure_id is not null then
    select zone_id into new.zone_id from enclosures where id = new.enclosure_id;
  end if;

  if new.zone_id is null then
    raise exception 'A maintenance job needs a zone or an enclosure.';
  end if;

  if new.status = 'Completed' then
    new.date_completed := coalesce(new.date_completed, current_date);
  else
    new.date_completed := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists maintenance_before_write on maintenance;
create trigger maintenance_before_write
  before insert or update on maintenance
  for each row execute function maintenance_before_write();

-- =========================================================================
-- 5. Before / after on attachments
--
-- Files sit directly in the job's Drive folder (the user's chosen layout:
-- .../<Status>/<Job>/<file>), so the distinction is a tag rather than a
-- sub-folder. Nullable and only meaningful for owner_type = 'maintenance';
-- every other owner leaves it null.
-- =========================================================================

alter table attachments add column if not exists phase text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attachments_phase_check'
  ) then
    alter table attachments add constraint attachments_phase_check
      check (phase is null or phase in ('before', 'after'));
  end if;
end;
$$;
