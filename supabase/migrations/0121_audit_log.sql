-- Audit trail for resident, medical and contact records (backlog DB-6).
-- Schema half only; the "recent changes" page and undo are a later item.
--
-- Until now only four tables carried updated_by and nothing kept a
-- before-image, so an accidental edit or delete was unrecoverable.
-- audit_log keeps one row per insert, update and delete on
--
--   residents, contacts, prescriptions, vet_appointments, weight,
--   attachments, immunization_records
--
--   table_name  which table
--   row_id      that row's id (no foreign key: the row may be deleted, and
--               the log must outlive it)
--   op          INSERT | UPDATE | DELETE
--   actor       auth.uid() of the session that did it; null for the service
--               role, a migration or a database console. Read from the
--               session, never from an argument. No foreign key either:
--               `on delete set null` would be an UPDATE of a history row.
--   old_row     the row before (UPDATE, DELETE), as jsonb; null for INSERT
--   new_row     the row after (INSERT, UPDATE), as jsonb; null for DELETE
--   at          clock_timestamp() of the write
--
-- WHAT IS COPIED. Whole rows, minus columns named as trigger arguments. The
-- log is admin-only, so a copy is not itself a leak, but it is a second
-- place the data lives and widens the blast radius of any later mistake on
-- this one table. The only exclusion is residents.microchip_number and
-- microchip_implanted_on (0113, staff-only by design): trivially cheap to
-- leave out, and nobody undoes an edit by restoring a chip number from a
-- log. Contacts keep phone, address and map URL: undoing a contact edit is
-- the point, and the table is admin-only. Recorded in
-- docs/decisions/2026-10-01-audit-log.md.
--
-- WHO CAN READ: admin only, in RLS. Nobody can write through the API: no
-- insert/update/delete policy exists, INSERT/UPDATE/DELETE/TRUNCATE are
-- revoked from every API role, and a trigger refuses UPDATE, DELETE and
-- TRUNCATE for everyone else (the table owner included) so history cannot be
-- quietly rewritten. The only writer is record_audit(), which runs as its
-- owner, writes only to audit_log, and takes nothing from the caller but the
-- names of columns to leave out (fixed at CREATE TRIGGER time).
--
-- An UPDATE that changes nothing (an updated_at touch that left every value
-- as it was, after exclusions) writes no row.
--
-- NOT DONE HERE: archived_at on the medical tables. See the decision file:
-- 0106's weight_one_per_day and the immunization key (named by ON CONFLICT
-- in 0002 and 0007) would collide with an archived row, and every reader of
-- those tables would have to learn to skip it. The before-image kept here is
-- what makes a hard delete recoverable in the meantime.
--
-- Written to be safely re-runnable.

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id uuid not null,
  op text not null,
  actor uuid,
  old_row jsonb,
  new_row jsonb,
  at timestamptz not null default clock_timestamp(),
  constraint audit_log_op_known check (op in ('INSERT', 'UPDATE', 'DELETE')),
  constraint audit_log_images_match_op check (
    (op = 'INSERT' and old_row is null and new_row is not null)
    or (op = 'UPDATE' and old_row is not null and new_row is not null)
    or (op = 'DELETE' and old_row is not null and new_row is null)
  )
);

create index if not exists audit_log_row_idx on audit_log (table_name, row_id, at desc);
create index if not exists audit_log_at_idx on audit_log (at desc);

comment on table audit_log is
  'Before/after images of every insert, update and delete on residents, contacts, prescriptions, vet_appointments, weight, attachments and immunization_records. Admin read only; written only by record_audit(); never updated or deleted.';
comment on column audit_log.actor is
  'auth.uid() of the session that made the change; null for the service role, migrations and console work. No foreign key, so removing a login never rewrites history.';
comment on column audit_log.old_row is
  'The row before the change as jsonb (UPDATE, DELETE). residents omits microchip_number and microchip_implanted_on.';

alter table audit_log enable row level security;

drop policy if exists admin_read_audit_log on audit_log;
create policy admin_read_audit_log on audit_log
  for select
  using (current_user_role() = 'admin');

-- Data API: a read for signed-in users (RLS narrows it to admin), nothing
-- else for anyone, anon included, service role included.
revoke all on audit_log from anon, authenticated, service_role;
grant select on audit_log to authenticated, service_role;

-- History is append-only, whoever asks.
create or replace function audit_log_refuse_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_log is append-only: % is not allowed', tg_op
    using errcode = 'insufficient_privilege';
end;
$$;

drop trigger if exists audit_log_no_update_delete on audit_log;
create trigger audit_log_no_update_delete
  before update or delete on audit_log
  for each row execute function audit_log_refuse_change();

drop trigger if exists audit_log_no_truncate on audit_log;
create trigger audit_log_no_truncate
  before truncate on audit_log
  for each statement execute function audit_log_refuse_change();

revoke execute on function audit_log_refuse_change() from public, anon, authenticated;

-- The one writer. Security definer so it can insert past the table's
-- missing insert policy; it touches nothing but audit_log. Trigger arguments
-- are column names to leave out of both images.
create or replace function record_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
  v_skip text[] := coalesce(tg_argv, array[]::text[]);
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - v_skip;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new) - v_skip;
  end if;

  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  v_id := coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid);

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row)
  values (tg_table_name, v_id, tg_op, auth.uid(), v_old, v_new);

  return null;
end;
$$;

revoke execute on function record_audit() from public, anon, authenticated;

drop trigger if exists audit_residents on residents;
create trigger audit_residents
  after insert or update or delete on residents
  for each row execute function record_audit('microchip_number', 'microchip_implanted_on');

drop trigger if exists audit_contacts on contacts;
create trigger audit_contacts
  after insert or update or delete on contacts
  for each row execute function record_audit();

drop trigger if exists audit_prescriptions on prescriptions;
create trigger audit_prescriptions
  after insert or update or delete on prescriptions
  for each row execute function record_audit();

drop trigger if exists audit_vet_appointments on vet_appointments;
create trigger audit_vet_appointments
  after insert or update or delete on vet_appointments
  for each row execute function record_audit();

drop trigger if exists audit_weight on weight;
create trigger audit_weight
  after insert or update or delete on weight
  for each row execute function record_audit();

drop trigger if exists audit_attachments on attachments;
create trigger audit_attachments
  after insert or update or delete on attachments
  for each row execute function record_audit();

drop trigger if exists audit_immunization_records on immunization_records;
create trigger audit_immunization_records
  after insert or update or delete on immunization_records
  for each row execute function record_audit();

notify pgrst, 'reload schema';
